namespace BE_API.Dto.Store;

/// <summary>
/// DTO hiển thị danh sách đơn hàng B2B
/// </summary>
public class StoreB2BOrderListItemDto
{
    public int Id { get; set; }
    public string OrderCode { get; set; } = string.Empty;
    public string OrderStatus { get; set; } = string.Empty;
    public string PaymentStatus { get; set; } = string.Empty;
    public string? PaymentMethod { get; set; }
    public DateTime CreatedAt { get; set; }

    /// <summary>Tổng tiền hàng</summary>
    public decimal MerchandiseTotal { get; set; }

    /// <summary>Giảm giá</summary>
    public decimal DiscountTotal { get; set; }

    /// <summary>Tổng thanh toán</summary>
    public decimal PayableTotal { get; set; }

    /// <summary>Số dòng sản phẩm</summary>
    public int LineCount { get; set; }

    /// <summary>Mã báo giá gốc (nếu có)</summary>
    public string? QuoteCode { get; set; }

    /// <summary>Mã hợp đồng (nếu có)</summary>
    public string? ContractNumber { get; set; }
}

/// <summary>
/// DTO chi tiết đơn hàng B2B
/// </summary>
public class StoreB2BOrderDetailDto
{
    public int Id { get; set; }
    public string OrderCode { get; set; } = string.Empty;
    public string OrderStatus { get; set; } = string.Empty;
    public string PaymentStatus { get; set; } = string.Empty;
    public string? PaymentMethod { get; set; }
    public DateTime CreatedAt { get; set; }

    /// <summary>Tổng tiền hàng</summary>
    public decimal MerchandiseTotal { get; set; }

    /// <summary>Giảm giá</summary>
    public decimal DiscountTotal { get; set; }

    /// <summary>Tổng thanh toán</summary>
    public decimal PayableTotal { get; set; }

    /// <summary>Mã báo giá gốc (nếu có)</summary>
    public string? QuoteCode { get; set; }

    /// <summary>ID báo giá (nếu có)</summary>
    public int? QuoteId { get; set; }

    /// <summary>Mã hợp đồng (nếu có)</summary>
    public string? ContractNumber { get; set; }

    /// <summary>ID hợp đồng (nếu có)</summary>
    public int? ContractId { get; set; }

    /// <summary>Thông tin địa chỉ giao hàng</summary>
    public StoreB2BOrderAddressDto? ShippingAddress { get; set; }

    /// <summary>Nhân viên bán hàng phụ trách</summary>
    public StoreB2BOrderSalesDto? Sales { get; set; }

    /// <summary>Danh sách sản phẩm trong đơn</summary>
    public List<StoreB2BOrderLineDto> Lines { get; set; } = [];

    /// <summary>Thông tin phiếu xuất kho (nếu có)</summary>
    public List<StoreB2BOrderFulfillmentDto> Fulfillments { get; set; } = [];
}

/// <summary>
/// DTO địa chỉ giao hàng trong đơn B2B
/// </summary>
public class StoreB2BOrderAddressDto
{
    public int Id { get; set; }
    public string? ReceiverName { get; set; }
    public string? ReceiverPhone { get; set; }
    public string? AddressLine { get; set; }
}

/// <summary>
/// DTO thông tin nhân viên sales trong đơn B2B
/// </summary>
public class StoreB2BOrderSalesDto
{
    public int Id { get; set; }
    public string? FullName { get; set; }
    public string? Email { get; set; }
    public string? Phone { get; set; }
}

/// <summary>
/// DTO dòng sản phẩm trong đơn B2B
/// </summary>
public class StoreB2BOrderLineDto
{
    public int Id { get; set; }
    public int VariantId { get; set; }
    public string? Sku { get; set; }
    public string? ProductName { get; set; }
    public string? VariantName { get; set; }
    public string? ImageUrl { get; set; }
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal SubTotal { get; set; }
    public int? ReturnableQuantity { get; set; }
    public int? WarrantyClaimableQuantity { get; set; }
}

/// <summary>
/// DTO phiếu xuất kho trong đơn B2B
/// </summary>
public class StoreB2BOrderFulfillmentDto
{
    public int Id { get; set; }
    public string? TicketType { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public string? Notes { get; set; }
}

/// <summary>
/// DTO timeline đơn hàng B2B - hiển thị các sự kiện theo thời gian
/// </summary>
public class StoreB2BOrderTimelineDto
{
    public string OrderCode { get; set; } = string.Empty;
    public string CurrentStatus { get; set; } = string.Empty;
    public List<StoreB2BOrderTimelineEventDto> Events { get; set; } = [];
}

/// <summary>
/// DTO sự kiện trong timeline đơn hàng B2B
/// </summary>
public class StoreB2BOrderTimelineEventDto
{
    /// <summary>Loại sự kiện (Order, Fulfillment, Payment)</summary>
    public string EventType { get; set; } = string.Empty;

    /// <summary>Trạng thái/hành động</summary>
    public string Status { get; set; } = string.Empty;

    /// <summary>Mô tả sự kiện</summary>
    public string Description { get; set; } = string.Empty;

    /// <summary>Thời điểm xảy ra</summary>
    public DateTime Timestamp { get; set; }

    /// <summary>Ghi chú bổ sung (nếu có)</summary>
    public string? Notes { get; set; }
}
