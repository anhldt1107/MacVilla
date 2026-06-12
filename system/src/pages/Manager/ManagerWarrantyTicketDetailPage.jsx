import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { ApiRequestError } from "@/services/api/apiEnvelope";
import {
  fetchAdminWarrantyStatuses,
  fetchAdminWarrantyTicketDetail,
  labelAdminWarrantyClaimStatus,
  labelAdminWarrantyTicketStatus,
  warrantyTicketStatusBadgeClass,
} from "@/services/admin/adminWarrantyApi";
import { WarrantyTicketLinesCard } from "@/components/warranty/WarrantyTicketLinesCard";
import { ProductLineCell } from "@/components/catalog/ProductLineCell";
import { ChevronRight, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const WARRANTY_LIST = "/manager/after-sales/warranty";
const CLAIM = (id) => `/manager/after-sales/warranty/claims/${encodeURIComponent(String(id))}`;

function pick(obj, camel, pascal) {
  if (!obj || typeof obj !== "object") return undefined;
  if (obj[camel] !== undefined && obj[camel] !== null) return obj[camel];
  if (obj[pascal] !== undefined && obj[pascal] !== null) return obj[pascal];
  return undefined;
}

function formatMoneyVnd(n) {
  if (n == null || Number.isNaN(Number(n))) return "—";
  return `${Number(n).toLocaleString("vi-VN")} đ`;
}

function formatDate(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
  } catch {
    return String(iso);
  }
}

