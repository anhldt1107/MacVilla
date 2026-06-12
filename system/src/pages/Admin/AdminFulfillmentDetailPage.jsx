import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { ApiRequestError } from "@/services/api/apiEnvelope";
import { FulfillmentAssignWorkerDialog } from "@/components/Admin/fulfillments/FulfillmentAssignWorkerDialog";
import { FulfillmentStatusUpdateDialog } from "@/components/Admin/fulfillments/FulfillmentStatusUpdateDialog";
import {
  fetchAdminFulfillmentDetail,
  fulfillmentDetailToListItem,
  isFulfillmentWorkerUnassigned,
  labelFulfillmentStatus,
  labelFulfillmentTicketType,
} from "@/services/admin/adminFulfillmentsApi";
import { ChevronRight, ExternalLink, Loader2, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const FULFILLMENTS_LIST_PATH = "/admin/logistics/fulfillments";
const ORDERS_PATH = "/admin/sales/orders";

function formatDateTime(iso) {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    return d.toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return String(iso);
  }
}

function fulfillmentStatusBadgeClass(status) {
  const s = (status || "").toLowerCase();
  if (s === "pending") {
    return "bg-amber-50 text-amber-950 ring-1 ring-amber-200/90 dark:bg-amber-950/35 dark:text-amber-100 dark:ring-amber-800/50";
  }
  if (s === "picking") {
    return "bg-sky-50 text-sky-950 ring-1 ring-sky-200/90 dark:bg-sky-950/40 dark:text-sky-100 dark:ring-sky-800/50";
  }
  if (s === "packed") {
    return "bg-violet-50 text-violet-950 ring-1 ring-violet-200/90 dark:bg-violet-950/35 dark:text-violet-100 dark:ring-violet-800/50";
  }
  if (s === "shipped") {
    return "bg-emerald-50 text-emerald-900 ring-1 ring-emerald-200/90 dark:bg-emerald-950/40 dark:text-emerald-100 dark:ring-emerald-800/50";
  }
  return "bg-slate-100 text-slate-800 ring-1 ring-slate-200/80 dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-600";
}

/**
 * @param {Record<string, unknown> | null | undefined} obj
 * @param {string} camel
 * @param {string} pascal
 */
function pick(obj, camel, pascal) {
  if (!obj || typeof obj !== "object") return undefined;
  if (obj[camel] !== undefined && obj[camel] !== null) return obj[camel];
  if (obj[pascal] !== undefined && obj[pascal] !== null) return obj[pascal];
  return undefined;
}

/**
 * GET chi tiết phiếu —  (chi tiết + đơn).
 */
