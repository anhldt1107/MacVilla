namespace BE_API.Dto.Inventory;

public class InventoryResponseDto
{
    public int Id { get; set; }
    public int VariantId { get; set; }
    public string? WarehouseLocation { get; set; }
    public int QuantityOnHand { get; set; }
    public int QuantityReserved { get; set; }
    public int QuantityAvailable { get; set; }

    public int? ReorderPoint { get; set; }
    public int? SafetyStock { get; set; }
}
