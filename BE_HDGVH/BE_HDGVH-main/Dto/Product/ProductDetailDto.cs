namespace BE_API.Dto.Product;

public class ProductDetailDto
{
    public int Id { get; set; }
    public int CategoryId { get; set; }
    public string CategoryName { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? ImageUrl { get; set; }
    public decimal? BasePrice { get; set; }
    public int WarrantyPeriodMonths { get; set; }
    public string Status { get; set; } = string.Empty;
    public int VariantCount { get; set; }
    public int AttributeCount { get; set; }

    /// <summary>Thuộc tính và toàn bộ giá trị — phục vụ màn admin chi tiết.</summary>
    public List<ProductDetailAttributeDto> Attributes { get; set; } = [];

    /// <summary>Biến thể (SKU) + số tồn nếu đã có bản ghi <c>Inventory</c>.</summary>
    public List<ProductDetailVariantDto> Variants { get; set; } = [];
}
