using System.Text.Json.Nodes;
using BE_API.Service.IService;

namespace BE_API.Service.Ai.Tools;

public class GetInventoryOverviewTool(IDashboardInventoryService svc) : IAiTool
{
    public string Name => "get_inventory_overview";
    public string Description => "KPI tồn kho: SKU active, low stock, on-hand, reserved, on-hand value (VND).";
    public AiActorScope Scope => AiActorScope.Staff;

    public JsonObject ParametersSchema => Schemas.IntParam("defaultThreshold", "Ngưỡng low-stock mặc định khi SKU chưa có ReorderPoint (mặc định 10)");

    public async Task<AiToolResult> ExecuteAsync(JsonObject args, AiCallerContext caller, CancellationToken cancellationToken)
    {
        var data = await svc.GetOverviewAsync(AiToolArgs.GetInt(args, "defaultThreshold") ?? 10, cancellationToken);
        return AiToolResult.FromData(AiJson.Wrap(data));
    }
}

public class GetInventoryLowStockTool(IDashboardInventoryService svc) : IAiTool
{
    public string Name => "get_inventory_low_stock";
    public string Description => "Danh sách SKU dưới ngưỡng (kèm DaysOfCover). Cảnh báo cần bổ sung tồn.";
    public AiActorScope Scope => AiActorScope.Staff;

    public JsonObject ParametersSchema => new()
    {
        ["type"] = "object",
        ["properties"] = new JsonObject
        {
            ["threshold"] = new JsonObject { ["type"] = "integer", ["description"] = "Ngưỡng mặc định nếu SKU chưa có ReorderPoint (10)" },
            ["take"] = new JsonObject { ["type"] = "integer", ["description"] = "Số SKU trả về (100, max 500)" },
            ["windowDays"] = new JsonObject { ["type"] = "integer", ["description"] = "Cửa sổ tính DOC (30, max 180)" }
        }
    };

    public async Task<AiToolResult> ExecuteAsync(JsonObject args, AiCallerContext caller, CancellationToken cancellationToken)
    {
        var data = await svc.GetLowStockAsync(
            AiToolArgs.GetInt(args, "threshold") ?? 10,
            AiToolArgs.GetInt(args, "take") ?? 100,
            AiToolArgs.GetInt(args, "windowDays") ?? 30,
            cancellationToken);
        return AiToolResult.FromData(AiJson.Wrap(data));
    }
}

public class GetInventoryDaysOfCoverTool(IDashboardInventoryService svc) : IAiTool
{
    public string Name => "get_inventory_days_of_cover";
    public string Description => "Days of cover (DOC) = Available / avgDailyOut(windowDays). Sort tăng dần để thấy SKU sắp hết.";
    public AiActorScope Scope => AiActorScope.Staff;

    public JsonObject ParametersSchema => new()
    {
        ["type"] = "object",
        ["properties"] = new JsonObject
        {
            ["windowDays"] = new JsonObject { ["type"] = "integer", ["description"] = "Cửa sổ tính (30, max 180)" },
            ["take"] = new JsonObject { ["type"] = "integer", ["description"] = "Số SKU trả về (30, max 200)" }
        }
    };

    public async Task<AiToolResult> ExecuteAsync(JsonObject args, AiCallerContext caller, CancellationToken cancellationToken)
    {
        var data = await svc.GetDaysOfCoverAsync(
            AiToolArgs.GetInt(args, "windowDays") ?? 30,
            AiToolArgs.GetInt(args, "take") ?? 30,
            cancellationToken);
        return AiToolResult.FromData(AiJson.Wrap(data));
    }
}

public class GetInventoryTopMovingTool(IDashboardInventoryService svc) : IAiTool
{
    public string Name => "get_inventory_top_moving";
    public string Description => "Top SKU bán chạy theo tổng OUT trong khoảng thời gian.";
    public AiActorScope Scope => AiActorScope.Staff;

    public JsonObject ParametersSchema
    {
        get
        {
            var s = Schemas.DateRange();
            ((JsonObject)s["properties"]!)["limit"] = new JsonObject { ["type"] = "integer", ["description"] = "Số SKU (10, max 100)" };
            return s;
        }
    }

    public async Task<AiToolResult> ExecuteAsync(JsonObject args, AiCallerContext caller, CancellationToken cancellationToken)
    {
        var data = await svc.GetTopMovingAsync(
            AiToolArgs.GetDate(args, "fromDate"),
            AiToolArgs.GetDate(args, "toDate"),
            AiToolArgs.GetInt(args, "limit") ?? 10,
            cancellationToken);
        return AiToolResult.FromData(AiJson.Wrap(data));
    }
}