export function ManagerWarrantyTicketDetailPage() {
  const { ticketId: ticketIdParam } = useParams();
  const navigate = useNavigate();
  const { accessToken, isAuthenticated } = useAuth();
  const ticketId = String(ticketIdParam ?? "").trim();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [detail, setDetail] = useState(/** @type {Record<string, unknown> | null} */ (null));
  const [ticketStatusOptions, setTicketStatusOptions] = useState([]);
  const [claimStatusOptions, setClaimStatusOptions] = useState([]);

  useEffect(() => {
    if (!isAuthenticated || !accessToken) return;
    let cancelled = false;
    (async () => {
      try {
        const { ticketStatuses, claimStatuses } = await fetchAdminWarrantyStatuses(accessToken);
        if (!cancelled) {
          setTicketStatusOptions(ticketStatuses.filter((o) => o.value));
          setClaimStatusOptions(claimStatuses.filter((o) => o.value));
        }
      } catch {
        if (!cancelled) {
          setTicketStatusOptions([]);
          setClaimStatusOptions([]);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [accessToken, isAuthenticated]);

  const load = useCallback(async () => {
    if (!isAuthenticated || !accessToken || !ticketId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const d = await fetchAdminWarrantyTicketDetail(accessToken, ticketId);
      setDetail(d && typeof d === "object" ? /** @type {Record<string, unknown>} */ (d) : null);
    } catch (e) {
      const msg =
        e instanceof ApiRequestError
          ? e.message
          : e instanceof Error
            ? e.message
            : "Không tải được phiếu.";
      setError(msg);
      setDetail(null);
    } finally {
      setLoading(false);
    }
  }, [accessToken, isAuthenticated, ticketId]);

  useEffect(() => {
    void load();
  }, [load]);

  const num = detail ? pick(detail, "ticketNumber", "TicketNumber") : null;
  const st = detail ? String(pick(detail, "status", "Status") ?? "") : "";
  const cid = detail ? pick(detail, "customerId", "CustomerId") : null;
  const cname = detail ? pick(detail, "customerName", "CustomerName") : null;
  const oid = detail ? pick(detail, "orderId", "OrderId") : null;
  const orderCode = detail ? pick(detail, "orderCode", "OrderCode") : null;
  const ctid = detail ? pick(detail, "contractId", "ContractId") : null;
  const contractNumber = detail ? pick(detail, "contractNumber", "ContractNumber") : null;
  const until = detail ? pick(detail, "validUntil", "ValidUntil") : null;
  const created = detail ? pick(detail, "createdAt", "CreatedAt") : null;
  const claimsRaw = detail ? pick(detail, "claims", "Claims") : null;
  const claims = Array.isArray(claimsRaw) ? claimsRaw : [];

  return (
    <div className="mx-auto max-w-5xl space-y-8 pb-10">
      <nav className="flex flex-wrap items-center gap-1 text-xs font-medium text-slate-500 dark:text-slate-400" aria-label="Breadcrumb">
        <Link to="/manager" className="rounded-md px-1.5 py-0.5 hover:bg-slate-100 dark:hover:bg-slate-800">
          Dashboard
        </Link>
        <ChevronRight className="h-3.5 w-3.5 opacity-60" aria-hidden />
        <Link to={WARRANTY_LIST} className="rounded-md px-1.5 py-0.5 hover:bg-slate-100 dark:hover:bg-slate-800">
          Bảo hành
        </Link>
        <ChevronRight className="h-3.5 w-3.5 opacity-60" aria-hidden />
        <span className="px-1.5 font-semibold text-slate-800 dark:text-slate-200">
          {num != null ? String(num) : ticketId ? `#${ticketId}` : "—"}
        </span>
      </nav>

      {loading && !detail ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-10 w-10 animate-spin text-violet-600/70" aria-hidden />
        </div>
      ) : null}

      {error && !loading ? (
        <div
          className="rounded-xl border border-red-200 bg-red-50/90 px-4 py-3 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-200"
          role="alert"
        >
          {error}
        </div>
      ) : null}

      {!loading && !error && detail ? (
        <>
          <header className="border-b border-slate-200 pb-6 dark:border-slate-800">
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">
              {num != null ? String(num) : `Phiếu #${ticketId}`}
            </h1>
            <div className="mt-2">
              <span
                className={cn(
                  "inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold",
                  warrantyTicketStatusBadgeClass(st)
                )}
              >
                {labelAdminWarrantyTicketStatus(st, ticketStatusOptions)}
              </span>
            </div>
          </header>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="border-slate-200/80 dark:border-slate-800">
              <CardHeader>
                <CardTitle className="text-base">Thông tin phiếu</CardTitle>
                <CardDescription>Khách, đơn, hiệu lực</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between gap-4">
                  <span className="text-slate-500">Khách</span>
                  <span className="text-right font-medium">
                    {cid != null ? (
                      <Link className="text-violet-700 hover:underline dark:text-violet-400" to={`/manager/sales/customers/${encodeURIComponent(String(cid))}`}>
                        {cname != null ? String(cname) : `#${cid}`}
                      </Link>
                    ) : (
                      "—"
                    )}
                    {cid != null ? <span className="ml-2 font-mono text-xs text-slate-500">#{cid}</span> : null}
                  </span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-slate-500">Đơn</span>
                  <span className="text-right">
                    {oid != null ? (
                      <Link className="font-mono text-violet-700 hover:underline dark:text-violet-400" to={`/manager/sales/orders/${encodeURIComponent(String(oid))}`}>
                        {orderCode != null ? String(orderCode) : `#${oid}`}
                      </Link>
                    ) : (
                      "—"
                    )}
                  </span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-slate-500">Hợp đồng</span>
                  <span className="font-mono text-right">
                    {ctid != null ? (
                      <Link className="text-violet-700 hover:underline dark:text-violet-400" to={`/manager/sales/contracts/${encodeURIComponent(String(ctid))}`}>
                        {contractNumber != null ? String(contractNumber) : `#${ctid}`}
                      </Link>
                    ) : (
                      "—"
                    )}
                  </span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-slate-500">Hết hạn muộn nhất</span>
                  <span>{formatDate(until != null ? String(until) : "")}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-slate-500">Tạo lúc</span>
                  <span>{formatDate(created != null ? String(created) : "")}</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200/80 dark:border-slate-800">
              <CardHeader>
                <CardTitle className="text-base">Yêu cầu bảo hành</CardTitle>
                <CardDescription>Click một dòng để mở chi tiết — cập nhật trạng thái hoặc in biên nhận</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {claims.length === 0 ? (
                  <p className="px-6 py-8 text-center text-sm text-slate-500">Chưa có claim.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-left text-sm">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50/90 text-[11px] font-semibold uppercase text-slate-500 dark:border-slate-800 dark:bg-slate-900/50">
                          <th className="px-4 py-2 pl-6">ID</th>
                          <th className="px-4 py-2">Trạng thái</th>
                          <th className="px-4 py-2">Sản phẩm</th>
                          <th className="px-4 py-2 text-right">Dự kiến</th>
                          <th className="px-4 py-2 pr-6">Mô tả</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {claims.map((row, idx) => {
                          const o = /** @type {Record<string, unknown>} */ (row && typeof row === "object" ? row : {});
                          const id = o.id ?? o.Id;
                          const cs = o.status ?? o.Status;
                          const vid = o.variantId ?? o.VariantId;
                          const cost = o.estimatedCost ?? o.EstimatedCost;
                          const desc = o.defectDescription ?? o.DefectDescription;
                          const productName = o.productName ?? o.ProductName;
                          const variantName = o.variantName ?? o.VariantName;
                          const sku = o.sku ?? o.Sku;
                          const imageUrl = o.imageUrl ?? o.ImageUrl;
                          return (
                            <tr
                              key={id != null ? String(id) : idx}
                              tabIndex={id != null ? 0 : undefined}
                              className={cn(
                                id != null && "cursor-pointer hover:bg-violet-500/[0.04] dark:hover:bg-violet-500/[0.06]",
                                id == null && "hover:bg-slate-500/[0.03] dark:hover:bg-slate-500/[0.05]"
                              )}
                              onClick={(e) => {
                                if (id == null) return;
                                const el = e.target;
                                if (el instanceof Element && el.closest("a")) return;
                                navigate(CLAIM(id));
                              }}
                              onKeyDown={(e) => {
                                if (id == null) return;
                                if (e.key !== "Enter" && e.key !== " ") return;
                                e.preventDefault();
                                navigate(CLAIM(id));
                              }}
                              aria-label={id != null ? `Mở yêu cầu bảo hành số ${id}` : undefined}
                            >
                              <td className="px-4 py-2.5 pl-6 font-mono text-xs">
                                {id != null ? (
                                  <Link className="font-semibold text-violet-700 hover:underline dark:text-violet-400" to={CLAIM(id)}>
                                    #{id}
                                  </Link>
                                ) : (
                                  "—"
                                )}
                              </td>
                              <td className="px-4 py-2.5 text-xs">
                                {labelAdminWarrantyClaimStatus(cs != null ? String(cs) : "", claimStatusOptions)}
                              </td>
                              <td className="px-4 py-2.5">
                                <ProductLineCell
                                  productName={productName}
                                  variantName={variantName}
                                  sku={sku}
                                  imageUrl={imageUrl}
                                  variantId={vid}
                                  size="sm"
                                />
                              </td>
                              <td className="px-4 py-2.5 text-right text-xs tabular-nums">{formatMoneyVnd(cost)}</td>
                              <td className="max-w-[220px] truncate px-4 py-2.5 pr-6 text-xs text-slate-600 dark:text-slate-400" title={desc != null ? String(desc) : ""}>
                                {desc != null ? String(desc) : "—"}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>

            <WarrantyTicketLinesCard
              detail={detail}
              ticketId={ticketId}
              accessToken={accessToken}
              onClaimCreated={() => void load()}
            />
          </div>
        </>
      ) : null}
    </div>
  );
}
