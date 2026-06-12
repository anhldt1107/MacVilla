import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import {
  fetchDashboardInventoryLowStock,
  fetchDashboardInventoryOverview,
  fetchDashboardInventoryTopMoving,
  fetchDashboardInventoryTransactionsTrend,
  fetchDashboardOperationsFulfillmentStatus,
  fetchDashboardOperationsLateOrders,
  fetchDashboardOperationsOrderStatusBreakdown,
  fetchDashboardOperationsSlaConfirmedToShipped,
} from "@/services/admin/adminDashboardApi";
import { labelFulfillmentStatus } from "@/services/admin/adminFulfillmentsApi";
import { labelOrderStatus } from "@/services/admin/adminOrdersApi";
import { defaultDateRange30d, formatDecimal, formatInt, formatVnd } from "./dashboardFormat";
import { DashboardDateRange } from "./DashboardDateRange";
import {
  DonutStatusChart,
  InventoryTxStackedBar,
  SlaHistogramBar,
} from "./DashboardCharts";
import { DashboardSectionFrame } from "./DashboardSectionFrame";
import { KpiMini } from "./KpiMini";
import { WAREHOUSE_DASHBOARD_COPY as COPY } from "./warehouseDashboardCopy";
import { cn } from "@/lib/utils";

const REFRESH_MS = 5 * 60 * 1000;

const DEFAULT_FULFILLMENTS_LINK = "/stock-manager/fulfillments";
const DEFAULT_INVENTORY_LINK = "/stock-manager/inventory";

/**
 * Dashboard kho: Inventory + Operations (policy WarehouseStaff).
 * @param {object} [p]
 * @param {string} [p.fulfillmentsLinkTo]
 * @param {string} [p.inventoryLinkTo]
 */
