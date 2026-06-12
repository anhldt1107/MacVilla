import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { ApiRequestError } from "@/services/api/apiEnvelope";
import { fetchAdminCustomerDetail } from "@/services/admin/adminCustomersApi";
import { fetchAdminContracts } from "@/services/admin/adminContractsApi";
import { convertAdminQuoteToOrder } from "@/services/admin/adminQuotesApi";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const CONVERT_ORDER_PAYMENT_OPTIONS = [
  { value: "Cash", label: "Tiền mặt" },
  { value: "BankTransfer", label: "Chuyển khoản" },
];

const draftSelectClass = cn(
  "h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-foreground shadow-sm",
  "focus-visible:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20",
  "dark:border-slate-700 dark:bg-slate-950"
);

const noteTextareaClass = cn(
  "min-h-[80px] w-full resize-y rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm",
  "focus-visible:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20",
  "dark:border-slate-700 dark:bg-slate-950"
);

function pick(row, camel, pascal) {
  if (!row || typeof row !== "object") return undefined;
  return row[camel] ?? row[pascal];
}

/**
 * @param {object} props
 * @param {boolean} props.open
 * @param {(open: boolean) => void} props.onOpenChange
 * @param {string | null} props.accessToken
 * @param {number | string} props.quoteId
 * @param {string} [props.quoteCode]
 * @param {number | null | undefined} props.customerId
 * @param {string} props.ordersListPath
 * @param {string} props.customersListPath
 * @param {(order: object) => void} [props.onConverted]
 */
