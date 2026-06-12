namespace BE_API.Dto.Product;

public class ProductDetailVariantDto
{
    public int Id { get; set; }
    public string Sku { get; set; } = string.Empty;
    public string VariantName { get; set; } = string.Empty;
    public decimal RetailPrice { get; set; }
    public decimal CostPrice { get; set; }
    public decimal? Weight { get; set; }
    public string? Dimensions { get; set; }
    public string? ImageUrl { get; set; }

    /// <summary>Bản ghi tồn 1-1 với variant; null nếu chưa khởi tạo kho.</summary>
    public int? QuantityOnHand { get; set; }
    public int? QuantityReserved { get; set; }
    public int? QuantityAvailable { get; set; }
}
