namespace BE_API.Dto.Store;

/// <summary>
/// DTO hiển thị danh sách phiếu bảo hành cho khách B2B
/// </summary>
public class StoreB2BWarrantyTicketListItemDto
{
    public int Id { get; set; }
    public string TicketNumber { get; set; } = string.Empty;
    public DateTime IssueDate { get; set; }
    public DateTime? ValidUntil { get; set; }
    public string Status { get; set; } = string.Empty;

    /// <summary>Số lượng yêu cầu bảo hành</summary>
    public int ClaimCount { get; set; }

    /// <summary>Số yêu cầu đang chờ xử lý</summary>
    public int PendingClaimCount { get; set; }

    public int? OrderId { get; set; }
    public string? OrderCode { get; set; }
    public int? ContractId { get; set; }
    public string? ContractNumber { get; set; }
}

/// <summary>
/// DTO chi tiết phiếu bảo hành cho khách B2B
/// </summary>
public class StoreB2BWarrantyTicketDetailDto
{
    public int Id { get; set; }
    public string TicketNumber { get; set; } = string.Empty;
    public DateTime IssueDate { get; set; }
    public DateTime? ValidUntil { get; set; }
    public string Status { get; set; } = string.Empty;

    /// <summary>Còn hiệu lực bảo hành không</summary>
    public bool IsValid { get; set; }

    /// <summary>Số ngày còn lại bảo hành</summary>
    public int? DaysRemaining { get; set; }

    public StoreB2BWarrantyOrderDto? Order { get; set; }
    public StoreB2BWarrantyContractDto? Contract { get; set; }
    public List<StoreB2BWarrantyTicketLineDto> Lines { get; set; } = [];
    public List<StoreB2BWarrantyClaimDto> Claims { get; set; } = [];
}

/// <summary>
/// Phạm vi bảo hành theo dòng đơn (store khách).
/// </summary>
public class StoreB2BWarrantyTicketLineDto
{
    public int Id { get; set; }
    public int OrderItemId { get; set; }
    public int VariantId { get; set; }
    public string Sku { get; set; } = string.Empty;
    public string VariantName { get; set; } = string.Empty;
    public string ProductName { get; set; } = string.Empty;
    public string? VariantImageUrl { get; set; }
    public string? ImageUrl { get; set; }
    public int Quantity { get; set; }
    public int WarrantyPeriodMonths { get; set; }
    public DateTime IssueDate { get; set; }
    public DateTime ValidUntil { get; set; }
    public bool IsValid { get; set; }
    public int? DaysRemaining { get; set; }

    /// <summary>Claim đang xử lý trên dòng này (nếu có).</summary>
    public int? ActiveClaimId { get; set; }
}

public class StoreB2BWarrantyOrderDto
{
    public int Id { get; set; }
    public string OrderCode { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}

public class StoreB2BWarrantyContractDto
{
    public int Id { get; set; }
    public string ContractNumber { get; set; } = string.Empty;
}

/// <summary>
/// DTO yêu cầu bảo hành cho khách B2B
/// </summary>
public class StoreB2BWarrantyClaimDto
{
    public int Id { get; set; }
    public int? OrderItemId { get; set; }
    public int VariantId { get; set; }
    public string Sku { get; set; } = string.Empty;
    public string VariantName { get; set; } = string.Empty;
    public string ProductName { get; set; } = string.Empty;

    /// <summary>Ảnh biến thể (ưu tiên hiển thị).</summary>
    public string? VariantImageUrl { get; set; }

    /// <summary>Ảnh đại diện sản phẩm (fallback).</summary>
    public string? ImageUrl { get; set; }

    public string? DefectDescription { get; set; }
    public string? ImagesUrl { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime? ResolvedDate { get; set; }
    public string? Resolution { get; set; }
}

/// <summary>
/// DTO tạo yêu cầu bảo hành từ khách B2B
/// </summary>
public class StoreB2BWarrantyClaimCreateDto
{
    /// <summary>ID phiếu bảo hành (nếu có)</summary>
    public int? WarrantyTicketId { get; set; }

    /// <summary>ID đơn hàng (nếu không có phiếu bảo hành, tìm theo đơn)</summary>
    public int? OrderId { get; set; }

    /// <summary>Dòng đơn cần bảo hành (ưu tiên).</summary>
    public int? OrderItemId { get; set; }

    /// <summary>ID variant cần bảo hành</summary>
    public int VariantId { get; set; }

