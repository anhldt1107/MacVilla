namespace BE_API.Entities;

public class WarrantyClaim : IEntity
{
    public int Id { get; set; }
    public int WarrantyTicketId { get; set; }
    public int? OrderItemId { get; set; }
    public int VariantId { get; set; }
    public string? DefectDescription { get; set; }
    public string? ImagesUrl { get; set; }
    public string Status { get; set; } = "Pending_Check";
    public decimal EstimatedCost { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? ResolvedDate { get; set; }
    public string? Resolution { get; set; }
    public string? Note { get; set; }

    public WarrantyTicket WarrantyTicket { get; set; } = null!;
    public OrderItem? OrderItem { get; set; }
    public ProductVariant Variant { get; set; } = null!;
}
