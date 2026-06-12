namespace BE_API.Dto.InventoryTransaction;

public class InventoryTransactionDetailDto
{
    public int Id { get; set; }
    public int VariantId { get; set; }
    public string? VariantSku { get; set; }
    public string? VariantName { get; set; }
    public string? ProductName { get; set; }
    public string? TransactionType { get; set; }
    public int Quantity { get; set; }
    public string? ReferenceType { get; set; }
    public string? ReferenceId { get; set; }
    public string? Notes { get; set; }
    public int? WorkerIdAssigned { get; set; }
    public string? WorkerName { get; set; }
    public int? ManagerIdApproved { get; set; }
    public string? ManagerName { get; set; }
    public DateTime Timestamp { get; set; }
}
