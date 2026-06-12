using System.ComponentModel.DataAnnotations;

namespace BE_API.Dto.Fulfillment;

/// <summary>
/// DTO hiển thị danh sách phiếu xuất kho
/// </summary>
public class FulfillmentListItemDto
{
    public int Id { get; set; }
    public int OrderId { get; set; }
    public string OrderCode { get; set; } = string.Empty;
    public string? TicketType { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }

    public int? AssignedWorkerId { get; set; }
    public string? AssignedWorkerName { get; set; }

    public int? CreatedBy { get; set; }
    public string? CreatedByName { get; set; }

    public string CustomerName { get; set; } = string.Empty;
    public string? CustomerPhone { get; set; }
}

/// <summary>
/// DTO chi tiết phiếu xuất kho + đơn hàng
/// </summary>
public class FulfillmentDetailDto
{
    public int Id { get; set; }
    public int OrderId { get; set; }
    public string? TicketType { get; set; }
    public string Status { get; set; } = string.Empty;
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }

    public int? AssignedWorkerId { get; set; }
    public string? AssignedWorkerName { get; set; }

    public int? CreatedBy { get; set; }
    public string? CreatedByName { get; set; }

    public FulfillmentOrderDto Order { get; set; } = null!;

    /// <summary>Cảnh báo nghiệp vụ (VD B2B chưa thanh toán đủ).</summary>
    public List<string> Warnings { get; set; } = [];

    /// <summary>Trạng thái phiếu có thể chuyển tiếp theo rule BE.</summary>
    public List<string> AllowedFulfillmentTransitions { get; set; } = [];

    /// <summary>Trạng thái đơn có thể chuyển tiếp (tham chiếu).</summary>
    public List<string> AllowedOrderTransitions { get; set; } = [];

    /// <summary>Đã ghi OUT tồn kho cho phiếu này chưa.</summary>
    public bool InventoryOutPosted { get; set; }
}

/// <summary>
/// Thông tin đơn hàng trong chi tiết phiếu xuất kho
/// </summary>
public class FulfillmentOrderDto
{
    public int Id { get; set; }
    public string OrderCode { get; set; } = string.Empty;
    public string OrderStatus { get; set; } = string.Empty;
    public string PaymentStatus { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }

    public decimal MerchandiseTotal { get; set; }
    public decimal DiscountTotal { get; set; }
    public decimal PayableTotal { get; set; }

    public FulfillmentCustomerDto Customer { get; set; } = null!;
    public FulfillmentAddressDto? ShippingAddress { get; set; }
    public List<FulfillmentOrderLineDto> Lines { get; set; } = [];
}

/// <summary>
/// Thông tin khách hàng trong phiếu xuất kho
/// </summary>
public class FulfillmentCustomerDto
{
    public int Id { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string Phone { get; set; } = string.Empty;
}

/// <summary>
/// Địa chỉ giao hàng trong phiếu xuất kho
/// </summary>
public class FulfillmentAddressDto
{
    public int Id { get; set; }
    public string ReceiverName { get; set; } = string.Empty;
    public string ReceiverPhone { get; set; } = string.Empty;
    public string AddressLine { get; set; } = string.Empty;
}

/// <summary>
/// Dòng sản phẩm trong đơn hàng (cho phiếu xuất kho)
/// </summary>
public class FulfillmentOrderLineDto
{
    public int Id { get; set; }
    public int VariantId { get; set; }
    public string? SkuSnapshot { get; set; }
    public int Quantity { get; set; }
    public decimal PriceSnapshot { get; set; }
    public decimal SubTotal { get; set; }

    public string? CurrentSku { get; set; }
    public string? VariantName { get; set; }
    public string? ProductName { get; set; }
    public string? ImageUrl { get; set; }
}

/// <summary>
/// DTO tạo phiếu xuất kho
/// </summary>
public class FulfillmentCreateDto
{
    /// <summary>Loại phiếu (tùy chọn)</summary>
    [MaxLength(100)]
    public string? TicketType { get; set; }

    /// <summary>Ghi chú</summary>
    [MaxLength(1000)]
    public string? Notes { get; set; }
}

/// <summary>
/// DTO gán Worker cho phiếu xuất kho
/// </summary>
public class FulfillmentAssignWorkerDto
{
    [Required(ErrorMessage = "Mã Worker là bắt buộc.")]
    public int WorkerId { get; set; }
}

/// <summary>
/// DTO cập nhật trạng thái phiếu xuất kho
/// </summary>
public class FulfillmentUpdateStatusDto
{
    /// <summary>Trạng thái mới: Pending → Picking → Packed → Shipped</summary>
    [Required(ErrorMessage = "Trạng thái là bắt buộc.")]
    [MaxLength(50)]
    public string Status { get; set; } = string.Empty;

    /// <summary>Ghi chú (tùy chọn)</summary>
    [MaxLength(1000)]
    public string? Notes { get; set; }
}
