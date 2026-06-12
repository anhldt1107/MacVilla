namespace BE_API.Dto.Store;

/// <summary>Danh mục sản phẩm công khai — chỉ SP <c>Active</c>.</summary>
public class StoreProductListItemDto
{
    public int Id { get; set; }
    public int CategoryId { get; set; }
    public string CategoryName { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    /// <summary>Ảnh hiển thị list: <c>Product.ImageUrl</c> hoặc fallback variant có ảnh (Id nhỏ nhất).</summary>
    public string? ImageUrl { get; set; }
    public decimal? BasePrice { get; set; }
    public int WarrantyPeriodMonths { get; set; }
    public int VariantCount { get; set; }
    public int AttributeCount { get; set; }
}
