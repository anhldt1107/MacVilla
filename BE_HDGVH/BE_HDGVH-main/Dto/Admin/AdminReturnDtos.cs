namespace BE_API.Dto.Admin;

/// <summary>
/// DTO hiển thị danh sách phiếu đổi/trả cho Admin
/// </summary>
public class AdminReturnListItemDto
{
    public int Id { get; set; }
    public string TicketNumber { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string? Reason { get; set; }
    public decimal RefundAmount { get; set; }
    public int ItemCount { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? ApprovedAt { get; set; }
    public DateTime? CompletedAt { get; set; }

    public int CustomerId { get; set; }
    public string CustomerName { get; set; } = string.Empty;
    public string? CustomerPhone { get; set; }
    public string? CustomerEmail { get; set; }

    public int OrderId { get; set; }
    public string OrderCode { get; set; } = string.Empty;

    public int? ManagerIdApproved { get; set; }
    public string? ManagerName { get; set; }
}

/// <summary>
/// DTO chi tiết phiếu đổi/trả cho Admin
/// </summary>
public class AdminReturnDetailDto
{
    public int Id { get; set; }
    public string TicketNumber { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string? Reason { get; set; }
    public string? CustomerNote { get; set; }
    public string? InternalNote { get; set; }
    public decimal RefundAmount { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? ApprovedAt { get; set; }
    public DateTime? CompletedAt { get; set; }

    public AdminReturnCustomerDto Customer { get; set; } = null!;
    public AdminReturnOrderDto Order { get; set; } = null!;

    public int? ManagerIdApproved { get; set; }
    public string? ManagerName { get; set; }

    public int? StockManagerId { get; set; }
    public string? StockManagerName { get; set; }

    public List<AdminReturnItemDto> Items { get; set; } = [];
}

public class AdminReturnCustomerDto
{
    public int Id { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string? Phone { get; set; }
    public string CustomerType { get; set; } = string.Empty;
    public string? CompanyName { get; set; }
}

public class AdminReturnOrderDto
{
    public int Id { get; set; }
    public string OrderCode { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public string OrderStatus { get; set; } = string.Empty;
    public string PaymentStatus { get; set; } = string.Empty;
    public decimal PayableTotal { get; set; }
}

public class AdminReturnItemDto
{
    public int Id { get; set; }
    public int OrderItemId { get; set; }
    public int VariantIdReturned { get; set; }
    public string SkuReturned { get; set; } = string.Empty;
    public string VariantNameReturned { get; set; } = string.Empty;
    public string ProductNameReturned { get; set; } = string.Empty;
    public string? ImageUrlReturned { get; set; }
    public decimal UnitPriceReturned { get; set; }

    public int? VariantIdExchanged { get; set; }
    public string? SkuExchanged { get; set; }
    public string? VariantNameExchanged { get; set; }
    public string? ProductNameExchanged { get; set; }
    public string? ImageUrlExchanged { get; set; }

    public int Quantity { get; set; }
    public string? InventoryAction { get; set; }
}

/// <summary>
/// DTO tạo phiếu đổi/trả
/// </summary>
public class AdminReturnCreateDto
{
    /// <summary>ID đơn hàng cần đổi/trả</summary>
    public int OrderId { get; set; }

    /// <summary>Loại: Return (trả hàng) hoặc Exchange (đổi hàng)</summary>
    public string Type { get; set; } = "Return";

    /// <summary>Lý do đổi/trả</summary>
    public string? Reason { get; set; }

    /// <summary>Ghi chú của khách hàng</summary>
    public string? CustomerNote { get; set; }

    /// <summary>Ghi chú nội bộ</summary>
    public string? InternalNote { get; set; }

    /// <summary>Danh sách items cần đổi/trả</summary>
    public List<AdminReturnItemCreateDto> Items { get; set; } = [];
}

public class AdminReturnItemCreateDto
{
    /// <summary>ID dòng đơn hàng</summary>
    public int OrderItemId { get; set; }

    /// <summary>ID variant trả lại</summary>
    public int VariantIdReturned { get; set; }

    /// <summary>ID variant đổi sang (chỉ dùng cho Exchange)</summary>
    public int? VariantIdExchanged { get; set; }

    /// <summary>Số lượng</summary>
    public int Quantity { get; set; }
}

/// <summary>
/// DTO duyệt phiếu đổi/trả
/// </summary>
public class AdminReturnApproveDto
{
    /// <summary>Tổng tiền hoàn lại (cho Return)</summary>
    public decimal RefundAmount { get; set; }

    /// <summary>Ghi chú nội bộ khi duyệt</summary>
    public string? InternalNote { get; set; }
}

/// <summary>
/// DTO từ chối phiếu đổi/trả
/// </summary>
public class AdminReturnRejectDto
{
    /// <summary>Lý do từ chối</summary>
    public string? RejectReason { get; set; }
}

/// <summary>
/// DTO hoàn thành phiếu đổi/trả
/// </summary>
public class AdminReturnCompleteDto
{
    /// <summary>Hành động xử lý hàng trả với tồn kho cho từng item</summary>
    public List<AdminReturnItemCompleteDto> Items { get; set; } = [];

    /// <summary>Tạo giao dịch hoàn tiền ngay (mặc định true cho Return khi refundAmount &gt; 0)</summary>
    public bool? CreateRefund { get; set; }

    /// <summary>Phương thức hoàn tiền khi CreateRefund = true</summary>
    public string? PaymentMethod { get; set; }

    /// <summary>Ghi chú nội bộ khi hoàn thành</summary>
    public string? InternalNote { get; set; }
}

/// <summary>Ghi chú khi chuyển trạng thái kho</summary>
public class AdminReturnTransitionDto
{
    public string? InternalNote { get; set; }
}

public class AdminReturnItemCompleteDto
{
    /// <summary>ID của ReturnItem</summary>
    public int ReturnItemId { get; set; }

    /// <summary>Hành động xử lý: Restock (nhập lại kho), Dispose (hủy), PendingInspection (chờ kiểm tra)</summary>
    public string InventoryAction { get; set; } = "Restock";
}
