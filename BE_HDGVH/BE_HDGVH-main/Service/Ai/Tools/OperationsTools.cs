using System.Text.Json.Nodes;
using BE_API.Service.IService;

namespace BE_API.Service.Ai.Tools;

public class GetOrderStatusBreakdownTool(IDashboardOperationsService svc) : IAiTool
{
    public string Name => "get_order_status_breakdown";
    public string Description => "Phân bố đơn hàng theo trạng thái (donut chart).";
    public AiActorScope Scope => AiActorScope.Staff;
    public JsonObject ParametersSchema => Schemas.DateRange();

    public async Task<AiToolResult> ExecuteAsync(JsonObject args, AiCallerContext caller, CancellationToken cancellationToken)
    {
        var data = await svc.GetOrderStatusBreakdownAsync(
            AiToolArgs.GetDate(args, "fromDate"),
            AiToolArgs.GetDate(args, "toDate"),
            cancellationToken);
        return AiToolResult.FromData(AiJson.Wrap(data));
    }
}

public class GetLateOrdersTool(IDashboardOperationsService svc) : IAiTool
{
    public string Name => "get_late_orders";
    public string Description => "Đơn ở Confirmed/Processing/ReadyToShip đã quá slaHours mà chưa Shipped.";
    public AiActorScope Scope => AiActorScope.Staff;
    public JsonObject ParametersSchema => Schemas.IntParam("slaHours", "Ngưỡng SLA giờ (mặc định 72, max 720)");

    public async Task<AiToolResult> ExecuteAsync(JsonObject args, AiCallerContext caller, CancellationToken cancellationToken)
    {
        var data = await svc.GetLateOrdersAsync(AiToolArgs.GetInt(args, "slaHours") ?? 72, cancellationToken);
        return AiToolResult.FromData(AiJson.Wrap(data));
    }
}

public class GetOrderByCodeTool(IAdminOrderService svc) : IAiTool
{
    public string Name => "get_order_by_code";
    public string Description => "Tra cứu chi tiết đơn theo OrderCode (nội bộ Admin/Manager/Sales). Trả lỗi nếu không tồn tại.";
    public AiActorScope Scope => AiActorScope.Staff;

    public JsonObject ParametersSchema => new()
    {
        ["type"] = "object",
        ["properties"] = new JsonObject
        {
            ["orderCode"] = new JsonObject { ["type"] = "string", ["description"] = "Mã đơn, ví dụ DEMO-O-B2C-01" }
        },
        ["required"] = new JsonArray { "orderCode" }
    };

    public async Task<AiToolResult> ExecuteAsync(JsonObject args, AiCallerContext caller, CancellationToken cancellationToken)
    {
        var code = AiToolArgs.GetString(args, "orderCode");
        if (string.IsNullOrWhiteSpace(code))
            return AiToolResult.FromData(AiJson.Error("Thiếu orderCode.", "VALIDATION_ERROR"));

        try
        {
            var data = await svc.GetByCodeAsync(code, cancellationToken: cancellationToken);
            var card = AiAttachmentBuilder.Order(data.OrderCode, data.OrderStatus, data.PayableTotal, caller.Role);
            return AiToolResult.Of(AiJson.Wrap(data), new List<Dto.Ai.AiAttachmentDto> { card });
        }
        catch (KeyNotFoundException knf)
        {
            return AiToolResult.FromData(AiJson.Error(knf.Message, "NOT_FOUND"));
        }
    }
}
