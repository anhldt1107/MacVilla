using System.Text.Json.Nodes;
using BE_API.Service.IService;

namespace BE_API.Service.Ai.Tools;

public class GetArSummaryTool(IDashboardArService svc) : IAiTool
{
    public string Name => "get_ar_summary";
    public string Description => "Tổng quan công nợ khách: chưa thanh toán, quá hạn, sắp đến hạn.";
    public AiActorScope Scope => AiActorScope.Admin | AiActorScope.Manager;
    public JsonObject ParametersSchema => Schemas.IntParam("dueSoonDays", "Số ngày coi là sắp đến hạn (mặc định 7)");

    public async Task<AiToolResult> ExecuteAsync(JsonObject args, AiCallerContext caller, CancellationToken cancellationToken)
    {
        var data = await svc.GetSummaryAsync(AiToolArgs.GetInt(args, "dueSoonDays") ?? 7, cancellationToken);
        return AiToolResult.FromData(AiJson.Wrap(data));
    }
}

public class GetArAgingTool(IDashboardArService svc) : IAiTool
{
    public string Name => "get_ar_aging";
    public string Description => "Aging buckets công nợ: Current / 1-30 / 31-60 / 61-90 / >90 ngày.";
    public AiActorScope Scope => AiActorScope.Admin | AiActorScope.Manager;
    public JsonObject ParametersSchema => Schemas.Empty();

    public async Task<AiToolResult> ExecuteAsync(JsonObject args, AiCallerContext caller, CancellationToken cancellationToken)
    {
        var data = await svc.GetAgingAsync(cancellationToken);
        return AiToolResult.FromData(AiJson.Wrap(data));
    }
}

public class GetArTopDebtorsTool(IDashboardArService svc) : IAiTool
{
    public string Name => "get_ar_top_debtors";
    public string Description => "Top khách nợ nhiều nhất (sắp xếp theo số dư còn lại).";
    public AiActorScope Scope => AiActorScope.Admin | AiActorScope.Manager;
    public JsonObject ParametersSchema => Schemas.IntParam("limit", "Số khách trả về (mặc định 10, tối đa 50)");

    public async Task<AiToolResult> ExecuteAsync(JsonObject args, AiCallerContext caller, CancellationToken cancellationToken)
    {
        var data = await svc.GetTopDebtorsAsync(AiToolArgs.GetInt(args, "limit") ?? 10, cancellationToken);
        return AiToolResult.FromData(AiJson.Wrap(data));
    }
}

public class GetArTimeseriesTool(IDashboardArService svc) : IAiTool
{
    public string Name => "get_ar_timeseries";
    public string Description => "Tổng dư nợ và quá hạn theo thời gian (snapshot end-of-bucket).";
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
