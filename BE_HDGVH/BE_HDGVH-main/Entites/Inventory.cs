namespace BE_API.Entities;

public class Inventory : IEntity
{
    public int Id { get; set; }
    public int VariantId { get; set; }
    public string? WarehouseLocation { get; set; }
    public int QuantityOnHand { get; set; }
    public int QuantityReserved { get; set; }

    /// <summary>Computed in SQL: Quantity_On_Hand - Quantity_Reserved.</summary>
    public int QuantityAvailable { get; set; }

    /// <summary>Ngưỡng tồn khả dụng để cảnh báo / đặt hàng lại; null = dùng ngưỡng mặc định từ query API.</summary>
    public int? ReorderPoint { get; set; }

    /// <summary>Tồn an toàn mong muốn (tùy chọn, ≤ ReorderPoint khi cả hai được cấu hình).</summary>
    public int? SafetyStock { get; set; }

    public ProductVariant Variant { get; set; } = null!;
}
