using System.Text.Json.Nodes;
using BE_API.Service.IService;

namespace BE_API.Service.Ai.Tools;

public class B2CGetMyOrdersTool(IStoreOrderService svc) : IAiTool
{
    public string Name => "get_my_orders";
    public string Description =>
        "Danh sách đơn hàng B2C của khách đang đăng nhập (mới nhất trước, phân trang). Ưu tiên dùng khi user hỏi đơn của tôi / tình trạng đơn / đơn gần nhất mà chưa có mã.";
    public AiActorScope Scope => AiActorScope.B2C;

    public JsonObject ParametersSchema => new()
    {
        ["type"] = "object",
        ["properties"] = new JsonObject
        {
            ["page"] = new JsonObject { ["type"] = "integer", ["description"] = "Trang (mặc định 1)" },
            ["pageSize"] = new JsonObject { ["type"] = "integer", ["description"] = "Kích thước trang (20, max 50)" }
        }
    };

    public async Task<AiToolResult> ExecuteAsync(JsonObject args, AiCallerContext caller, CancellationToken cancellationToken)
    {
        var data = await svc.ListMyOrdersAsync(
            caller.OwnerId,
            AiToolArgs.GetInt(args, "page") ?? 1,
            AiToolArgs.GetInt(args, "pageSize") ?? 20,
            cancellationToken);

        var cards = data.Items
            .Select(o => AiAttachmentBuilder.Order(o.OrderCode, o.OrderStatus, o.TotalAmount, AiActorScope.B2C))
            .ToList();

        return AiToolResult.Of(AiJson.Wrap(data), cards);
    }
}

public class B2CGetMyOrderByCodeTool(IStoreOrderService svc) : IAiTool
{
    public string Name => "get_my_order_by_code";
    public string Description =>
        "Chi tiết đơn B2C theo orderCode (chỉ đơn của khách đang đăng nhập). Dùng khi user đã nêu mã hoặc đã chọn đơn từ get_my_orders.";
    public AiActorScope Scope => AiActorScope.B2C;

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
            var data = await svc.GetMyOrderByCodeAsync(caller.OwnerId, code, cancellationToken);
            var card = AiAttachmentBuilder.Order(data.OrderCode, data.OrderStatus, data.PayableTotal, AiActorScope.B2C);
            return AiToolResult.Of(AiJson.Wrap(data), new List<Dto.Ai.AiAttachmentDto> { card });
        }
        catch (KeyNotFoundException knf) { return AiToolResult.FromData(AiJson.Error(knf.Message, "NOT_FOUND")); }
    }
}

public class B2CGetMyOrderTimelineTool(IStoreOrderService svc) : IAiTool
{
    public string Name => "get_my_order_timeline";
    public string Description =>
        "Timeline đơn B2C theo orderCode. Dùng sau khi đã có orderCode từ user hoặc từ get_my_orders.";
    public AiActorScope Scope => AiActorScope.B2C;

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

public class B2CSearchProductsTool(IStoreCatalogService svc) : IAiTool
{
    public string Name => "search_products";
    public string Description => "Tìm sản phẩm trong catalog (search keyword + tùy chọn lọc theo categoryId).";
    public AiActorScope Scope => AiActorScope.B2C | AiActorScope.B2B;

    public JsonObject ParametersSchema => new()
    {
        ["type"] = "object",
        ["properties"] = new JsonObject
        {
            ["search"] = new JsonObject
            {
                ["type"] = "string",
                ["description"] = "Từ khóa: tên, slug sản phẩm; hoặc SKU / tên biến thể (variant)."
            },
            ["categoryId"] = new JsonObject { ["type"] = "integer", ["description"] = "Lọc theo category" },
            ["minPrice"] = new JsonObject { ["type"] = "number", ["description"] = "Giá tối thiểu (VND, dùng giá BasePrice của sản phẩm). Áp dụng khi user nói 'từ X', 'trên X', 'lớn hơn X', 'trong khoảng X-Y'." },
            ["maxPrice"] = new JsonObject { ["type"] = "number", ["description"] = "Giá tối đa (VND). Áp dụng khi user nói 'đến Y', 'dưới Y', 'nhỏ hơn Y', 'trong khoảng X-Y'." },
            ["page"] = new JsonObject { ["type"] = "integer" },
            ["pageSize"] = new JsonObject { ["type"] = "integer", ["description"] = "Mặc định 10, max 50" }
        }
    };

