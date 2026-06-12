using System.Text.Json.Nodes;
using BE_API.Service.IService;

namespace BE_API.Service.Ai.Tools;

public class B2BGetMyOrdersTool(IStoreB2BOrderService svc) : IAiTool
{
    public string Name => "get_my_orders";
    public string Description =>
        "Danh sách đơn hàng B2B của khách đang đăng nhập (mới nhất trước, phân trang). Ưu tiên khi hỏi đơn/tình trạng không có mã; có thể lọc orderStatus/paymentStatus.";
    public AiActorScope Scope => AiActorScope.B2B;

    public JsonObject ParametersSchema => new()
    {
        ["type"] = "object",
        ["properties"] = new JsonObject
        {
            ["page"] = new JsonObject { ["type"] = "integer", ["description"] = "Trang (mặc định 1)" },
            ["pageSize"] = new JsonObject { ["type"] = "integer", ["description"] = "Kích thước trang (mặc định 20, max 50)" },
            ["orderStatus"] = new JsonObject { ["type"] = "string", ["description"] = "Lọc theo OrderStatus" },
            ["paymentStatus"] = new JsonObject { ["type"] = "string", ["description"] = "Lọc theo PaymentStatus" }
        }
    };

    public async Task<AiToolResult> ExecuteAsync(JsonObject args, AiCallerContext caller, CancellationToken cancellationToken)
    {
        var data = await svc.GetPagedAsync(
            caller.OwnerId,
            AiToolArgs.GetInt(args, "page") ?? 1,
            AiToolArgs.GetInt(args, "pageSize") ?? 20,
            AiToolArgs.GetString(args, "orderStatus"),
            AiToolArgs.GetString(args, "paymentStatus"),
            cancellationToken);

        var cards = data.Items
            .Select(o => AiAttachmentBuilder.Order(o.OrderCode, o.OrderStatus, o.PayableTotal, AiActorScope.B2B))
            .ToList();

        return AiToolResult.Of(AiJson.Wrap(data), cards);
    }
}

public class B2BGetMyOrderByCodeTool(IStoreB2BOrderService svc) : IAiTool
{
    public string Name => "get_my_order_by_code";
    public string Description =>
        "Chi tiết đơn hàng B2B theo orderCode (chỉ đơn của khách đang đăng nhập). Dùng khi user đã nêu mã hoặc đã chọn đơn từ get_my_orders.";
    public AiActorScope Scope => AiActorScope.B2B;

    public JsonObject ParametersSchema => new()
    {
        ["type"] = "object",
        ["properties"] = new JsonObject
        {
            ["orderCode"] = new JsonObject { ["type"] = "string", ["description"] = "Mã đơn" }
        },
        ["required"] = new JsonArray { "orderCode" }
    };

    public async Task<AiToolResult> ExecuteAsync(JsonObject args, AiCallerContext caller, CancellationToken cancellationToken)
    {
        var code = AiToolArgs.GetString(args, "orderCode");
        if (string.IsNullOrWhiteSpace(code)) return AiToolResult.FromData(AiJson.Error("Thiếu orderCode.", "VALIDATION_ERROR"));
        try
        {
            var data = await svc.GetByOrderCodeAsync(caller.OwnerId, code, cancellationToken);
            var card = AiAttachmentBuilder.Order(data.OrderCode, data.OrderStatus, data.PayableTotal, AiActorScope.B2B);
            return AiToolResult.Of(AiJson.Wrap(data), new List<Dto.Ai.AiAttachmentDto> { card });
        }
        catch (KeyNotFoundException knf) { return AiToolResult.FromData(AiJson.Error(knf.Message, "NOT_FOUND")); }
    }
}

public class B2BGetMyOrderTimelineTool(IStoreB2BOrderService svc) : IAiTool
{
    public string Name => "get_my_order_timeline";
    public string Description =>
        "Timeline (các sự kiện theo thời gian) của một đơn B2B. Dùng sau khi đã có orderCode từ user hoặc từ get_my_orders.";
    public AiActorScope Scope => AiActorScope.B2B;

    public JsonObject ParametersSchema => new()
    {
        ["type"] = "object",
        ["properties"] = new JsonObject
        {
            ["orderCode"] = new JsonObject { ["type"] = "string" }
        },
        ["required"] = new JsonArray { "orderCode" }
    };

    public async Task<AiToolResult> ExecuteAsync(JsonObject args, AiCallerContext caller, CancellationToken cancellationToken)
    {
        var code = AiToolArgs.GetString(args, "orderCode");
        if (string.IsNullOrWhiteSpace(code)) return AiToolResult.FromData(AiJson.Error("Thiếu orderCode.", "VALIDATION_ERROR"));
        try
        {
            var data = await svc.GetTimelineAsync(caller.OwnerId, code, cancellationToken);
            return AiToolResult.FromData(AiJson.Wrap(data));
        }
        catch (KeyNotFoundException knf) { return AiToolResult.FromData(AiJson.Error(knf.Message, "NOT_FOUND")); }
    }
}

public class B2BGetMyDebtSummaryTool(IStoreB2BInvoiceService svc) : IAiTool
{
    public string Name => "get_my_debt_summary";
    public string Description => "Tổng quan công nợ của khách B2B đang đăng nhập (số dư, quá hạn, sắp đến hạn).";
    public AiActorScope Scope => AiActorScope.B2B;
    public JsonObject ParametersSchema => Schemas.Empty();

