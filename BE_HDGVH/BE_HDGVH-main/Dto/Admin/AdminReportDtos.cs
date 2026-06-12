namespace BE_API.Dto.Admin;

/// <summary>Tổng quan kinh doanh cho Manager (từng khoảng thời gian).</summary>
public class AdminSalesOverviewDto
{
    public DateTime? FromDate { get; set; }
    public DateTime? ToDate { get; set; }

    /// <summary>Doanh thu thu được (PaymentTransaction thu nhập - hoàn / điều chỉnh giảm).</summary>
    public decimal NetRevenue { get; set; }
    public decimal TotalPaymentIn { get; set; }
    public decimal TotalPaymentOut { get; set; }

    /// <summary>Tổng giá trị đơn tạo mới trong khoảng, không tính đơn bị hủy.</summary>
    public decimal TotalOrderValue { get; set; }
    public int OrderCount { get; set; }
    public int CancelledOrderCount { get; set; }

    public int NewCustomerCount { get; set; }
    public int QuotePendingApprovalCount { get; set; }
    public int TransferNotificationPendingCount { get; set; }
    public int InvoicesOverdueCount { get; set; }
    public decimal TotalUnpaidInvoiceAmount { get; set; }
}

public class AdminLowStockItemDto
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

    /// <summary>Ngưỡng áp dụng cho dòng này: ReorderPoint nếu có, ngược lại = tham số threshold của API.</summary>
    public int EffectiveLowStockThreshold { get; set; }
}

public class AdminTopSalesItemDto
{
    public int SalesId { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string? Phone { get; set; }
    public int OrderCount { get; set; }
    public decimal TotalRevenue { get; set; }
}

public class AdminStaffDirectoryItemDto
{
    public int Id { get; set; }
    public string Username { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string? Phone { get; set; }
    public string RoleName { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
}
