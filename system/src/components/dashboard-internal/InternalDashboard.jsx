import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useStaffShellPaths } from "@/hooks/useStaffShellPaths";
import { staffOrderDetailHref } from "@/lib/staffOrderRoutes";
import { cn } from "@/lib/utils";
import {
  fetchDashboardArAging,
  fetchDashboardArSummary,
  fetchDashboardArTimeseries,
  fetchDashboardArTopDebtors,
  fetchDashboardInventoryLowStock,
  fetchDashboardInventoryOverview,
  fetchDashboardInventoryTopMoving,
  fetchDashboardInventoryTransactionsTrend,
  fetchDashboardOperationsFulfillmentStatus,
  fetchDashboardOperationsLateOrders,
  fetchDashboardOperationsOrderStatusBreakdown,
  fetchDashboardOperationsSlaConfirmedToShipped,
  fetchDashboardRevenueByChannel,
  fetchDashboardRevenueByPaymentMethod,
  fetchDashboardRevenueOverview,
  fetchDashboardRevenueTimeseries,
  fetchDashboardSalesPerformanceQuoteConversionBySales,
  fetchDashboardSalesPerformanceTopSales,
  fetchDashboardSalesPipelineConversion,
  fetchDashboardSalesPipelineExpiringSoon,
  fetchDashboardSalesPipelineFunnel,
  fetchDashboardSalesPipelineTimeInStage,
} from "@/services/admin/adminDashboardApi";
import { defaultDateRange30d, formatDecimal, formatInt, formatRate01, formatVnd } from "./dashboardFormat";
import { DashboardDateRange } from "./DashboardDateRange";
import {
  ArTimeseriesLine,
  B2cB2bStackedBar,
  DonutStatusChart,
  FunnelBarChart,
  InventoryTxStackedBar,
  PaymentMethodDonut,
  RevenueNetLineChart,
  SimpleBarChart,
  SlaHistogramBar,
} from "./DashboardCharts";
import { DashboardSectionFrame } from "./DashboardSectionFrame";
import { KpiMini } from "./KpiMini";
import { labelQuoteStatus, QUOTE_STATUS_VI } from "./quoteStatusLabels";
import { labelFulfillmentStatus } from "@/services/admin/adminFulfillmentsApi";
import { labelOrderStatus } from "@/services/admin/adminOrdersApi";

const TABS = [
  { id: "finance", label: "Tài chính" },
  { id: "ar", label: "Công nợ" },
  { id: "sales", label: "Bán hàng" },
  { id: "logistics", label: "Kho & vận hành" },
];

const KPI_REFRESH_MS = 5 * 60 * 1000;

/**
 * @param {object} p
 * @param {string | null} p.accessToken
 */