export function StockInternalDashboard({
  fulfillmentsLinkTo = DEFAULT_FULFILLMENTS_LINK,
  inventoryLinkTo = DEFAULT_INVENTORY_LINK,
} = {}) {
  const { accessToken } = useAuth();
  const init = defaultDateRange30d();
  const [fromDate, setFromDate] = useState(init.fromDate);
  const [toDate, setToDate] = useState(init.toDate);
  const [granularity, setGranularity] = useState(/** @type {"day"|"week"|"month"} */ ("day"));

  const [invO, setInvO] = useState(null);
  const [invLow, setInvLow] = useState(null);
  const [invTrend, setInvTrend] = useState(null);
  const [invTop, setInvTop] = useState(null);
  const [ordBr, setOrdBr] = useState(null);
  const [fulBr, setFulBr] = useState(null);
  const [sla, setSla] = useState(null);
  const [late, setLate] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(/** @type {Error | null} */ (null));

  const load = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    setErr(null);
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
      setErr(e instanceof Error ? e : new Error(String(e)));
    } finally {
      setLoading(false);
    }
  }, [accessToken, fromDate, toDate, granularity]);

  useEffect(() => {
    if (!accessToken) return;
    void load();
    const t = setInterval(() => void load(), REFRESH_MS);
    return () => clearInterval(t);
  }, [load, accessToken]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <h2 className="text-lg font-semibold">{COPY.pageTitle}</h2>
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
      <p className="text-xs text-muted-foreground">
        <Link className="font-medium text-primary underline-offset-2 hover:underline" to={fulfillmentsLinkTo}>
          {COPY.linkFulfillments}
        </Link>
        {" · "}
        <Link className="font-medium text-primary underline-offset-2 hover:underline" to={inventoryLinkTo}>
          {COPY.linkInventory}
        </Link>
      </p>

      <div className="grid gap-4 lg:grid-cols-2">
        <DashboardSectionFrame title={COPY.sectionInventory} loading={loading} error={err}>
          {invO ? (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              <KpiMini label={COPY.kpiSkuActive} value={String(formatInt(invO.skuActiveCount))} />
              <KpiMini label={COPY.kpiLowStock} value={String(formatInt(invO.lowStockCount))} />
              <KpiMini label={COPY.kpiOnHand} value={String(formatInt(invO.totalOnHand))} />
              <KpiMini label={COPY.kpiReserved} value={String(formatInt(invO.totalReserved))} />
              <KpiMini label={COPY.kpiStockValue} value={`${formatVnd(invO.totalOnHandValue)} đ`} />
            </div>
          ) : null}
        </DashboardSectionFrame>
        <DashboardSectionFrame title={COPY.sectionOrderStatus} loading={loading} error={err}>
          {ordBr?.buckets ? (
            <DonutStatusChart buckets={ordBr.buckets} labelFn={(l) => labelOrderStatus(l)} />
          ) : null}
        </DashboardSectionFrame>
        <DashboardSectionFrame title={COPY.sectionFulfillment} loading={loading} error={err}>
          {fulBr?.buckets ? (
            <DonutStatusChart buckets={fulBr.buckets} labelFn={(l) => labelFulfillmentStatus(l)} />
          ) : null}
        </DashboardSectionFrame>
        <DashboardSectionFrame title={COPY.sectionInventoryTx} loading={loading} error={err} className="lg:col-span-2">
          {invTrend?.points ? <InventoryTxStackedBar points={invTrend.points} /> : null}
        </DashboardSectionFrame>
        <DashboardSectionFrame title={COPY.sectionSla} loading={loading} error={err}>
          {sla ? (
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-2 text-center text-sm">
                <KpiMini label={COPY.kpiSlaAvg} value={formatDecimal(sla.avgHours, 1)} />
                <KpiMini label={COPY.kpiSlaP50} value={formatDecimal(sla.p50Hours, 1)} />
                <KpiMini label={COPY.kpiSlaP90} value={formatDecimal(sla.p90Hours, 1)} />
              </div>
              {sla.histogram ? <SlaHistogramBar histogram={sla.histogram} /> : null}
            </div>
          ) : null}
        </DashboardSectionFrame>
        <DashboardSectionFrame title={COPY.sectionLateOrders} loading={loading} error={err} className="lg:col-span-2">
          {late?.items?.length ? (
            <div className="overflow-x-auto text-sm">
              <table className="w-full min-w-[600px] border-collapse text-left">
                <thead>
                  <tr className="border-b text-xs text-muted-foreground">
                    <th className="py-2 pr-2">Mã</th>
                    <th className="py-2 pr-2">Khách</th>
                    <th className="py-2 pr-2">Trạng thái</th>
                    <th className="py-2 pr-2">Quá (giờ)</th>
                    <th className="py-2">{COPY.colSales}</th>
                  </tr>
                </thead>
                <tbody>
                  {late.items.map((o) => (
                    <tr
                      key={o.orderId}
                      className={cn("border-b border-border/50", o.elapsedHours > 2 * (late.slaHours || 72) && "bg-amber-500/10")}
                    >
                      <td className="py-1.5 pr-2 font-mono text-xs">
                        <Link
                          to={`/stock-manager/orders/${encodeURIComponent(String(o.orderId))}`}
                          className="text-primary underline-offset-2 hover:underline"
                        >
                          {o.orderCode}
                        </Link>
                      </td>
                      <td className="py-1.5 pr-2">{o.customerName}</td>
                      <td className="py-1.5 pr-2">{labelOrderStatus(o.orderStatus)}</td>
                      <td className="py-1.5 pr-2 tabular-nums">{formatDecimal(o.elapsedHours, 1)}</td>
                      <td className="py-1.5">{o.salesName}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : !loading && !err ? (
            <p className="text-sm text-muted-foreground">{COPY.noLateOrders}</p>
          ) : null}
        </DashboardSectionFrame>
        <DashboardSectionFrame title={COPY.sectionLowStock} loading={loading} error={err} className="lg:col-span-2">
          {invLow?.items?.length ? (
            <div className="max-h-72 overflow-y-auto text-sm">
              <table className="w-full min-w-[480px] border-collapse text-left">
                <thead>
                  <tr className="border-b text-xs text-muted-foreground">
                    <th className="py-1.5 pr-2">SKU</th>
                    <th className="py-1.5 pr-2">Còn bán</th>
                    <th className="py-1.5">{COPY.colDaysCover}</th>
                  </tr>
                </thead>
                <tbody>
                  {invLow.items.slice(0, 25).map((r) => (
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
        <DashboardSectionFrame title={COPY.sectionTopMoving} loading={loading} error={err} className="lg:col-span-2">
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
    </div>
  );
}