export function AdminFulfillmentDetailPage() {
  const { id: idParam } = useParams();
  const { accessToken, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [detail, setDetail] = useState(/** @type {Record<string, unknown> | null} */ (null));
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);

  const id = String(idParam ?? "").trim();

  const load = useCallback(async () => {
    if (!isAuthenticated || !accessToken || !id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const d = await fetchAdminFulfillmentDetail(accessToken, id);
      setDetail(d && typeof d === "object" ? /** @type {Record<string, unknown>} */ (d) : null);
    } catch (e) {
      const msg =
        e instanceof ApiRequestError
          ? e.message
          : e instanceof Error
            ? e.message
            : "Không tải được chi tiết phiếu công việc.";
      setError(msg);
      setDetail(null);
    } finally {
      setLoading(false);
    }
  }, [accessToken, isAuthenticated, id]);

  useEffect(() => {
    void load();
  }, [load]);

  const patchFromApiResponse = (payload) => {
    if (!payload || typeof payload !== "object") return;
    const p = /** @type {Record<string, unknown>} */ (payload);
    const fid = pick(p, "id", "Id");
    if (fid == null) return;
    setDetail((prev) => {
      if (!prev) return p;
      const prevId = pick(prev, "id", "Id");
      if (String(prevId) !== String(fid)) return prev;
      return { ...prev, ...p };
    });
  };

  const fid = detail ? pick(detail, "id", "Id") : null;
  const orderId = detail ? pick(detail, "orderId", "OrderId") : null;
  const orderCode =
    (detail &&
      (() => {
        const ord = pick(detail, "order", "Order");
        if (ord && typeof ord === "object") {
          const o = /** @type {Record<string, unknown>} */ (ord);
          return pick(o, "orderCode", "OrderCode");
        }
        return pick(detail, "orderCode", "OrderCode");
      })()) ??
    "";
  const status = detail ? String(pick(detail, "status", "Status") ?? "") : "";
  const ticketType = detail ? String(pick(detail, "ticketType", "TicketType") ?? "") : "";
  const notes = detail ? pick(detail, "notes", "Notes") : null;
  const createdAt = detail ? pick(detail, "createdAt", "CreatedAt") : null;
  const updatedAt = detail ? pick(detail, "updatedAt", "UpdatedAt") : null;
  const assignedWorkerName = detail ? pick(detail, "assignedWorkerName", "AssignedWorkerName") : null;
  const assignedWorkerId = detail ? pick(detail, "assignedWorkerId", "AssignedWorkerId") : null;
  const createdByName = detail ? pick(detail, "createdByName", "CreatedByName") : null;

  const listRowForDialogs =
    detail && fid != null
      ? fulfillmentDetailToListItem(
          /** @type {import("@/services/admin/adminFulfillmentsApi").AdminFulfillmentStatusUpdateData} */ ({
            id: Number(fid),
            orderId: orderId != null ? Number(orderId) : 0,
            orderCode: String(orderCode || ""),
            ticketType: ticketType || "",
            status: status || "",
            notes: notes != null ? String(notes) : undefined,
            createdAt: createdAt != null ? String(createdAt) : "",
            updatedAt: updatedAt != null ? String(updatedAt) : "",
            assignedWorkerId: assignedWorkerId != null ? Number(assignedWorkerId) : null,
            assignedWorkerName: assignedWorkerName != null ? String(assignedWorkerName) : null,
            createdByName: createdByName != null ? String(createdByName) : null,
          }),
          null
        )
      : null;

  const orderBlock = detail ? pick(detail, "order", "Order") : null;
  const orderObj = orderBlock && typeof orderBlock === "object" ? /** @type {Record<string, unknown>} */ (orderBlock) : null;
  const orderCustomer = orderObj ? pick(orderObj, "customer", "Customer") : null;
  const cust =
    orderCustomer && typeof orderCustomer === "object" ? /** @type {Record<string, unknown>} */ (orderCustomer) : null;

  return (
    <div className="mx-auto max-w-4xl space-y-8 pb-10">
      <nav className="flex flex-wrap items-center gap-1 text-xs font-medium text-slate-500 dark:text-slate-400" aria-label="Breadcrumb">
        <Link
          to="/admin"
          className="rounded-md px-1.5 py-0.5 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-slate-100"
        >
          Dashboard
        </Link>
        <ChevronRight className="h-3.5 w-3.5 shrink-0 opacity-60" aria-hidden />
        <Link
          to={FULFILLMENTS_LIST_PATH}
          className="rounded-md px-1.5 py-0.5 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-slate-100"
        >
          Phiếu công việc
        </Link>
        <ChevronRight className="h-3.5 w-3.5 shrink-0 opacity-60" aria-hidden />
        <span className="px-1.5 py-0.5 font-semibold text-slate-800 dark:text-slate-200">
          #{id || "—"}
        </span>
      </nav>

      <FulfillmentStatusUpdateDialog
        open={statusDialogOpen}
        onOpenChange={setStatusDialogOpen}
        fulfillment={
          listRowForDialogs
            ? { id: listRowForDialogs.id, orderCode: listRowForDialogs.orderCode, status: listRowForDialogs.status }
            : null
        }
        accessToken={accessToken}
        onUpdated={patchFromApiResponse}
      />
      <FulfillmentAssignWorkerDialog
        open={assignDialogOpen}
        onOpenChange={setAssignDialogOpen}
        fulfillment={listRowForDialogs ? { id: listRowForDialogs.id, orderCode: listRowForDialogs.orderCode } : null}
        accessToken={accessToken}
        onAssigned={patchFromApiResponse}
      />

      {loading && !detail ? (
        <div className="flex flex-col items-center justify-center gap-3 py-20 text-slate-500">
          <Loader2 className="h-10 w-10 animate-spin text-teal-600/70" aria-hidden />
          <span className="text-sm font-medium">Đang tải phiếu…</span>
        </div>
      ) : null}

      {error && !loading ? (
        <div
          className="rounded-xl border border-red-200/90 bg-red-50/90 px-4 py-3 text-sm text-red-800 dark:border-red-900/40 dark:bg-red-950/35 dark:text-red-200"
          role="alert"
        >
          {error}
        </div>
      ) : null}

      {!loading && !error && detail ? (
        <>
          <header className="border-b border-slate-200/90 pb-6 dark:border-slate-800">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0 space-y-2">
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                  Chi tiết phiếu công việc
                </p>
                <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">
                  Phiếu #{fid}
                </h1>
                <p className="font-mono text-sm text-slate-600 dark:text-slate-400">
                  Đơn {orderCode ? String(orderCode) : "—"}
                  {orderId != null ? <span className="ml-2 text-slate-500">· ID đơn #{String(orderId)}</span> : null}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  className={cn(
                    "inline-flex cursor-pointer rounded-full px-3 py-1 text-xs font-semibold transition",
                    "hover:brightness-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500",
                    fulfillmentStatusBadgeClass(status)
                  )}
                  onClick={() => setStatusDialogOpen(true)}
                >
                  {labelFulfillmentStatus(status)}
                </button>
                {listRowForDialogs && isFulfillmentWorkerUnassigned(listRowForDialogs) ? (
                  <Button type="button" size="sm" variant="outline" onClick={() => setAssignDialogOpen(true)}>
                    Gán Worker
                  </Button>
                ) : null}
              </div>
            </div>
          </header>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="border-slate-200/80 shadow-sm dark:border-slate-800">
              <CardHeader>
                <CardTitle className="text-base">Thông tin phiếu</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between gap-4">
                  <span className="text-slate-500 dark:text-slate-400">Hình thức giao</span>
                  <span className="font-medium text-slate-900 dark:text-slate-100">{labelFulfillmentTicketType(ticketType)}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-slate-500 dark:text-slate-400">Người tạo</span>
                  <span className="text-right font-medium text-slate-800 dark:text-slate-200">
                    {createdByName != null ? String(createdByName) : "—"}
                  </span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-slate-500 dark:text-slate-400">NV phụ trách</span>
                  <span className="text-right font-medium text-slate-800 dark:text-slate-200">
                    {assignedWorkerName != null ? String(assignedWorkerName) : "—"}
                  </span>
                </div>
                <div className="flex justify-between gap-4 border-t border-slate-100 pt-3 dark:border-slate-800">
                  <span className="text-slate-500 dark:text-slate-400">Tạo</span>
                  <span className="font-mono text-xs text-slate-700 dark:text-slate-300">
                    {formatDateTime(createdAt != null ? String(createdAt) : "")}
                  </span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-slate-500 dark:text-slate-400">Cập nhật</span>
                  <span className="font-mono text-xs text-slate-700 dark:text-slate-300">
                    {formatDateTime(updatedAt != null ? String(updatedAt) : "")}
                  </span>
                </div>
                {notes != null && String(notes).trim() !== "" ? (
                  <div className="border-t border-slate-100 pt-3 dark:border-slate-800">
                    <p className="text-xs font-semibold uppercase text-slate-500">Ghi chú</p>
                    <p className="mt-1 whitespace-pre-wrap text-slate-800 dark:text-slate-200">{String(notes)}</p>
                  </div>
                ) : null}
              </CardContent>
            </Card>

            <Card className="border-slate-200/80 shadow-sm dark:border-slate-800">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Package className="h-4 w-4 text-teal-600" aria-hidden />
                  Đơn hàng liên quan
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {orderObj ? (
                  <>
                    {cust ? (
                      <>
                        <p className="font-medium text-slate-900 dark:text-slate-100">
                          {String(pick(cust, "fullName", "FullName") ?? "—")}
                        </p>
                        <p className="text-slate-600 dark:text-slate-400">{String(pick(cust, "phone", "Phone") ?? "—")}</p>
                      </>
                    ) : (
                      <p className="text-slate-500">Không có khách trong payload đơn.</p>
                    )}
                    {orderId != null ? (
                      <Button variant="outline" size="sm" className="mt-2 gap-1" asChild>
                        <Link to={`${ORDERS_PATH}/${encodeURIComponent(String(orderId))}`}>
                          Mở chi tiết đơn
                          <ExternalLink className="h-3.5 w-3.5 opacity-70" />
                        </Link>
                      </Button>
                    ) : null}
                  </>
                ) : (
                  <p className="text-slate-500">Chưa có thông tin đơn hàng liên quan.</p>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              to={FULFILLMENTS_LIST_PATH}
              className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-800 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:hover:bg-slate-900"
            >
              ← Danh sách phiếu
            </Link>
          </div>
        </>
      ) : null}
    </div>
  );
}