export function InternalDashboard({ accessToken }) {
  const paths = useStaffShellPaths();
  const init = defaultDateRange30d();
  const [fromDate, setFromDate] = useState(init.fromDate);
  const [toDate, setToDate] = useState(init.toDate);
  const [granularity, setGranularity] = useState(/** @type {"day"|"week"|"month"} */ ("day"));
  const [tab, setTab] = useState(/** @type {"finance"|"ar"|"sales"|"logistics"} */ ("finance"));

  // --- Finance ---
  const [revOv, setRevOv] = useState(null);
  const [revTs, setRevTs] = useState(null);
  const [revPay, setRevPay] = useState(null);
  const [revCh, setRevCh] = useState(null);
  const [finLoading, setFinLoading] = useState(false);
  const [finErr, setFinErr] = useState(/** @type {Error | null} */ (null));

  // --- AR ---
  const [arSum, setArSum] = useState(null);
  const [arAging, setArAging] = useState(null);
  const [arTop, setArTop] = useState(null);
  const [arTs, setArTs] = useState(null);
  const [arLoading, setArLoading] = useState(false);
  const [arErr, setArErr] = useState(/** @type {Error | null} */ (null));

  // --- Sales ---
  const [pipeF, setPipeF] = useState(null);
  const [pipeC, setPipeC] = useState(null);
  const [pipeT, setPipeT] = useState(null);
  const [pipeE, setPipeE] = useState(null);
  const [topS, setTopS] = useState(null);
  const [quoteConv, setQuoteConv] = useState(null);
  const [salesLoading, setSalesLoading] = useState(false);
  const [salesErr, setSalesErr] = useState(/** @type {Error | null} */ (null));

  // --- Logistics ---
  const [invO, setInvO] = useState(null);
  const [invLow, setInvLow] = useState(null);
  const [invTrend, setInvTrend] = useState(null);
  const [invTop, setInvTop] = useState(null);
  const [ordBr, setOrdBr] = useState(null);
  const [fulBr, setFulBr] = useState(null);
  const [sla, setSla] = useState(null);
  const [late, setLate] = useState(null);
  const [logLoading, setLogLoading] = useState(false);
  const [logErr, setLogErr] = useState(/** @type {Error | null} */ (null));

  const loadFinance = useCallback(async () => {
    if (!accessToken) return;
    setFinLoading(true);
    setFinErr(null);
    const rangeQ = { fromDate, toDate };
    const tsQ = { ...rangeQ, granularity };
    try {
      const [a, b, c, d] = await Promise.all([
        fetchDashboardRevenueOverview(accessToken, rangeQ),
        fetchDashboardRevenueTimeseries(accessToken, tsQ),
        fetchDashboardRevenueByPaymentMethod(accessToken, rangeQ),
        fetchDashboardRevenueByChannel(accessToken, tsQ),
      ]);
      setRevOv(a);
      setRevTs(b);
      setRevPay(c);
      setRevCh(d);
    } catch (e) {
      setFinErr(e instanceof Error ? e : new Error(String(e)));
    } finally {
      setFinLoading(false);
    }
  }, [accessToken, fromDate, toDate, granularity]);

  const loadAr = useCallback(async () => {
    if (!accessToken) return;
    setArLoading(true);
    setArErr(null);
    const rangeQ = { fromDate, toDate };
    const tsQ = { ...rangeQ, granularity };
    try {
      const [a, b, c, d] = await Promise.all([
        fetchDashboardArSummary(accessToken, rangeQ),
        fetchDashboardArAging(accessToken, rangeQ),
        fetchDashboardArTopDebtors(accessToken, { limit: 10 }),
        fetchDashboardArTimeseries(accessToken, tsQ),
      ]);
      setArSum(a);
      setArAging(b);
      setArTop(c);
      setArTs(d);
    } catch (e) {
      setArErr(e instanceof Error ? e : new Error(String(e)));
    } finally {
      setArLoading(false);
    }
  }, [accessToken, fromDate, toDate, granularity]);

  const loadSales = useCallback(async () => {
    if (!accessToken) return;
    setSalesLoading(true);
    setSalesErr(null);
    const rangeQ = { fromDate, toDate };
    try {
      const [a, b, c, d, e, f] = await Promise.all([
        fetchDashboardSalesPipelineFunnel(accessToken, rangeQ),
        fetchDashboardSalesPipelineConversion(accessToken, rangeQ),
        fetchDashboardSalesPipelineTimeInStage(accessToken, rangeQ),
        fetchDashboardSalesPipelineExpiringSoon(accessToken, { days: 7 }),
        fetchDashboardSalesPerformanceTopSales(accessToken, { ...rangeQ, limit: 10 }),
        fetchDashboardSalesPerformanceQuoteConversionBySales(accessToken, rangeQ),
      ]);
      setPipeF(a);
      setPipeC(b);
      setPipeT(c);
      setPipeE(d);
      setTopS(e);
      setQuoteConv(f);
    } catch (e) {
      setSalesErr(e instanceof Error ? e : new Error(String(e)));
    } finally {
      setSalesLoading(false);
    }
  }, [accessToken, fromDate, toDate]);

  const loadLogistics = useCallback(async () => {
    if (!accessToken) return;
    setLogLoading(true);
    setLogErr(null);
    const rangeQ = { fromDate, toDate };
    const tsQ = { ...rangeQ, granularity };
    try {
      const [a, b, c, d, e, f, g, h] = await Promise.all([
        fetchDashboardInventoryOverview(accessToken, {}),
        fetchDashboardInventoryLowStock(accessToken, { take: 50, threshold: 10 }),
        fetchDashboardInventoryTransactionsTrend(accessToken, tsQ),
        fetchDashboardInventoryTopMoving(accessToken, { ...rangeQ, limit: 10 }),
        fetchDashboardOperationsOrderStatusBreakdown(accessToken, rangeQ),
        fetchDashboardOperationsFulfillmentStatus(accessToken, rangeQ),
        fetchDashboardOperationsSlaConfirmedToShipped(accessToken, rangeQ),
        fetchDashboardOperationsLateOrders(accessToken, { slaHours: 72 }),
      ]);
      setInvO(a);
      setInvLow(b);
      setInvTrend(c);
      setInvTop(d);
      setOrdBr(e);
      setFulBr(f);
      setSla(g);
      setLate(h);
    } catch (e) {
      setLogErr(e instanceof Error ? e : new Error(String(e)));
    } finally {
      setLogLoading(false);
    }
  }, [accessToken, fromDate, toDate, granularity]);

  useEffect(() => {
    if (tab !== "finance" || !accessToken) return;
    void loadFinance();
    const t = setInterval(() => void loadFinance(), KPI_REFRESH_MS);
    return () => clearInterval(t);
  }, [tab, accessToken, loadFinance]);

  useEffect(() => {
    if (tab !== "ar" || !accessToken) return;
    void loadAr();
    const t = setInterval(() => void loadAr(), KPI_REFRESH_MS);
    return () => clearInterval(t);
  }, [tab, accessToken, loadAr]);

  useEffect(() => {
    if (tab !== "sales" || !accessToken) return;
    void loadSales();
    const t = setInterval(() => void loadSales(), KPI_REFRESH_MS);
    return () => clearInterval(t);
  }, [tab, accessToken, loadSales]);

  useEffect(() => {
    if (tab !== "logistics" || !accessToken) return;
    void loadLogistics();
    const t = setInterval(() => void loadLogistics(), KPI_REFRESH_MS);
    return () => clearInterval(t);
  }, [tab, accessToken, loadLogistics]);

  return (
    <div className="mt-4 space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-wrap gap-1 rounded-lg border border-border/60 bg-muted/30 p-1">
          {TABS.map((x) => (
            <button
              key={x.id}
              type="button"
              onClick={() => setTab(/** @type {typeof tab} */ (x.id))}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                tab === x.id
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {x.label}
            </button>
          ))}
        </div>
        <DashboardDateRange
          fromDate={fromDate}
          toDate={toDate}
          onFromChange={setFromDate}
          onToChange={setToDate}
          showGranularity
          granularity={granularity}
          onGranularityChange={(v) => setGranularity(/** @type {typeof granularity} */ (v))}
        />
      </div>

      {tab === "finance" ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <DashboardSectionFrame title="KPI doanh thu" loading={finLoading} error={finErr}>
            {revOv ? (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                <KpiMini label="Net revenue" value={`${formatVnd(revOv.netRevenue)} đ`} />
                <KpiMini label="Vào / Ra" value={`${formatVnd(revOv.totalIn)} / ${formatVnd(revOv.totalOut)}`} />
                <KpiMini label="Đơn" value={String(formatInt(revOv.orderCount))} />
                <KpiMini label="AOV" value={`${formatVnd(revOv.averageOrderValue)} đ`} />
                <KpiMini label="Tỷ lệ hoàn" value={formatRate01(revOv.refundRate)} />
                <KpiMini label="Khách mới" value={String(formatInt(revOv.newCustomerCount))} />
              </div>
            ) : null}
          </DashboardSectionFrame>
          <DashboardSectionFrame title="Dòng tiền theo thời gian" loading={finLoading} error={finErr}>
            {revTs?.points ? <RevenueNetLineChart points={revTs.points} /> : null}
          </DashboardSectionFrame>
          <DashboardSectionFrame title="Theo PTTT" loading={finLoading} error={finErr}>
            {revPay?.buckets ? <PaymentMethodDonut buckets={revPay.buckets} /> : null}
          </DashboardSectionFrame>
          <DashboardSectionFrame title="B2C vs B2B" loading={finLoading} error={finErr}>
            {revCh?.points ? <B2cB2bStackedBar points={revCh.points} /> : null}
          </DashboardSectionFrame>
        </div>
      ) : null}

      {tab === "ar" ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <DashboardSectionFrame title="Tổng quan công nợ" loading={arLoading} error={arErr}>
            {arSum ? (
              <div className="grid grid-cols-2 gap-2">
                <KpiMini
                  label="Chưa trả"
                  value={`${formatVnd(arSum.totalUnpaidAmount)} đ · ${formatInt(arSum.totalUnpaidCount)} HĐ`}
                />
                <KpiMini
                  label="Quá hạn"
                  value={`${formatVnd(arSum.overdueAmount)} đ · ${formatInt(arSum.overdueCount)} HĐ`}
                />
                <KpiMini
                  label={`Sắp đến hạn (${arSum.dueSoonWindowDays ?? 7} ngày)`}
                  value={`${formatVnd(arSum.dueSoonAmount)} đ · ${formatInt(arSum.dueSoonCount)} HĐ`}
                />
              </div>
            ) : null}
          </DashboardSectionFrame>
          <DashboardSectionFrame title="Aging" loading={arLoading} error={arErr}>
            {arAging?.buckets ? <SimpleBarChart buckets={arAging.buckets} /> : null}
          </DashboardSectionFrame>
          <DashboardSectionFrame title="Dư nợ theo ngày" loading={arLoading} error={arErr} className="lg:col-span-2">
            {arTs?.points ? <ArTimeseriesLine points={arTs.points} /> : null}
          </DashboardSectionFrame>
          <DashboardSectionFrame title="Top khách nợ" loading={arLoading} error={arErr} className="lg:col-span-2">
            {arTop?.items?.length ? (
              <div className="overflow-x-auto text-sm">
                <table className="w-full min-w-[520px] border-collapse text-left">
                  <thead>
                    <tr className="border-b text-xs text-muted-foreground">
                      <th className="py-2 pr-2">Khách</th>
                      <th className="py-2 pr-2">Còn nợ</th>
                      <th className="py-2 pr-2">Quá hạn</th>
                      <th className="py-2">HĐ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {arTop.items.map((row) => (
                      <tr key={row.customerId} className="border-b border-border/50">
                        <td className="py-1.5 pr-2 font-medium">{row.customerName}</td>
                        <td className="py-1.5 pr-2 tabular-nums">{formatVnd(row.remainingTotal)}</td>
                        <td className="py-1.5 pr-2 tabular-nums text-red-700 dark:text-red-300">
                          {formatVnd(row.overdueAmount)}
                        </td>
                        <td className="py-1.5 tabular-nums">{row.invoiceCount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}
          </DashboardSectionFrame>
        </div>
      ) : null}

      {tab === "sales" ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <DashboardSectionFrame title="Phễu báo giá" loading={salesLoading} error={salesErr}>
            {pipeF?.steps ? <FunnelBarChart steps={pipeF.steps} labelMap={QUOTE_STATUS_VI} /> : null}
          </DashboardSectionFrame>
          <DashboardSectionFrame title="Phân tích chuyển đổi" loading={salesLoading} error={salesErr}>
            {pipeC ? (
              <div className="grid grid-cols-2 gap-2">
                <KpiMini
                  label="Tỷ lệ chấp nhận"
                  value={formatRate01(pipeC.acceptRate)}
                  hint={`${formatInt(pipeC.acceptedQuoteCount)} / ${formatInt(pipeC.approvedQuoteCount)} BG đã duyệt`}
                />
                <KpiMini
                  label="Tỷ lệ CVT"
                  value={formatRate01(pipeC.conversionRate)}
                  hint={`${formatInt(pipeC.convertedQuoteCount)} chuyển đơn`}
                />
                <KpiMini
                  label="TB chờ duyệt"
                  value={`${formatDecimal(pipeC.avgTimeRequestedToApprovedDays, 1)} ngày`}
                />
                <KpiMini
                  label="TB KH chấp nhận"
                  value={`${formatDecimal(pipeC.avgTimeApprovedToAcceptedDays, 1)} ngày`}
                />
              </div>
            ) : null}
          </DashboardSectionFrame>
          <DashboardSectionFrame title="Thời gian theo giai đoạn" loading={salesLoading} error={salesErr} className="lg:col-span-2">
            {pipeT?.stages?.length ? (
              <ul className="space-y-1 text-sm">
                {pipeT.stages.map((s, i) => (
                  <li key={i} className="flex flex-wrap justify-between gap-2 border-b border-border/50 py-1">
                    <span>
                      {labelQuoteStatus(s.from)} → {labelQuoteStatus(s.to)}
                    </span>
                    <span className="tabular-nums text-muted-foreground">
                      {s.avgDays != null ? formatDecimal(s.avgDays, 1) : "—"} ngày ({s.sampleSize ?? 0} mẫu)
                    </span>
                  </li>
                ))}
              </ul>
            ) : null}
          </DashboardSectionFrame>
          <DashboardSectionFrame title="Báo giá sắp hết hạn" loading={salesLoading} error={salesErr} className="lg:col-span-2">
            {pipeE?.items?.length ? (
              <div className="overflow-x-auto text-sm">
                <table className="w-full min-w-[560px] border-collapse text-left">
                  <thead>
                    <tr className="border-b text-xs text-muted-foreground">
                      <th className="py-2 pr-2">Mã</th>
                      <th className="py-2 pr-2">Khách</th>
                      <th className="py-2 pr-2">Hết hạn</th>
                      <th className="py-2">Còn (ngày)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pipeE.items.map((q) => (
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
            ) : (
              <p className="text-sm text-muted-foreground">Không có báo giá sắp hết hạn.</p>
            )}
          </DashboardSectionFrame>
          <DashboardSectionFrame title="Doanh thu theo nhân viên" loading={salesLoading} error={salesErr} className="lg:col-span-2">
            {topS?.items?.length ? (
              <div className="overflow-x-auto text-sm">
                <table className="w-full min-w-[400px] border-collapse text-left">
                  <thead>
                    <tr className="border-b text-xs text-muted-foreground">
                      <th className="py-2 pr-2">Nhân viên</th>
                      <th className="py-2 pr-2">Đơn</th>
                      <th className="py-2">Doanh thu</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topS.items.map((r) => (
                      <tr key={r.salesId} className="border-b border-border/50">
                        <td className="py-1.5 pr-2 font-medium">{r.fullName}</td>
                        <td className="py-1.5 pr-2 tabular-nums">{r.orderCount}</td>
                        <td className="py-1.5 tabular-nums">{formatVnd(r.totalRevenue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}
          </DashboardSectionFrame>
          <DashboardSectionFrame title="Chuyển đổi theo nhân viên" loading={salesLoading} error={salesErr} className="lg:col-span-2">
            {quoteConv?.items?.length ? (
              <div className="overflow-x-auto text-sm">
                <table className="w-full min-w-[480px] border-collapse text-left">
                  <thead>
                    <tr className="border-b text-xs text-muted-foreground">
                      <th className="py-2 pr-2">Nhân viên</th>
                      <th className="py-2 pr-2">BG đã duyệt</th>
                      <th className="py-2 pr-2">Đã chuyển đơn</th>
                      <th className="py-2">Tỷ lệ CVT</th>
                    </tr>
                  </thead>
                  <tbody>
                    {quoteConv.items.map((r) => (
                      <tr key={r.salesId} className="border-b border-border/50">
                        <td className="py-1.5 pr-2 font-medium">{r.fullName}</td>
                        <td className="py-1.5 pr-2 tabular-nums">{r.approvedCount}</td>
                        <td className="py-1.5 pr-2 tabular-nums">{r.convertedCount}</td>
                        <td className="py-1.5 tabular-nums">{formatRate01(r.conversionRate)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}
          </DashboardSectionFrame>
        </div>
      ) : null}

      {tab === "logistics" ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <DashboardSectionFrame title="Tồn kho" loading={logLoading} error={logErr}>
            {invO ? (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                <KpiMini label="SKU hoạt động" value={String(formatInt(invO.skuActiveCount))} />
                <KpiMini label="Tồn thấp" value={String(formatInt(invO.lowStockCount))} />
                <KpiMini label="Tồn khả dụng" value={String(formatInt(invO.totalOnHand))} />
                <KpiMini label="Giữ chỗ" value={String(formatInt(invO.totalReserved))} />
                <KpiMini label="Giá trị tồn" value={`${formatVnd(invO.totalOnHandValue)} đ`} />
              </div>
            ) : null}
          </DashboardSectionFrame>
          <DashboardSectionFrame title="Đơn hàng theo trạng thái" loading={logLoading} error={logErr}>
            {ordBr?.buckets ? <DonutStatusChart buckets={ordBr.buckets} labelFn={labelOrderStatus} /> : null}
          </DashboardSectionFrame>
          <DashboardSectionFrame title="Phiếu xuất kho" loading={logLoading} error={logErr}>
            {fulBr?.buckets ? <DonutStatusChart buckets={fulBr.buckets} labelFn={labelFulfillmentStatus} /> : null}
          </DashboardSectionFrame>
          <DashboardSectionFrame title="Giao dịch kho" loading={logLoading} error={logErr} className="lg:col-span-2">
            {invTrend?.points ? <InventoryTxStackedBar points={invTrend.points} /> : null}
          </DashboardSectionFrame>
          <DashboardSectionFrame title="SLA: Xác nhận → Đã giao" loading={logLoading} error={logErr}>
            {sla ? (
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-2 text-center text-sm">
                  <KpiMini label="TB (giờ)" value={formatDecimal(sla.avgHours, 1)} />
                  <KpiMini label="Phân vị 50%" value={formatDecimal(sla.p50Hours, 1)} />
                  <KpiMini label="Phân vị 90%" value={formatDecimal(sla.p90Hours, 1)} />
                </div>
                {sla.histogram ? <SlaHistogramBar histogram={sla.histogram} /> : null}
              </div>
            ) : null}
          </DashboardSectionFrame>
          <DashboardSectionFrame title="Đơn trễ" loading={logLoading} error={logErr} className="lg:col-span-2">
            {late?.items?.length ? (
              <div className="overflow-x-auto text-sm">
                <table className="w-full min-w-[600px] border-collapse text-left">
                  <thead>
                    <tr className="border-b text-xs text-muted-foreground">
                      <th className="py-2 pr-2">Mã đơn</th>
                      <th className="py-2 pr-2">Khách</th>
                      <th className="py-2 pr-2">Trạng thái</th>
                      <th className="py-2 pr-2">Quá hạn (giờ)</th>
                      <th className="py-2">NV bán hàng</th>
                    </tr>
                  </thead>
                  <tbody>
                    {late.items.map((o) => (
                      <tr
                        key={o.orderId}
                        className={cn("border-b border-border/50", o.elapsedHours > 2 * (late.slaHours || 72) && "bg-amber-500/10")}
                      >
                        <td className="py-1.5 pr-2 font-mono text-xs">
                          {staffOrderDetailHref(paths, { orderId: o.orderId, orderCode: o.orderCode }) ? (
                            <Link
                              to={staffOrderDetailHref(paths, { orderId: o.orderId, orderCode: o.orderCode })}
                              className="text-primary underline-offset-2 hover:underline"
                            >
                              {o.orderCode}
                            </Link>
                          ) : (
                            o.orderCode
                          )}
                        </td>
                        <td className="py-1.5 pr-2">{o.customerName}</td>
                        <td className="py-1.5 pr-2">{labelOrderStatus(o.orderStatus)}</td>
                        <td className="py-1.5 pr-2 tabular-nums">{formatDecimal(o.elapsedHours, 1)}</td>
                        <td className="py-1.5">{o.salesName ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Không có đơn trễ.</p>
            )}
          </DashboardSectionFrame>
          <DashboardSectionFrame title="SKU tồn thấp" loading={logLoading} error={logErr} className="lg:col-span-2">
            {invLow?.items?.length ? (
              <div className="max-h-72 overflow-y-auto text-sm">
                <table className="w-full min-w-[640px] border-collapse text-left">
                  <thead>
                    <tr className="border-b text-xs text-muted-foreground">
                      <th className="py-1.5 pr-2">SKU</th>
                      <th className="py-1.5 pr-2">Còn bán</th>
                      <th className="py-1.5 pr-2">Ngày đủ hàng</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invLow.items.slice(0, 20).map((r) => (
                      <tr key={r.variantId} className="border-b border-border/30">
                        <td className="py-1 pr-2 font-mono text-xs">{r.sku}</td>
                        <td className="py-1 pr-2 tabular-nums">{r.quantityAvailable}</td>
                        <td className="py-1 tabular-nums">
                          {r.daysOfCover != null ? formatDecimal(r.daysOfCover, 1) : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}
          </DashboardSectionFrame>
          <DashboardSectionFrame title="SKU bán chạy" loading={logLoading} error={logErr} className="lg:col-span-2">
            {invTop?.items?.length ? (
              <div className="overflow-x-auto text-sm">
                <table className="w-full min-w-[400px] border-collapse text-left">
                  <thead>
                    <tr className="border-b text-xs text-muted-foreground">
                      <th className="py-2 pr-2">SKU</th>
                      <th className="py-2 pr-2">Sản phẩm</th>
                      <th className="py-2">Xuất</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invTop.items.map((r) => (
                      <tr key={r.variantId} className="border-b border-border/50">
                        <td className="py-1.5 pr-2 font-mono text-xs">{r.sku}</td>
                        <td className="py-1.5 pr-2">{r.productName}</td>
                        <td className="py-1.5 tabular-nums">{r.totalOut}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}
          </DashboardSectionFrame>
        </div>
      ) : null}
    </div>
  );
}
