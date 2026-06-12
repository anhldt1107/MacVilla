using System.Globalization;
using BE_API.Dto.Ai;

namespace BE_API.Service.Ai;

/// <summary>
/// Factory chuẩn hóa cards FE — đảm bảo URL pattern đồng nhất giữa các tool.
/// </summary>
public static class AiAttachmentBuilder
{
    private static readonly CultureInfo Vi = CultureInfo.GetCultureInfo("vi-VN");

    public static AiAttachmentDto Product(int productId, string? slug, string name, string? imageUrl, decimal? price)
    {
        var link = !string.IsNullOrWhiteSpace(slug)
            ? $"/store/products/{slug}"
            : $"/store/products/id/{productId}";

        return new AiAttachmentDto
        {
            Type = "product",
            Title = name,
            Subtitle = price.HasValue ? FormatVnd(price.Value) : null,
            ImageUrl = imageUrl,
            Link = link,
            Meta = new Dictionary<string, object?>
            {
                ["productId"] = productId,
                ["slug"] = slug
            }
        };
    }

    public static AiAttachmentDto Order(string orderCode, string orderStatus, decimal? total, AiActorScope role)
    {
        var link = role switch
        {
            AiActorScope.B2B => $"/store/b2b/orders/{orderCode}",
            AiActorScope.B2C => $"/store/orders/{orderCode}",
            _ => $"/admin/orders/by-code/{orderCode}"
        };

        var subtitle = total.HasValue
            ? $"{orderStatus} • {FormatVnd(total.Value)}"
            : orderStatus;

        return new AiAttachmentDto
        {
            Type = "order",
            Title = orderCode,
            Subtitle = subtitle,
            ImageUrl = null,
            Link = link,
            Meta = new Dictionary<string, object?>
            {
                ["orderCode"] = orderCode,
                ["orderStatus"] = orderStatus,
                ["scope"] = role.ToString()
            }
        };
    }

    private static string FormatVnd(decimal amount)
        => amount.ToString("N0", Vi) + " VND";
}
