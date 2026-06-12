import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { ApiRequestError } from "@/services/api/apiEnvelope";
import {
  adminReturnStatusBadgeClass,
  completeAdminReturn,
  fetchAdminReturnDetail,
  fetchAdminReturnStatuses,
  localizeAdminReturnInventoryActionOptions,
  labelAdminReturnStatus,
  labelAdminReturnType,
  receiveAdminReturnItems,
  startProcessingAdminReturn,
} from "@/services/admin/adminReturnsApi";
import { ReturnStatusStepper } from "@/components/returns/ReturnStatusStepper";
import { ReturnDetailActions } from "@/components/returns/ReturnDetailActions";
import { ReturnCompleteLineSummary, ReturnItemsTable } from "@/components/returns/ReturnItemsTable";
import { ChevronRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FieldHint } from "@/components/ui/FieldHint";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const LIST = "/stock-manager/returns";

const fieldInput = cn(
  "h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm",
  "dark:border-slate-700 dark:bg-slate-950"
);

function pick(obj, camel, pascal) {
  if (!obj || typeof obj !== "object") return undefined;
  if (obj[camel] != null) return obj[camel];
  if (obj[pascal] != null) return obj[pascal];
  return undefined;
}

function lineItemId(row) {
  const o = row && typeof row === "object" ? row : {};
  const id = o.returnItemId ?? o.ReturnItemId ?? o.id ?? o.Id;
  return id != null && Number.isFinite(Number(id)) ? Number(id) : null;
}

