namespace BE_API.Dto.Store;

public class StoreCartLineDto
{
    public int LineId { get; set; }
    public int VariantId { get; set; }
    public string Sku { get; set; } = string.Empty;
    public string? ImageUrl { get; set; }
    public string VariantName { get; set; } = string.Empty;
    public string ProductName { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal LineSubtotal { get; set; }
    public int QuantityAvailable { get; set; }
    public bool InsufficientStock { get; set; }
}
