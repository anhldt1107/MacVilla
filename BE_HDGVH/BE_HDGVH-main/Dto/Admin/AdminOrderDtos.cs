namespace BE_API.Dto.Admin;

/// <summary>
/// DTO hiển thị danh sách đơn hàng cho Admin
/// </summary>
public class AdminOrderListItemDto
{
    public int Id { get; set; }
    public string OrderCode { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public string OrderStatus { get; set; } = string.Empty;
    public string PaymentStatus { get; set; } = string.Empty;
    public string? PaymentMethod { get; set; }
    public int LineCount { get; set; }
    public decimal MerchandiseTotal { get; set; }
    public decimal DiscountTotal { get; set; }
    public decimal PayableTotal { get; set; }

    // Customer info
    public int CustomerId { get; set; }
    public string CustomerName { get; set; } = string.Empty;
    public string? CustomerPhone { get; set; }
    public string? CustomerEmail { get; set; }
    public string CustomerType { get; set; } = string.Empty;

    // Sales info
    public int? SalesId { get; set; }
    public string? SalesName { get; set; }
}

/// <summary>
/// DTO chi tiết đơn hàng cho Admin
/// </summary>
public class AdminOrderDetailDto
{
    public int Id { get; set; }
    public string OrderCode { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public string OrderStatus { get; set; } = string.Empty;
    public string PaymentStatus { get; set; } = string.Empty;
    public string? PaymentMethod { get; set; }

    // Totals
    public decimal MerchandiseTotal { get; set; }
    public decimal DiscountTotal { get; set; }
    public decimal PayableTotal { get; set; }

    // Customer info
    public AdminOrderCustomerDto Customer { get; set; } = null!;

    // Shipping address
    public AdminOrderAddressDto? ShippingAddress { get; set; }

    // Voucher info
    public AdminOrderVoucherDto? Voucher { get; set; }

    // Sales info
    public AdminOrderSalesDto? Sales { get; set; }

    // Order lines
    public List<AdminOrderLineDto> Lines { get; set; } = [];

    // Related entities
    public int? QuoteId { get; set; }
    public int? ContractId { get; set; }

    // PayOS info
    public string? PayOsPaymentLinkId { get; set; }
    public string? PayOsCheckoutUrl { get; set; }
    public DateTime? PayOsLinkExpiresAt { get; set; }

    public DateTime? UpdatedAt { get; set; }
    public DateTime? CancelledAt { get; set; }
    public string? CancelReason { get; set; }

    /// <summary>Workflow — cảnh báo, transition hợp lệ, phiếu active.</summary>
    public AdminOrderWorkflowDto Workflow { get; set; } = new();
}

/// <summary>Snapshot rule luồng đơn cho FE (tránh duplicate logic).</summary>
public class AdminOrderWorkflowDto
{
    public List<string> Warnings { get; set; } = [];
    public List<string> AllowedOrderTransitions { get; set; } = [];
    public bool HasActiveFulfillment { get; set; }
    public bool CanCreateFulfillment { get; set; }
}

public class AdminOrderCustomerDto
{
    public int Id { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string Phone { get; set; } = string.Empty;
    public string CustomerType { get; set; } = string.Empty;
    public string? CompanyName { get; set; }
    public string? TaxCode { get; set; }
    public decimal DebtBalance { get; set; }
}

public class AdminOrderAddressDto
{
    public int Id { get; set; }
    public string ReceiverName { get; set; } = string.Empty;
    public string ReceiverPhone { get; set; } = string.Empty;
    public string AddressLine { get; set; } = string.Empty;
}

public class AdminOrderVoucherDto
{
    public int Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string? DiscountType { get; set; }
    public decimal DiscountValue { get; set; }
}

public class AdminOrderSalesDto
{
    public int Id { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string? Phone { get; set; }
}

public class AdminOrderLineDto
{
    public int Id { get; set; }
    public int VariantId { get; set; }
    public string? SkuSnapshot { get; set; }
    public int Quantity { get; set; }
    public decimal PriceSnapshot { get; set; }
    public decimal SubTotal { get; set; }

    // Variant info (current)
    public string? CurrentSku { get; set; }
    public string? VariantName { get; set; }
    public string? ProductName { get; set; }
    public string? ImageUrl { get; set; }

    /// <summary>Số lượng còn có thể đổi/trả trên dòng này</summary>
    public int? ReturnableQuantity { get; set; }

    /// <summary>Số lượng còn có thể tạo claim bảo hành</summary>
    public int? WarrantyClaimableQuantity { get; set; }
}

/// <summary>
/// DTO tạo đơn hàng (Sales tạo hộ khách)
/// </summary>
public class AdminOrderCreateDto
{
    public int CustomerId { get; set; }
    public int ShippingAddressId { get; set; }
    public string PaymentMethod { get; set; } = string.Empty;
    public string? VoucherCode { get; set; }
    public List<AdminOrderCreateLineDto> Lines { get; set; } = [];
    public string? Note { get; set; }
}

public class AdminOrderCreateLineDto
{
    public int VariantId { get; set; }
    public int Quantity { get; set; }
}

/// <summary>
/// DTO cập nhật trạng thái đơn hàng
/// </summary>
public class AdminOrderUpdateStatusDto
{
    public string Status { get; set; } = string.Empty;
    public string? Note { get; set; }
}

/// <summary>
/// DTO cập nhật trạng thái thanh toán
/// </summary>
public class AdminOrderUpdatePaymentStatusDto
{
    public string PaymentStatus { get; set; } = string.Empty;
    public string? Note { get; set; }
}

/// <summary>
/// DTO hủy đơn hàng
/// </summary>
public class AdminOrderCancelDto
{
    public string? CancelReason { get; set; }
}

/// <summary>
/// DTO gán Sales cho đơn hàng
/// </summary>
public class AdminOrderAssignSalesDto
{
    public int SalesId { get; set; }
}

/// <summary>
/// Timeline đơn hàng phía admin — sự kiện thực tế có trong DB (đơn, phiếu xuất, thanh toán, hóa đơn, CK, đổi trả).
/// </summary>
public class AdminOrderTimelineDto
{
    public int OrderId { get; set; }
    public string OrderCode { get; set; } = string.Empty;
    public string CurrentOrderStatus { get; set; } = string.Empty;
    public string CurrentPaymentStatus { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public List<AdminOrderTimelineEventDto> Events { get; set; } = [];
}

public class AdminOrderTimelineEventDto
{
    /// <summary>Loại sự kiện: Order / Fulfillment / Payment / Invoice / TransferNotification / Return.</summary>
    public string EventType { get; set; } = string.Empty;

    /// <summary>Trạng thái hoặc action (VD Confirmed, Shipped, Paid, Verified, Refund, Approved, Cancelled).</summary>
    public string Status { get; set; } = string.Empty;

    public string Description { get; set; } = string.Empty;
    public DateTime Timestamp { get; set; }

    /// <summary>ID entity nguồn (fulfillmentId, paymentId, invoiceId, notificationId, returnId) nếu có.</summary>
    public int? ReferenceId { get; set; }

    /// <summary>Ghi chú / amount hiển thị dưới dạng text.</summary>
    public string? Notes { get; set; }

    /// <summary>Tên người thực hiện (staff) nếu có.</summary>
    public string? ActorName { get; set; }
}
