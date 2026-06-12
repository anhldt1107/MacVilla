using BE_API.Dto.Product;

namespace BE_API.Dto.Store;

public class StoreProductDetailDto
{
    public int Id { get; set; }
    public int CategoryId { get; set; }
    public string CategoryName { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string? Description { get; set; }
    /// <summary>Ảnh đại diện SP hoặc fallback variant (Id nhỏ nhất có ảnh).</summary>
    public string? ImageUrl { get; set; }
    public decimal? BasePrice { get; set; }
    public int WarrantyPeriodMonths { get; set; }
    public int VariantCount { get; set; }
    public int AttributeCount { get; set; }

    public List<ProductDetailAttributeDto> Attributes { get; set; } = [];
    public List<StoreProductVariantDto> Variants { get; set; } = [];
}
