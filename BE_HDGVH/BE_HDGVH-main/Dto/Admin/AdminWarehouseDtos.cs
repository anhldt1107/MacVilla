namespace BE_API.Dto.Admin;

/// <summary>Tổng quan kho cho StockManager / Manager / Worker (policy WarehouseStaff).</summary>
public class AdminWarehouseOverviewDto
{
    public int FulfillmentPendingCount { get; set; }
    public int FulfillmentPickingCount { get; set; }
    public int FulfillmentPackedCount { get; set; }
    public int FulfillmentShippedTodayCount { get; set; }
    public int FulfillmentTotalActiveCount { get; set; }

    /// <summary>Số SKU có QuantityAvailable ≤ COALESCE(ReorderPoint, tham số lowStockThreshold).</summary>
    public int LowStockCount { get; set; }

    public int OutOfStockCount { get; set; }

    /// <summary>Ngưỡng mặc định khi SKU chưa cấu hình ReorderPoint.</summary>
    public int LowStockThreshold { get; set; }

    public int InventoryTransactionsTodayCount { get; set; }
    public int InventoryInTodayCount { get; set; }
    public int InventoryOutTodayCount { get; set; }
    public int InventoryAdjustTodayCount { get; set; }

    public int ReturnsAwaitingCompleteCount { get; set; }
    public int WarrantyClaimsActiveCount { get; set; }
}

public class AdminInventoryListItemDto
{
    public int InventoryId { get; set; }
    public int VariantId { get; set; }
    public string Sku { get; set; } = string.Empty;
    public string VariantName { get; set; } = string.Empty;
    public int ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public string? WarehouseLocation { get; set; }
    public int QuantityOnHand { get; set; }
    public int QuantityReserved { get; set; }
    public int QuantityAvailable { get; set; }

    public int? ReorderPoint { get; set; }
    public int? SafetyStock { get; set; }

    /// <summary>Ngưỡng áp dụng: ReorderPoint nếu có, ngược lại = tham số threshold của request.</summary>
    public int EffectiveLowStockThreshold { get; set; }

    public bool IsLowStock { get; set; }
}
