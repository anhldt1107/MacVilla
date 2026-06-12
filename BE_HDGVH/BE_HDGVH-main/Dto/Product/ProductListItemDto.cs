namespace BE_API.Dto.Product;

public class ProductListItemDto
{
    public int Id { get; set; }
    public int CategoryId { get; set; }
    public string CategoryName { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string? ImageUrl { get; set; }
    public decimal? BasePrice { get; set; }
    public int WarrantyPeriodMonths { get; set; }
    public string Status { get; set; } = string.Empty;
    public int VariantCount { get; set; }
    public int AttributeCount { get; set; }
}
