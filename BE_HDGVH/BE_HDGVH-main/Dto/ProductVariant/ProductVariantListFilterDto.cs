namespace BE_API.Dto.ProductVariant;

/// <summary>Query filter cho danh sách biến thể (admin).</summary>
public class ProductVariantListFilterDto
{
    public int Page { get; set; } = 1;

    public int PageSize { get; set; } = 20;

    public int? ProductId { get; set; }

    public int? CategoryId { get; set; }

    /// <summary>Lọc theo trạng thái sản phẩm (vd. Active, Draft, Hidden).</summary>
    public string? ProductStatus { get; set; }

    /// <summary>Tìm trong SKU, tên biến thể, tên sản phẩm.</summary>
    public string? Search { get; set; }

    public decimal? MinRetailPrice { get; set; }

    public decimal? MaxRetailPrice { get; set; }

    /// <summary>Tồn khả dụng tối thiểu (không có bản ghi Inventory → coi như 0).</summary>
    public int? MinQuantityAvailable { get; set; }

    /// <summary>Tồn khả dụng tối đa.</summary>
    public int? MaxQuantityAvailable { get; set; }
}