    public async Task<AiToolResult> ExecuteAsync(JsonObject args, AiCallerContext caller, CancellationToken cancellationToken)
    {
        var data = await svc.GetDebtSummaryAsync(caller.OwnerId, cancellationToken);
        return AiToolResult.FromData(AiJson.Wrap(data));
    }
}

public class B2BGetMyInvoicesTool(IStoreB2BInvoiceService svc) : IAiTool
{
    public string Name => "get_my_invoices";
    public string Description => "Danh sách hóa đơn của khách B2B đang đăng nhập.";
    public AiActorScope Scope => AiActorScope.B2B;

    public JsonObject ParametersSchema => new()
    {
        ["type"] = "object",
        ["properties"] = new JsonObject
        {
            ["page"] = new JsonObject { ["type"] = "integer" },
            ["pageSize"] = new JsonObject { ["type"] = "integer" },
            ["status"] = new JsonObject { ["type"] = "string", ["description"] = "Lọc theo Invoice Status" }
        }
    };

    public async Task<AiToolResult> ExecuteAsync(JsonObject args, AiCallerContext caller, CancellationToken cancellationToken)
    {
        var data = await svc.GetInvoicesPagedAsync(
            caller.OwnerId,
            AiToolArgs.GetInt(args, "page") ?? 1,
            AiToolArgs.GetInt(args, "pageSize") ?? 20,
            AiToolArgs.GetString(args, "status"),
            cancellationToken);
        return AiToolResult.FromData(AiJson.Wrap(data));
    }
}

public class B2BGetMyInvoiceByNumberTool(IStoreB2BInvoiceService svc) : IAiTool
{
    public string Name => "get_my_invoice_by_number";
    public string Description => "Chi tiết hóa đơn theo InvoiceNumber.";
    public AiActorScope Scope => AiActorScope.B2B;

    public JsonObject ParametersSchema => new()
    {
        ["type"] = "object",
        ["properties"] = new JsonObject
        {
            ["invoiceNumber"] = new JsonObject { ["type"] = "string" }
        },
        ["required"] = new JsonArray { "invoiceNumber" }
    };

    public async Task<AiToolResult> ExecuteAsync(JsonObject args, AiCallerContext caller, CancellationToken cancellationToken)
    {
        var code = AiToolArgs.GetString(args, "invoiceNumber");
        if (string.IsNullOrWhiteSpace(code)) return AiToolResult.FromData(AiJson.Error("Thiếu invoiceNumber.", "VALIDATION_ERROR"));
        try
        {
            var data = await svc.GetInvoiceByNumberAsync(caller.OwnerId, code, cancellationToken);
            return AiToolResult.FromData(AiJson.Wrap(data));
        }
        catch (KeyNotFoundException knf) { return AiToolResult.FromData(AiJson.Error(knf.Message, "NOT_FOUND")); }
    }
}

public class B2BGetMyQuotesTool(IStoreB2BQuoteService svc) : IAiTool
{
    public string Name => "get_my_quotes";
    public string Description => "Danh sách báo giá B2B của khách (các trạng thái được phép xem).";
    public AiActorScope Scope => AiActorScope.B2B;

    public JsonObject ParametersSchema => new()
    {
        ["type"] = "object",
        ["properties"] = new JsonObject
        {
            ["page"] = new JsonObject { ["type"] = "integer" },
            ["pageSize"] = new JsonObject { ["type"] = "integer" },
            ["status"] = new JsonObject { ["type"] = "string" }
        }
    };

    public async Task<AiToolResult> ExecuteAsync(JsonObject args, AiCallerContext caller, CancellationToken cancellationToken)
    {
        var data = await svc.GetPagedAsync(
            caller.OwnerId,
            AiToolArgs.GetInt(args, "page") ?? 1,
            AiToolArgs.GetInt(args, "pageSize") ?? 20,
            AiToolArgs.GetString(args, "status"),
            cancellationToken);
        return AiToolResult.FromData(AiJson.Wrap(data));
    }
}

public class B2BGetMyQuoteByCodeTool(IStoreB2BQuoteService svc) : IAiTool
{
    public string Name => "get_my_quote_by_code";
    public string Description => "Chi tiết báo giá B2B theo quoteCode.";
    public AiActorScope Scope => AiActorScope.B2B;

    public JsonObject ParametersSchema => new()
    {
        ["type"] = "object",
        ["properties"] = new JsonObject
        {
            ["quoteCode"] = new JsonObject { ["type"] = "string" }
        },
        ["required"] = new JsonArray { "quoteCode" }
    };

    public async Task<AiToolResult> ExecuteAsync(JsonObject args, AiCallerContext caller, CancellationToken cancellationToken)
    {
        var code = AiToolArgs.GetString(args, "quoteCode");
        if (string.IsNullOrWhiteSpace(code)) return AiToolResult.FromData(AiJson.Error("Thiếu quoteCode.", "VALIDATION_ERROR"));
        try
        {
            var data = await svc.GetByCodeAsync(caller.OwnerId, code, cancellationToken);
            return AiToolResult.FromData(AiJson.Wrap(data));
        }
        catch (KeyNotFoundException knf) { return AiToolResult.FromData(AiJson.Error(knf.Message, "NOT_FOUND")); }
    }
}
