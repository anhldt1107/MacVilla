namespace BE_API.Dto.Store;

public class StoreOrderListItemDto
{
    public string OrderCode { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public string OrderStatus { get; set; } = string.Empty;
    public string PaymentStatus { get; set; } = string.Empty;
    public string? PaymentMethod { get; set; }
    public int LineCount { get; set; }
    public decimal TotalAmount { get; set; }
}
