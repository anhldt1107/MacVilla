import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { ApiRequestError } from "@/services/api/apiEnvelope";
import { fetchAdminOrderByCode } from "@/services/admin/adminOrdersApi";
import { fetchAdminFulfillments, labelFulfillmentStatus } from "@/services/admin/adminFulfillmentsApi";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Package, Search } from "lucide-react";
import { cn } from "@/lib/utils";

function pick(obj, camel, pascal) {
  if (!obj || typeof obj !== "object") return undefined;
  if (obj[camel] !== undefined && obj[camel] !== null) return obj[camel];
  if (obj[pascal] !== undefined && obj[pascal] !== null) return obj[pascal];
  return undefined;
}

function formatDate(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("vi-VN", {
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

export function SalerWarehouseLookupPage() {
  const { accessToken, isAuthenticated } = useAuth();
  const [codeInput, setCodeInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [order, setOrder] = useState(/** @type {Record<string, unknown> | null} */ (null));
  const [fulfillments, setFulfillments] = useState([]);
  const [fulfillmentsLoading, setFulfillmentsLoading] = useState(false);

  const handleLookup = async () => {
    if (!isAuthenticated || !accessToken || submitting) return;
    const code = codeInput.trim();
    if (!code) {
      setError("Nhập mã đơn hàng.");
      return;
    }
    setSubmitting(true);
    setError("");
    setOrder(null);
    setFulfillments([]);
    try {
      const detail = await fetchAdminOrderByCode(accessToken, code);
      const rec = detail && typeof detail === "object" ? /** @type {Record<string, unknown>} */ (detail) : null;
      setOrder(rec);
      const oid = rec ? pick(rec, "id", "Id") : null;
      if (oid == null || !Number.isFinite(Number(oid))) {
        setError("Không xác định được mã đơn.");
        return;
      }
      setFulfillmentsLoading(true);
      try {
        const result = await fetchAdminFulfillments(accessToken, {
          orderId: Number(oid),
          page: 1,
          pageSize: 50,
        });
        setFulfillments(Array.isArray(result?.items) ? result.items : []);
      } finally {
        setFulfillmentsLoading(false);
      }
    } catch (e) {
      setOrder(null);
      setFulfillments([]);
      setError(e instanceof ApiRequestError ? e.message : e instanceof Error ? e.message : "Tra cứu thất bại.");
    } finally {
      setSubmitting(false);
    }
  };

  const orderId = order ? pick(order, "id", "Id") : null;
  const orderCode = order ? pick(order, "orderCode", "OrderCode") : null;
  const orderStatus = order ? pick(order, "orderStatus", "OrderStatus") : null;

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-10">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Tra cứu xuất kho</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Mã đơn hàng</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label className="sr-only" htmlFor="wh-code">
              Mã đơn
            </label>
            <input
              id="wh-code"
              type="text"
              className={cn(
                "h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm shadow-sm",
                "focus-visible:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20",
                "dark:border-slate-700 dark:bg-slate-950"
              )}
              placeholder="VD: ORD-2026-001"
              value={codeInput}
              onChange={(e) => setCodeInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") void handleLookup();
              }}
              disabled={submitting}
            />
          </div>
          <Button type="button" disabled={submitting} onClick={() => void handleLookup()}>
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Search className="h-4 w-4" aria-hidden />}
            Tra cứu
          </Button>
        </CardContent>
      </Card>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200" role="alert">
          {error}
        </div>
      ) : null}

      {order ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Đơn {orderCode != null ? String(orderCode) : orderId != null ? `#${orderId}` : "—"}
            </CardTitle>
            <CardDescription>
              {orderStatus != null ? `Trạng thái đơn: ${String(orderStatus)}` : null}
              {orderId != null ? (
                <>
                  {" · "}
                  <Link className="font-medium text-primary underline-offset-2 hover:underline" to={`/saler/orders/${orderId}`}>
                    Mở chi tiết đơn
                  </Link>
                </>
              ) : null}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {fulfillmentsLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Đang tải phiếu xuất…
              </div>
            ) : fulfillments.length === 0 ? (
              <p className="text-sm text-muted-foreground">Chưa có phiếu xuất cho đơn này.</p>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
                <table className="w-full min-w-[480px] text-left text-sm">
                  <thead className="border-b border-slate-200 bg-slate-50/80 text-xs font-semibold uppercase text-slate-500 dark:border-slate-800 dark:bg-slate-900/50">
                    <tr>
                      <th className="px-4 py-3">Mã phiếu</th>
                      <th className="px-4 py-3">Trạng thái</th>
                      <th className="px-4 py-3">Cập nhật</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {fulfillments.map((row) => (
                      <tr key={row.id}>
                        <td className="px-4 py-3 font-mono text-xs">#{row.id}</td>
                        <td className="px-4 py-3">{labelFulfillmentStatus(row.status)}</td>
                        <td className="px-4 py-3 text-muted-foreground">{formatDate(row.updatedAt ?? row.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Package className="h-4 w-4" aria-hidden />
            Tra tồn sản phẩm
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Link
            to="/saler/products?inStockOnly=1"
            className="text-sm font-medium text-primary underline-offset-2 hover:underline"
          >
            Mở danh mục — chỉ còn hàng
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