    public async Task<AiToolResult> ExecuteAsync(JsonObject args, AiCallerContext caller, CancellationToken cancellationToken)
    {
        var data = await svc.GetProductsPagedAsync(
            AiToolArgs.GetInt(args, "page") ?? 1,
            AiToolArgs.GetInt(args, "pageSize") ?? 10,
            AiToolArgs.GetInt(args, "categoryId"),
            includeSubcategories: true,
            AiToolArgs.GetString(args, "search"),
            AiToolArgs.GetDecimal(args, "minPrice"),
            AiToolArgs.GetDecimal(args, "maxPrice"),
            sort: null,
            inStockOnly: false,
            attributeValueIds: null,
            cancellationToken);

        var cards = data.Items
            .Select(p => AiAttachmentBuilder.Product(p.Id, p.Slug, p.Name, p.ImageUrl, p.BasePrice))
            .ToList();

        return AiToolResult.Of(AiJson.Wrap(data), cards);
    }
}

/// <summary>
/// Chi tiết sản phẩm (mô tả, thuộc tính, biến thể SKU) — dùng trước khi khẳng định thông số kỹ thuật cụ thể.
/// </summary>
public class GetProductDetailTool(IStoreCatalogService svc) : IAiTool
{
    public string Name => "get_product_detail";
    public string Description =>
        "Chi tiết một sản phẩm cụ thể: mô tả, thuộc tính (attributes), các biến thể SKU. Dùng khi user hỏi chi tiết tên/model/SKU hoặc sau search_products đã chọn ứng viên.";
    public AiActorScope Scope => AiActorScope.B2C | AiActorScope.B2B;

    public JsonObject ParametersSchema => new()
    {
        ["type"] = "object",
        ["properties"] = new JsonObject
        {
            ["productId"] = new JsonObject
            {
                ["type"] = "integer",
                ["description"] = "Id sản phẩm (ưu tiên nếu biết)."
            },
            ["slug"] = new JsonObject
            {
                ["type"] = "string",
                ["description"] = "Slug SEO hoặc id dạng chuỗi — dùng khi không có productId."
            }
        },
        ["description"] = JsonValue.Create("Phải cung cấp productId (số > 0) hoặc slug không rỗng.")
    };

    public async Task<AiToolResult> ExecuteAsync(JsonObject args, AiCallerContext caller, CancellationToken cancellationToken)
    {
        var pid = AiToolArgs.GetInt(args, "productId");
        var key = (AiToolArgs.GetString(args, "slug") ?? AiToolArgs.GetString(args, "slug_or_id"))?.Trim()
                  ?? "";

        if (pid is null || pid <= 0)
        {
            if (string.IsNullOrEmpty(key))
                return AiToolResult.FromData(AiJson.Error("Thiếu productId hoặc slug.", "VALIDATION_ERROR"));
            try
            {
                var data = await svc.GetProductBySlugOrIdAsync(key, cancellationToken);
                var card = AiAttachmentBuilder.Product(data.Id, data.Slug, data.Name, data.ImageUrl, data.BasePrice);
                return AiToolResult.Of(AiJson.Wrap(data), new List<Dto.Ai.AiAttachmentDto> { card });
            }
            catch (KeyNotFoundException)
            {
                return AiToolResult.FromData(AiJson.Error("Không tìm thấy sản phẩm.", "NOT_FOUND"));
            }
        }

        try
        {
            var data = await svc.GetProductDetailByIdAsync(pid.Value, cancellationToken);
            var card = AiAttachmentBuilder.Product(data.Id, data.Slug, data.Name, data.ImageUrl, data.BasePrice);
            return AiToolResult.Of(AiJson.Wrap(data), new List<Dto.Ai.AiAttachmentDto> { card });
        }
        catch (KeyNotFoundException)
        {
            return AiToolResult.FromData(AiJson.Error("Không tìm thấy sản phẩm.", "NOT_FOUND"));
        }
    }
}

public class GetCategoriesTool(IStoreCatalogService svc) : IAiTool
{
    public string Name => "get_categories";
    public string Description => "Cây danh mục sản phẩm.";
    public AiActorScope Scope => AiActorScope.B2C | AiActorScope.B2B;
    public JsonObject ParametersSchema => Schemas.Empty();

    public async Task<AiToolResult> ExecuteAsync(JsonObject args, AiCallerContext caller, CancellationToken cancellationToken)
    {
        var data = await svc.GetCategoryTreeAsync(cancellationToken);
        return AiToolResult.FromData(AiJson.Wrap(data));
    }
}
