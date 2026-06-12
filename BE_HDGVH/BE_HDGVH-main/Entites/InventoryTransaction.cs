namespace BE_API.Entities;

public class InventoryTransaction : IEntity
{
    public int Id { get; set; }
    public int VariantId { get; set; }
    public string? TransactionType { get; set; }
    public int Quantity { get; set; }
    public string? ReferenceType { get; set; }
    public string? ReferenceId { get; set; }
    public string? Notes { get; set; }
    public int? WorkerIdAssigned { get; set; }
    public int? ManagerIdApproved { get; set; }
    public DateTime Timestamp { get; set; }

    public ProductVariant Variant { get; set; } = null!;
    public AppUser? WorkerAssigned { get; set; }
    public AppUser? ManagerApproved { get; set; }
}
