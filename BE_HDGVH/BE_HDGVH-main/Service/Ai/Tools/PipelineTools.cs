using System.Text.Json.Nodes;
using BE_API.Service.IService;

namespace BE_API.Service.Ai.Tools;

public class GetSalesFunnelTool(IDashboardSalesPipelineService svc) : IAiTool
{
    public string Name => "get_sales_funnel";
    public string Description => "Funnel báo giá theo trạng thái (Requested → Draft → PendingApproval → Approved → CustomerAccepted → Converted).";
    public AiActorScope Scope => AiActorScope.Staff;

    public JsonObject ParametersSchema
    {
        get
        {
            var schema = Schemas.DateRange();
            ((JsonObject)schema["properties"]!)["salesId"] = new JsonObject
            {
                ["type"] = "integer",
                ["description"] = "ID Sales (tự gán nếu caller là Sales). Manager/Admin có thể bỏ qua để xem tổng."
            };
            return schema;
        }
    }

    public async Task<AiToolResult> ExecuteAsync(JsonObject args, AiCallerContext caller, CancellationToken cancellationToken)
    {
        var salesId = ResolveSalesId(args, caller);
        var data = await svc.GetFunnelAsync(
            AiToolArgs.GetDate(args, "fromDate"),
            AiToolArgs.GetDate(args, "toDate"),
            salesId,
            cancellationToken);
        return AiToolResult.FromData(AiJson.Wrap(data));
    }

    internal static int? ResolveSalesId(JsonObject args, AiCallerContext caller)
    {
        if (caller.Role == AiActorScope.Sales) return caller.OwnerId;
        return AiToolArgs.GetInt(args, "salesId");
    }
}

public class GetQuotesExpiringSoonTool(IDashboardSalesPipelineService svc) : IAiTool
{
    public string Name => "get_quotes_expiring_soon";
    public string Description => "Báo giá Approved sắp hết hạn (trong N ngày tới).";
    public AiActorScope Scope => AiActorScope.Staff;

    public JsonObject ParametersSchema => new()
    {
        ["type"] = "object",
        ["properties"] = new JsonObject
        {
            ["days"] = new JsonObject { ["type"] = "integer", ["description"] = "Số ngày tới (mặc định 7, tối đa 60)" },
            ["salesId"] = new JsonObject { ["type"] = "integer", ["description"] = "Optional ID Sales" }
        }
    };

    public async Task<AiToolResult> ExecuteAsync(JsonObject args, AiCallerContext caller, CancellationToken cancellationToken)
    {
        var salesId = GetSalesFunnelTool.ResolveSalesId(args, caller);
        var data = await svc.GetExpiringSoonAsync(AiToolArgs.GetInt(args, "days") ?? 7, salesId, cancellationToken);
        return AiToolResult.FromData(AiJson.Wrap(data));
    }
}
