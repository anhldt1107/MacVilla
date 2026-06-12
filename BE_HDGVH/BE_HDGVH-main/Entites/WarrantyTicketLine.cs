namespace BE_API.Entities;

/// <summary>
/// Phạm vi bảo hành theo từng dòng đơn (OrderItem).
/// </summary>
public class WarrantyTicketLine : IEntity
{
    public int Id { get; set; }
    public int WarrantyTicketId { get; set; }
    public int OrderItemId { get; set; }
    public int VariantId { get; set; }
    public DateTime IssueDate { get; set; }
    public DateTime ValidUntil { get; set; }
    public int WarrantyPeriodMonths { get; set; }
    public string? SkuSnapshot { get; set; }
    public int Quantity { get; set; }

    public WarrantyTicket WarrantyTicket { get; set; } = null!;
    public OrderItem OrderItem { get; set; } = null!;
    public ProductVariant Variant { get; set; } = null!;
}
