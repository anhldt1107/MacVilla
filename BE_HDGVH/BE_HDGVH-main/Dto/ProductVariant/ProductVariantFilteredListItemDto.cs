namespace BE_API.Dto.ProductVariant;

public class ProductVariantFilteredListItemDto
{
    public int Id { get; set; }
    public int ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public string ProductStatus { get; set; } = string.Empty;
    public int CategoryId { get; set; }
    public string CategoryName { get; set; } = string.Empty;
    public string Sku { get; set; } = string.Empty;
    public string VariantName { get; set; } = string.Empty;
    public decimal RetailPrice { get; set; }
    public decimal CostPrice { get; set; }
    public decimal? Weight { get; set; }
    public string? ImageUrl { get; set; }
    public int? QuantityOnHand { get; set; }
    public int? QuantityReserved { get; set; }
    public int? QuantityAvailable { get; set; }
}
