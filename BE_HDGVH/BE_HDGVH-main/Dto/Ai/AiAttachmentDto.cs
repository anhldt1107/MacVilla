namespace BE_API.Dto.Ai;

/// <summary>
/// Card đính kèm trong response chat AI để FE render UI giàu (ảnh + link) song song với text Gemini.
/// </summary>
public class AiAttachmentDto
{
    /// <summary>Loại card. MVP: "product" | "order". Sẽ mở rộng sau (invoice/quote/category).</summary>
    public string Type { get; set; } = string.Empty;

    /// <summary>Tiêu đề chính (tên sản phẩm / mã đơn).</summary>
    public string Title { get; set; } = string.Empty;

    /// <summary>Dòng phụ (giá / trạng thái).</summary>
    public string? Subtitle { get; set; }

    /// <summary>URL ảnh đại diện (nếu có).</summary>
    public string? ImageUrl { get; set; }

    /// <summary>Đường dẫn relative để FE prepend origin (vd "/store/products/sofa-3-cho").</summary>
    public string? Link { get; set; }

    /// <summary>Metadata bổ sung — FE có thể dùng để dispatch action (productId, orderCode, ownerScope...).</summary>
    public Dictionary<string, object?> Meta { get; set; } = new();
}