export function StockManagerReturnDetailPage() {
  const { id } = useParams();
  const { accessToken, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [detail, setDetail] = useState(null);
  const [statusOptions, setStatusOptions] = useState([]);
  const [inventoryOptions, setInventoryOptions] = useState([]);
  const [busy, setBusy] = useState(false);
  const [completeOpen, setCompleteOpen] = useState(false);
  const [completeNote, setCompleteNote] = useState("");
  const [createRefund, setCreateRefund] = useState(true);
  const [completeActions, setCompleteActions] = useState({});
  const [completeError, setCompleteError] = useState("");

  const load = useCallback(async () => {
    if (!accessToken || !id) return;
    setLoading(true);
    setError("");
    try {
      const d = await fetchAdminReturnDetail(accessToken, id);
      setDetail(d && typeof d === "object" ? d : null);
      const items = Array.isArray(d?.items ?? d?.Items) ? (d.items ?? d.Items) : [];
      const next = {};
      for (const row of items) {
        const rid = lineItemId(row);
        if (rid != null) next[rid] = "Restock";
      }
      setCompleteActions(next);
      const typ = String(d?.type ?? d?.Type ?? "").toLowerCase();
      setCreateRefund(typ === "return");
    } catch (e) {
      setError(e instanceof ApiRequestError ? e.message : "Lỗi tải phiếu");
    } finally {
      setLoading(false);
    }
  }, [accessToken, id]);

  useEffect(() => {
    if (!isAuthenticated) return;
    void load();
    fetchAdminReturnStatuses(accessToken).then(({ returnStatuses, inventoryActions }) => {
      setStatusOptions(returnStatuses);
      setInventoryOptions(inventoryActions);
    }).catch(() => {});
  }, [accessToken, isAuthenticated, load]);

  const st = detail ? String(pick(detail, "status", "Status") ?? "") : "";
  const ty = detail ? String(pick(detail, "type", "Type") ?? "") : "";
  const lineItems = useMemo(() => {
    const raw = detail ? pick(detail, "items", "Items") : null;
    return Array.isArray(raw) ? raw : [];
  }, [detail]);

  const runTransition = async (fn) => {
    if (!accessToken || !id || busy) return;
    setBusy(true);
    try {
      const updated = await fn();
      setDetail(updated && typeof updated === "object" ? updated : detail);
    } catch (e) {
      setError(e instanceof ApiRequestError ? e.message : "Thao tác thất bại");
    } finally {
      setBusy(false);
    }
  };

  const submitComplete = async () => {
    const ids = Object.keys(completeActions).map(Number).filter(Number.isFinite);
    if (!ids.length) {
      setCompleteError("Không có dòng hàng.");
      return;
    }
    setBusy(true);
    setCompleteError("");
    try {
      const body = {
        items: ids.map((returnItemId) => ({
          returnItemId,
          inventoryAction: completeActions[returnItemId] || "Restock",
        })),
        createRefund,
      };
      const n = completeNote.trim();
      if (n) body.internalNote = n;
      const updated = await completeAdminReturn(accessToken, id, body);
      setDetail(updated);
      setCompleteOpen(false);
    } catch (e) {
      setCompleteError(e instanceof ApiRequestError ? e.message : "Hoàn tất thất bại");
    } finally {
      setBusy(false);
    }
  };

  const invOpts = localizeAdminReturnInventoryActionOptions(inventoryOptions);

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-10">
      <nav className="flex items-center gap-1 text-xs text-slate-500">
        <Link to="/stock-manager">Kho</Link>
        <ChevronRight className="h-3 w-3" />
        <Link to={LIST}>Đổi trả</Link>
        <ChevronRight className="h-3 w-3" />
        <span className="font-semibold text-slate-800">#{id}</span>
      </nav>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
        </div>
      ) : error && !detail ? (
        <p className="text-red-600">{error}</p>
      ) : detail ? (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="flex flex-wrap items-center gap-2 text-lg">
                {pick(detail, "ticketNumber", "TicketNumber") ?? `#${id}`}
                <span className={adminReturnStatusBadgeClass(st)}>
                  {labelAdminReturnStatus(st, statusOptions)}
                </span>
                <span className="text-sm font-normal text-slate-500">{labelAdminReturnType(ty, [])}</span>
              </CardTitle>
              <ReturnStatusStepper status={st} statusOptions={statusOptions} />
            </CardHeader>
            <CardContent>
              <ReturnDetailActions
                roleShell="stock"
                status={st}
                busy={busy}
                onStartProcessing={() =>
                  runTransition(() => startProcessingAdminReturn(accessToken, id, {}))
                }
                onReceiveItems={() =>
                  runTransition(() => receiveAdminReturnItems(accessToken, id, {}))
                }
                onCompleteClick={() => setCompleteOpen(true)}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Dòng hàng trả</CardTitle>
            </CardHeader>
            <CardContent className="divide-y divide-slate-100 p-0 dark:divide-slate-800">
              {lineItems.length === 0 ? (
                <p className="px-6 py-8 text-center text-sm text-slate-500">Không có dòng.</p>
              ) : (
                <ReturnItemsTable items={lineItems} />
              )}
            </CardContent>
          </Card>
        </>
      ) : null}

      <Dialog open={completeOpen} onOpenChange={setCompleteOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Hoàn tất — xử lý kho</DialogTitle>
          </DialogHeader>
          {lineItems.map((row, idx) => {
            const rid = lineItemId(row);
            if (rid == null) return null;
            return (
              <div key={rid} className="rounded border p-2 text-sm">
                <p className="mb-2 text-[10px] font-semibold uppercase text-slate-500">Dòng #{idx + 1}</p>
                <ReturnCompleteLineSummary row={row} quantity={pick(row, "quantity", "Quantity")} />
                <label className="mt-2 flex items-center gap-1 text-xs font-semibold uppercase text-slate-500">
                  Xử lý kho
                  <FieldHint text="Nhập lại kho: có thể bán cho khách khác. Thanh lý / chờ kiểm tra: không tăng tồn bán." />
                </label>
                <select
                  className={cn(fieldInput, "mt-2")}
                  value={completeActions[rid] || "Restock"}
                  onChange={(e) => setCompleteActions((p) => ({ ...p, [rid]: e.target.value }))}
                >
                  {invOpts.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
            );
          })}
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={createRefund} onChange={(e) => setCreateRefund(e.target.checked)} />
            Tạo hoàn tiền ngay
          </label>
          <textarea
            className={cn(fieldInput, "min-h-[60px] py-2")}
            placeholder="Ghi chú kho"
            value={completeNote}
            onChange={(e) => setCompleteNote(e.target.value)}
          />
          {completeError ? <p className="text-sm text-red-600">{completeError}</p> : null}
          <DialogFooter>
            <Button variant="outline" onClick={() => setCompleteOpen(false)}>
              Hủy
            </Button>
            <Button disabled={busy} onClick={() => void submitComplete()}>
              Xác nhận hoàn tất
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
