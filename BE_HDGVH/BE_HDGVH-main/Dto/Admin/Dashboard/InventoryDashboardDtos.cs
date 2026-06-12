namespace BE_API.Dto.Admin.Dashboard;

public class InventoryOverviewDto
{
    public int SkuActiveCount { get; set; }
    public int LowStockCount { get; set; }
    public int TotalOnHand { get; set; }
    public int TotalReserved { get; set; }
    public decimal TotalOnHandValue { get; set; }
    public int DefaultThreshold { get; set; }
}

public class InventoryLowStockItemDto
{
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
    public int EffectiveLowStockThreshold { get; set; }
    public decimal? DaysOfCover { get; set; }
}

public class InventoryLowStockDto
{
    public List<InventoryLowStockItemDto> Items { get; set; } = [];
}

public class InventoryDaysOfCoverItemDto
{
    public int VariantId { get; set; }
    public string Sku { get; set; } = string.Empty;
    public string VariantName { get; set; } = string.Empty;
    public int QuantityAvailable { get; set; }
    public decimal AvgDailyOut { get; set; }
    public decimal? DaysOfCover { get; set; }
}

public class InventoryDaysOfCoverDto
{
    public int WindowDays { get; set; }
    public List<InventoryDaysOfCoverItemDto> Items { get; set; } = [];
}

public class InventoryReserveRatioItemDto
{
    public int VariantId { get; set; }
    public string Sku { get; set; } = string.Empty;
    public string VariantName { get; set; } = string.Empty;
    public int QuantityOnHand { get; set; }
    public int QuantityReserved { get; set; }
    public decimal Ratio { get; set; }
}

public class InventoryReserveRatioDto
{
    public List<InventoryReserveRatioItemDto> Items { get; set; } = [];
}

public class InventoryTransactionsTrendPointDto
{
    public string Bucket { get; set; } = string.Empty;
    public int In { get; set; }
    public int Out { get; set; }
    public int Reserve { get; set; }
    public int Release { get; set; }
    public int Adjust { get; set; }
}

public class InventoryTransactionsTrendDto
{
    public string Granularity { get; set; } = DashboardGranularities.Day;
    public List<InventoryTransactionsTrendPointDto> Points { get; set; } = [];
}

public class InventoryTopMovingItemDto
{
    public int VariantId { get; set; }
    public string Sku { get; set; } = string.Empty;
    public string ProductName { get; set; } = string.Empty;
    public int TotalOut { get; set; }
}

public class InventoryTopMovingDto
{
    public List<InventoryTopMovingItemDto> Items { get; set; } = [];
}
