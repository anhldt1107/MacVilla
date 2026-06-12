using System.Text.Json.Nodes;
using BE_API.Service.IService;

namespace BE_API.Service.Ai.Tools;

public class GetRevenueOverviewTool(IDashboardRevenueService svc) : IAiTool
{
    public string Name => "get_revenue_overview";
    public string Description => "Tổng quan doanh thu trong khoảng thời gian (KPI cards: net, in, out, đơn, AOV).";
    public AiActorScope Scope => AiActorScope.Admin | AiActorScope.Manager;
    public JsonObject ParametersSchema => Schemas.DateRange();

    public async Task<AiToolResult> ExecuteAsync(JsonObject args, AiCallerContext caller, CancellationToken cancellationToken)
    {
        var data = await svc.GetOverviewAsync(AiToolArgs.GetDate(args, "fromDate"), AiToolArgs.GetDate(args, "toDate"), cancellationToken);
        return AiToolResult.FromData(AiJson.Wrap(data));
    }
}

public class GetRevenueTimeseriesTool(IDashboardRevenueService svc) : IAiTool
{
    public string Name => "get_revenue_timeseries";
    public string Description => "Doanh thu theo thời gian (line chart). granularity: day|week|month.";
    public AiActorScope Scope => AiActorScope.Admin | AiActorScope.Manager;
    public JsonObject ParametersSchema => Schemas.DateRangeWithGranularity();

    public async Task<AiToolResult> ExecuteAsync(JsonObject args, AiCallerContext caller, CancellationToken cancellationToken)
    {
        var data = await svc.GetTimeseriesAsync(
            AiToolArgs.GetDate(args, "fromDate"),
            AiToolArgs.GetDate(args, "toDate"),
            AiToolArgs.GetString(args, "granularity") ?? "day",
            cancellationToken);
        return AiToolResult.FromData(AiJson.Wrap(data));
    }
}

public class GetRevenueByPaymentMethodTool(IDashboardRevenueService svc) : IAiTool
{
    public string Name => "get_revenue_by_payment_method";
    public string Description => "Tỷ trọng doanh thu theo phương thức thanh toán (PayOS / BankTransfer / Cash).";
    public AiActorScope Scope => AiActorScope.Admin | AiActorScope.Manager;
    public JsonObject ParametersSchema => Schemas.DateRange();

    public async Task<AiToolResult> ExecuteAsync(JsonObject args, AiCallerContext caller, CancellationToken cancellationToken)
    {
        var data = await svc.GetByPaymentMethodAsync(AiToolArgs.GetDate(args, "fromDate"), AiToolArgs.GetDate(args, "toDate"), cancellationToken);
        return AiToolResult.FromData(AiJson.Wrap(data));
    }
}

public class GetRevenueByChannelTool(IDashboardRevenueService svc) : IAiTool
{
    public string Name => "get_revenue_by_channel";
    public string Description => "Doanh thu B2C vs B2B theo thời gian.";
    public AiActorScope Scope => AiActorScope.Admin | AiActorScope.Manager;
    public JsonObject ParametersSchema => Schemas.DateRangeWithGranularity();

    public async Task<AiToolResult> ExecuteAsync(JsonObject args, AiCallerContext caller, CancellationToken cancellationToken)
    {
        var data = await svc.GetByChannelAsync(
            AiToolArgs.GetDate(args, "fromDate"),
            AiToolArgs.GetDate(args, "toDate"),
            AiToolArgs.GetString(args, "granularity") ?? "day",
            cancellationToken);
        return AiToolResult.FromData(AiJson.Wrap(data));
    }
}
