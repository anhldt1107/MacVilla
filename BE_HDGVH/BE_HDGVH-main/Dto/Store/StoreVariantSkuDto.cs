namespace BE_API.Dto.Store;

/// <summary>Tra cứu SKU cửa hàng — không gồm giá vốn; chỉ khi sản phẩm <c>Active</c>.</summary>
public class StoreVariantSkuDto
{
    public int Id { get; set; }
    public int ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public string ProductSlug { get; set; } = string.Empty;
    public string Sku { get; set; } = string.Empty;
    public string VariantName { get; set; } = string.Empty;
    public decimal RetailPrice { get; set; }
    public decimal? Weight { get; set; }
    public string? Dimensions { get; set; }
    public string? ImageUrl { get; set; }
    public int? QuantityOnHand { get; set; }
    public int? QuantityReserved { get; set; }
    public int? QuantityAvailable { get; set; }
}
