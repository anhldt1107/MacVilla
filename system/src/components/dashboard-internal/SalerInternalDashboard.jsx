import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import {
  fetchDashboardSalesPerformancePerSalesDetail,
  fetchDashboardSalesPipelineExpiringSoon,
  fetchDashboardSalesPipelineFunnel,
} from "@/services/admin/adminDashboardApi";
import { defaultDateRange30d, formatInt, formatRate01, formatVnd } from "./dashboardFormat";
import { DashboardDateRange } from "./DashboardDateRange";
import { FunnelBarChart } from "./DashboardCharts";
import { DashboardSectionFrame } from "./DashboardSectionFrame";
import { KpiMini } from "./KpiMini";
import { QUOTE_STATUS_VI } from "./quoteStatusLabels";
import { cn } from "@/lib/utils";

const REFRESH_MS = 5 * 60 * 1000;

/**
 * Dashboard Sales: KPI cá nhân + pipeline + báo giá sắp hết hạn (theo `salesId` = staff id).
 */
export function SalerInternalDashboard() {
  const { accessToken, user } = useAuth();
  const salesId = user?.id;
  const init = defaultDateRange30d();
  const [fromDate, setFromDate] = useState(init.fromDate);
  const [toDate, setToDate] = useState(init.toDate);

  const [detail, setDetail] = useState(null);
  const [funnel, setFunnel] = useState(null);
  const [expiring, setExpiring] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(/** @type {Error | null} */ (null));

  const load = useCallback(async () => {
    if (!accessToken || salesId == null) return;
    setLoading(true);
    setErr(null);
    const q = { fromDate, toDate, salesId };
    try {
      const [d, f, e] = await Promise.all([
        fetchDashboardSalesPerformancePerSalesDetail(accessToken, q),
        fetchDashboardSalesPipelineFunnel(accessToken, q),
        fetchDashboardSalesPipelineExpiringSoon(accessToken, { days: 7, salesId }),
      ]);
      setDetail(d);
      setFunnel(f);
      setExpiring(e);
    } catch (e) {
      setErr(e instanceof Error ? e : new Error(String(e)));
    } finally {
      setLoading(false);
    }
  }, [accessToken, fromDate, toDate, salesId]);

  useEffect(() => {
    if (!accessToken || salesId == null) return;
    void load();
    const t = setInterval(() => void load(), REFRESH_MS);
    return () => clearInterval(t);
  }, [load, accessToken, salesId]);

  if (salesId == null) {
    return (
      <p className="text-sm text-muted-foreground">Không xác định được mã nhân viên bán hàng. Đăng nhập lại.</p>
    );
  }

  return (
    <div className="space-y-4">
      <DashboardDateRange
        fromDate={fromDate}
        toDate={toDate}
        onFromChange={setFromDate}
        onToChange={setToDate}
      />
      <div className="rounded-lg border border-border/80 bg-muted/30 px-3 py-2.5">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Lối tắt</p>
        <div className="flex flex-wrap gap-2 text-xs">
          <Link
            className="rounded-md border border-border bg-background px-2.5 py-1 font-medium text-primary underline-offset-2 hover:underline"
            to="/saler/quotations/queue"
          >
            Báo giá chờ nhận
          </Link>
          <Link
            className="rounded-md border border-border bg-background px-2.5 py-1 font-medium text-primary underline-offset-2 hover:underline"
            to="/saler/orders"
          >
            Đơn hàng
          </Link>
          <Link
            className="rounded-md border border-border bg-background px-2.5 py-1 font-medium text-primary underline-offset-2 hover:underline"
            to="/saler/customers"
          >
            Khách hàng
          </Link>
          <Link
            className="rounded-md border border-border bg-background px-2.5 py-1 font-medium text-primary underline-offset-2 hover:underline"
            to="/saler/revenue"
          >
            Doanh thu chi tiết
          </Link>
          <Link
            className="rounded-md border border-border bg-background px-2.5 py-1 font-medium text-muted-foreground underline-offset-2 hover:text-primary hover:underline"
            to="/saler/products"
          >
            Tra sản phẩm
          </Link>
          <Link
            className="rounded-md border border-border bg-background px-2.5 py-1 font-medium text-muted-foreground underline-offset-2 hover:text-primary hover:underline"
            to="/saler/warehouse"
          >
            Tra tồn kho
          </Link>
        </div>
      </div>

      <DashboardSectionFrame title="Hiệu suất bán hàng" loading={loading} error={err}>
        {detail ? (
          <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
            <KpiMini label="Báo giá" value={String(formatInt(detail.quoteCount))} />
            <KpiMini label="Đã duyệt / chấp nhận / CVT" value={`${formatInt(detail.approvedCount)} / ${formatInt(detail.acceptedCount)} / ${formatInt(detail.convertedCount)}`} />
            <KpiMini label="Tỷ lệ CVT" value={formatRate01(detail.conversionRate)} />
            <KpiMini label="Đơn hàng" value={String(formatInt(detail.orderCount))} />
            <KpiMini label="Doanh thu góp" value={`${formatVnd(detail.revenueContribution)} đ`} />
            <KpiMini label="Nhân viên" value={detail.fullName || "—"} />
          </div>
        ) : null}
      </DashboardSectionFrame>

      <DashboardSectionFrame title="Pipeline của tôi" loading={loading} error={err}>
        {funnel?.steps ? <FunnelBarChart steps={funnel.steps} labelMap={QUOTE_STATUS_VI} /> : null}
      </DashboardSectionFrame>

      <DashboardSectionFrame title="Báo giá sắp hết hạn" loading={loading} error={err}>
        {expiring?.items?.length ? (
          <div className="overflow-x-auto text-sm">
            <table className="w-full min-w-[520px] border-collapse text-left">
              <thead>
                <tr className="border-b text-xs text-muted-foreground">
                  <th className="py-2 pr-2">Mã</th>
                  <th className="py-2 pr-2">Khách</th>
                  <th className="py-2 pr-2">Hết hạn</th>
                  <th className="py-2">Còn (ngày)</th>
                </tr>
              </thead>
              <tbody>
                {expiring.items.map((q) => (
                  <tr
                    key={q.quoteId}
                    className={cn("border-b border-border/50", (q.daysUntilExpire ?? 99) <= 1 && "bg-red-500/5")}
                  >
                    <td className="py-1.5 pr-2 font-mono text-xs">{q.quoteCode}</td>
                    <td className="py-1.5 pr-2">{q.customerName}</td>
                    <td className="py-1.5 pr-2">{q.validUntil ? String(q.validUntil).slice(0, 10) : "—"}</td>
                    <td className="py-1.5 tabular-nums">{q.daysUntilExpire ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : !loading && !err ? (
          <p className="text-sm text-muted-foreground">Không có báo giá sắp hết hạn.</p>
        ) : null}
      </DashboardSectionFrame>
    </div>
  );
}
