import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { ApiRequestError } from "@/services/api/apiEnvelope";
import {
  fetchDashboardSalesPerformancePerSalesDetail,
  fetchDashboardSalesPipelineConversion,
  fetchDashboardSalesPipelineFunnel,
  fetchDashboardSalesPipelineTimeInStage,
} from "@/services/admin/adminDashboardApi";
import { DashboardDateRange } from "@/components/dashboard-internal/DashboardDateRange";
import { DashboardSectionFrame } from "@/components/dashboard-internal/DashboardSectionFrame";
import { KpiMini } from "@/components/dashboard-internal/KpiMini";
import { FunnelBarChart, TimeInStageBarChart } from "@/components/dashboard-internal/DashboardCharts";
import { defaultDateRange30d, formatInt, formatRate01, formatVnd, formatDecimal } from "@/components/dashboard-internal/dashboardFormat";
import { QUOTE_STATUS_VI } from "@/components/dashboard-internal/quoteStatusLabels";

function pick(obj, camel, pascal) {
  if (!obj || typeof obj !== "object") return undefined;
  if (obj[camel] !== undefined && obj[camel] !== null) return obj[camel];
  if (obj[pascal] !== undefined && obj[pascal] !== null) return obj[pascal];
  return undefined;
}

export function SalerRevenuePage() {
  const { accessToken, user, isAuthenticated } = useAuth();
  const init = defaultDateRange30d();
  const [fromDate, setFromDate] = useState(init.fromDate);
  const [toDate, setToDate] = useState(init.toDate);

  const [kpi, setKpi] = useState(null);
  const [kpiLoading, setKpiLoading] = useState(true);
  const [kpiError, setKpiError] = useState(null);

  const [conversion, setConversion] = useState(null);
  const [convLoading, setConvLoading] = useState(true);
  const [convError, setConvError] = useState(null);

  const [funnel, setFunnel] = useState(null);
  const [funnelLoading, setFunnelLoading] = useState(true);
  const [funnelError, setFunnelError] = useState(null);

  const [timeStage, setTimeStage] = useState(null);
  const [tsLoading, setTsLoading] = useState(true);
  const [tsError, setTsError] = useState(null);

  const salesId = user?.id;

  const load = useCallback(async () => {
    if (!isAuthenticated || !accessToken || salesId == null) return;
    const q = { fromDate, toDate, salesId };

    setKpiLoading(true);
    setKpiError(null);
    setConvLoading(true);
    setConvError(null);
    setFunnelLoading(true);
    setFunnelError(null);
    setTsLoading(true);
    setTsError(null);

    const settle = async (fn, setData, setErr, setLoad) => {
      try {
        setData(await fn(accessToken, q));
      } catch (e) {
        setData(null);
        setErr(e instanceof ApiRequestError ? e : e instanceof Error ? e : new Error("Lỗi"));
      } finally {
        setLoad(false);
      }
    };

    await Promise.all([
      settle(fetchDashboardSalesPerformancePerSalesDetail, setKpi, setKpiError, setKpiLoading),
      settle(fetchDashboardSalesPipelineConversion, setConversion, setConvError, setConvLoading),
      settle(fetchDashboardSalesPipelineFunnel, setFunnel, setFunnelError, setFunnelLoading),
      settle(fetchDashboardSalesPipelineTimeInStage, setTimeStage, setTsError, setTsLoading),
    ]);
  }, [accessToken, fromDate, toDate, isAuthenticated, salesId]);

  useEffect(() => {
    void load();
  }, [load]);

  const d = kpi && typeof kpi === "object" ? kpi : null;
  const c = conversion && typeof conversion === "object" ? conversion : null;
  const steps = funnel && typeof funnel === "object" ? (Array.isArray(funnel.steps ?? funnel.Steps) ? (funnel.steps ?? funnel.Steps) : []) : [];
  const stages = timeStage && typeof timeStage === "object" ? (Array.isArray(timeStage.stages ?? timeStage.Stages) ? (timeStage.stages ?? timeStage.Stages) : []) : [];

  return (
    <div className="space-y-4 pb-10">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Doanh thu cá nhân</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Chỉ số bán hàng, pipeline và thời gian xử lý — theo kỳ.
          </p>
        </div>
        <Link to="/saler" className="text-sm font-medium text-primary underline-offset-2 hover:underline">
          Xem pipeline trên Dashboard
        </Link>
      </div>

      <DashboardDateRange fromDate={fromDate} toDate={toDate} onFromChange={setFromDate} onToChange={setToDate} />

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Section 1: KPI tong quan */}
        <DashboardSectionFrame title="Hiệu suất bán hàng" loading={kpiLoading} error={kpiError}>
          {d ? (
            <div className="grid gap-2 grid-cols-2 sm:grid-cols-3">
              <KpiMini label="Báo giá" value={String(formatInt(pick(d, "quoteCount", "QuoteCount")))} />
              <KpiMini label="Đơn hàng" value={String(formatInt(pick(d, "orderCount", "OrderCount")))} />
              <KpiMini
                label="Doanh thu góp"
                value={`${formatVnd(pick(d, "revenueContribution", "RevenueContribution"))} đ`}
              />
              <KpiMini label="Đã duyệt" value={String(formatInt(pick(d, "approvedCount", "ApprovedCount")))} />
              <KpiMini label="KH chấp nhận" value={String(formatInt(pick(d, "acceptedCount", "AcceptedCount")))} />
              <KpiMini
                label="Chuyển đơn"
                value={String(formatInt(pick(d, "convertedCount", "ConvertedCount")))}
                hint={`Tỷ lệ: ${formatRate01(pick(d, "conversionRate", "ConversionRate"))}`}
              />
            </div>
          ) : !kpiError ? (
            <p className="text-sm text-muted-foreground">Không có dữ liệu trong kỳ.</p>
          ) : null}
        </DashboardSectionFrame>

        {/* Section 2: Phan tich chuyen doi */}
        <DashboardSectionFrame title="Phân tích chuyển đổi" loading={convLoading} error={convError}>
          {c ? (
            <div className="grid gap-2 grid-cols-2">
              <KpiMini
                label="Tỷ lệ chấp nhận"
                value={formatRate01(pick(c, "acceptRate", "AcceptRate"))}
                hint={`${formatInt(pick(c, "acceptedQuoteCount", "AcceptedQuoteCount"))} / ${formatInt(pick(c, "approvedQuoteCount", "ApprovedQuoteCount"))} BG duyệt`}
              />
              <KpiMini
                label="Tỷ lệ CVT"
                value={formatRate01(pick(c, "conversionRate", "ConversionRate"))}
                hint={`${formatInt(pick(c, "convertedQuoteCount", "ConvertedQuoteCount"))} chuyển đơn`}
              />
              <KpiMini
                label="TB chờ duyệt"
                value={`${formatDecimal(pick(c, "avgTimeRequestedToApprovedDays", "AvgTimeRequestedToApprovedDays"), 1)} ngày`}
              />
              <KpiMini
                label="TB KH chấp nhận"
                value={`${formatDecimal(pick(c, "avgTimeApprovedToAcceptedDays", "AvgTimeApprovedToAcceptedDays"), 1)} ngày`}
              />
            </div>
          ) : !convError ? (
            <p className="text-sm text-muted-foreground">Không có dữ liệu chuyển đổi.</p>
          ) : null}
        </DashboardSectionFrame>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Section 3: Pipeline funnel */}
        <DashboardSectionFrame title="Phễu báo giá" loading={funnelLoading} error={funnelError}>
          {steps.length > 0 ? (
            <FunnelBarChart steps={steps} labelMap={QUOTE_STATUS_VI} />
          ) : !funnelError ? (
            <p className="text-sm text-muted-foreground">Không có dữ liệu pipeline.</p>
          ) : null}
        </DashboardSectionFrame>

        {/* Section 4: Thoi gian xu ly */}
        <DashboardSectionFrame title="Thời gian xử lý theo giai đoạn" loading={tsLoading} error={tsError}>
          {stages.length > 0 ? (
            <TimeInStageBarChart stages={stages} labelMap={QUOTE_STATUS_VI} />
          ) : !tsError ? (
            <p className="text-sm text-muted-foreground">Chưa đủ dữ liệu thời gian xử lý.</p>
          ) : null}
        </DashboardSectionFrame>
      </div>
    </div>
  );
}