export function QuoteConvertToOrderDialog({
  open,
  onOpenChange,
  accessToken,
  quoteId,
  quoteCode,
  customerId,
  ordersListPath,
  customersListPath,
  onConverted,
}) {
  const [bootstrapLoading, setBootstrapLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [note, setNote] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("BankTransfer");
  const [contractId, setContractId] = useState("");
  const [shippingId, setShippingId] = useState("");
  const [addresses, setAddresses] = useState([]);
  const [contracts, setContracts] = useState([]);

  const loadBootstrap = useCallback(async () => {
    if (!accessToken || !quoteId || customerId == null) return;
    setBootstrapLoading(true);
    setError("");
    try {
      const [cust, ctrList] = await Promise.all([
        fetchAdminCustomerDetail(accessToken, customerId),
        fetchAdminContracts(accessToken, { quoteId: Number(quoteId), pageSize: 50 }),
      ]);
      const addrs = Array.isArray(cust?.addresses) ? cust.addresses : [];
      setAddresses(addrs);
      const def = addrs.find((a) => a.isDefault) ?? addrs[0];
      setShippingId(def?.id != null ? String(def.id) : "");
      setContracts(Array.isArray(ctrList?.items) ? ctrList.items : []);
    } catch (e) {
      const msg =
        e instanceof ApiRequestError ? e.message : e instanceof Error ? e.message : "Không tải được dữ liệu.";
      setError(msg);
      setAddresses([]);
      setContracts([]);
      setShippingId("");
    } finally {
      setBootstrapLoading(false);
    }
  }, [accessToken, quoteId, customerId]);

  useEffect(() => {
    if (!open) return;
    setNote("");
    setPaymentMethod("BankTransfer");
    setContractId("");
    setError("");
    if (customerId == null) {
      setError("Báo giá thiếu khách hàng — không thể chuyển đơn.");
      setAddresses([]);
      setContracts([]);
      setShippingId("");
      return;
    }
    void loadBootstrap();
  }, [open, customerId, loadBootstrap]);

  const handleSubmit = async () => {
    if (!accessToken || !quoteId || submitting) return;
    const sid = Number(shippingId);
    if (!Number.isFinite(sid) || sid < 1) {
      setError("Chọn địa chỉ giao hàng.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const order = await convertAdminQuoteToOrder(accessToken, quoteId, {
        shippingAddressId: sid,
        paymentMethod,
        note: note.trim() || null,
        contractId: contractId.trim() ? Number(contractId) : null,
      });
      onOpenChange(false);
      onConverted?.(order);
    } catch (e) {
      const msg =
        e instanceof ApiRequestError ? e.message : e instanceof Error ? e.message : "Chuyển đơn thất bại.";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[min(90vh,640px)] gap-0 overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Chuyển báo giá thành đơn hàng</DialogTitle>
          <DialogDescription>
            Báo giá <span className="font-mono font-semibold text-foreground">{quoteCode ?? `#${quoteId}`}</span>
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 px-1 py-2">
          {bootstrapLoading ? (
            <div className="flex flex-col items-center gap-2 py-10 text-slate-500">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-600/80" aria-hidden />
              <span className="text-sm">Đang tải địa chỉ giao & hợp đồng…</span>
            </div>
          ) : (
            <>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400" htmlFor="mgr-convert-ship">
                  Địa chỉ giao hàng
                </label>
                {addresses.length === 0 ? (
                  <p className="text-sm text-amber-800 dark:text-amber-200">
                    Khách chưa có địa chỉ giao.
                    {customerId != null ? (
                      <>
                        {" "}
                        <Link
                          to={`${customersListPath}/${customerId}`}
                          className="font-medium text-indigo-600 underline-offset-2 hover:underline dark:text-indigo-400"
                        >
                          Thêm tại hồ sơ khách
                        </Link>
                      </>
                    ) : null}
                  </p>
                ) : (
                  <select
                    id="mgr-convert-ship"
                    className={draftSelectClass}
                    value={shippingId}
                    onChange={(e) => setShippingId(e.target.value)}
                    disabled={submitting}
                  >
                    {addresses.map((a) => (
                      <option key={a.id} value={String(a.id)}>
                        {(a.receiverName ?? "—") + " · " + (a.receiverPhone ?? "—") + " — " + (a.addressLine ?? "")}
                        {a.isDefault ? " (mặc định)" : ""}
                      </option>
                    ))}
                  </select>
                )}
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400" htmlFor="mgr-convert-pay">
                  Phương thức thanh toán
                </label>
                <select
                  id="mgr-convert-pay"
                  className={draftSelectClass}
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  disabled={submitting}
                >
                  {CONVERT_ORDER_PAYMENT_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400" htmlFor="mgr-convert-contract">
                  Hợp đồng (tuỳ chọn)
                </label>
                <select
                  id="mgr-convert-contract"
                  className={draftSelectClass}
                  value={contractId}
                  onChange={(e) => setContractId(e.target.value)}
                  disabled={submitting}
                >
                  <option value="">Không gắn hợp đồng</option>
                  {contracts
                    .filter((c) => {
                      const st = String(pick(c, "status", "Status") ?? "")
                        .trim()
                        .toLowerCase();
                      return st === "confirmed" || st === "active";
                    })
                    .map((c) => {
                      const cid = pick(c, "id", "Id");
                      const num = pick(c, "contractNumber", "ContractNumber");
                      const st = pick(c, "status", "Status");
                      return (
                        <option key={String(cid)} value={String(cid)}>
                          {(num ?? `#${cid}`) + " — " + (st ?? "")}
                        </option>
                      );
                    })}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400" htmlFor="mgr-convert-note">
                  Ghi chú đơn (tuỳ chọn)
                </label>
                <textarea
                  id="mgr-convert-note"
                  className={noteTextareaClass}
                  rows={3}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  disabled={submitting}
                />
              </div>
            </>
          )}
          {error ? (
            <p className="text-sm text-red-600 dark:text-red-400" role="alert">
              {error}
            </p>
          ) : null}
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" disabled={submitting} onClick={() => onOpenChange(false)}>
            Đóng
          </Button>
          <Button
            type="button"
            className="gap-1.5 bg-emerald-600 hover:bg-emerald-700"
            disabled={submitting || bootstrapLoading || addresses.length === 0 || !shippingId.trim()}
            onClick={() => void handleSubmit()}
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
            Xác nhận chuyển đơn
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