    /// <summary>Mô tả lỗi / vấn đề</summary>
    public string DefectDescription { get; set; } = string.Empty;

    /// <summary>URL hình ảnh lỗi (nhiều URL cách nhau bằng dấu phẩy)</summary>
    public string? ImagesUrl { get; set; }
}

/// <summary>
/// DTO response sau khi tạo yêu cầu bảo hành
/// </summary>
public class StoreB2BWarrantyClaimResponseDto
{
    public int Id { get; set; }
    public int WarrantyTicketId { get; set; }
    public string TicketNumber { get; set; } = string.Empty;
    public int? OrderItemId { get; set; }
    public int VariantId { get; set; }
    public string Sku { get; set; } = string.Empty;
    public string VariantName { get; set; } = string.Empty;
    public string? DefectDescription { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public string Message { get; set; } = string.Empty;
}

/// <summary>
/// DTO hiển thị danh sách phiếu đổi/trả cho khách B2B
/// </summary>
public class StoreB2BReturnTicketListItemDto
{
    public int Id { get; set; }
    public string TicketNumber { get; set; } = string.Empty;

    /// <summary>Loại: Return (trả hàng) hoặc Exchange (đổi hàng)</summary>
    public string Type { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string? Reason { get; set; }

    /// <summary>Số tiền hoàn lại (cho Return)</summary>
    public decimal RefundAmount { get; set; }

    /// <summary>Số lượng sản phẩm trong phiếu</summary>
    public int ItemCount { get; set; }

    public DateTime CreatedAt { get; set; }
    public DateTime? ApprovedAt { get; set; }
    public DateTime? CompletedAt { get; set; }

    public int OrderId { get; set; }
    public string OrderCode { get; set; } = string.Empty;
}

/// <summary>
/// DTO chi tiết phiếu đổi/trả cho khách B2B
/// </summary>
public class StoreB2BReturnTicketDetailDto
{
    public int Id { get; set; }
    public string TicketNumber { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string? Reason { get; set; }
    public string? CustomerNote { get; set; }
    public decimal RefundAmount { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? ApprovedAt { get; set; }
    public DateTime? CompletedAt { get; set; }

    public StoreB2BReturnOrderDto Order { get; set; } = null!;
    public List<StoreB2BReturnItemDto> Items { get; set; } = [];
}

public class StoreB2BReturnOrderDto
{
    public int Id { get; set; }
    public string OrderCode { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public string OrderStatus { get; set; } = string.Empty;
    public decimal PayableTotal { get; set; }
}

public class StoreB2BReturnItemDto
{
    public int Id { get; set; }
    public int OrderItemId { get; set; }
    public int VariantIdReturned { get; set; }
    public string SkuReturned { get; set; } = string.Empty;
    public string VariantNameReturned { get; set; } = string.Empty;
    public string ProductNameReturned { get; set; } = string.Empty;
    public string? ImageUrlReturned { get; set; }

    /// <summary>Variant đổi sang (nếu loại Exchange)</summary>
    public int? VariantIdExchanged { get; set; }
    public string? SkuExchanged { get; set; }
    public string? VariantNameExchanged { get; set; }
    public string? ProductNameExchanged { get; set; }
    public string? ImageUrlExchanged { get; set; }

    public int Quantity { get; set; }
}

/// <summary>
/// DTO tạo phiếu đổi/trả từ khách B2B
/// </summary>
public class StoreB2BReturnCreateDto
{
    /// <summary>ID đơn hàng cần đổi/trả</summary>
    public int OrderId { get; set; }

    /// <summary>Loại: Return (trả hàng) hoặc Exchange (đổi hàng)</summary>
    public string Type { get; set; } = "Return";

    /// <summary>Lý do đổi/trả</summary>
    public string Reason { get; set; } = string.Empty;

    /// <summary>Ghi chú của khách hàng</summary>
    public string? CustomerNote { get; set; }

    /// <summary>Danh sách items cần đổi/trả</summary>
    public List<StoreB2BReturnItemCreateDto> Items { get; set; } = [];
}

public class StoreB2BReturnItemCreateDto
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
/// DTO response sau khi tạo phiếu đổi/trả
/// </summary>
public class StoreB2BReturnCreateResponseDto
{
    public int Id { get; set; }
    public string TicketNumber { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public int ItemCount { get; set; }
    public string Message { get; set; } = string.Empty;
}
