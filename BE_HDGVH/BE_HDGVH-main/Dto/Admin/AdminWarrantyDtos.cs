namespace BE_API.Dto.Admin;

/// <summary>
/// DTO hiển thị danh sách phiếu bảo hành cho Admin
/// </summary>
public class AdminWarrantyTicketListItemDto
{
    public int Id { get; set; }
    public string TicketNumber { get; set; } = string.Empty;
    public DateTime IssueDate { get; set; }
    public DateTime? ValidUntil { get; set; }
    public string Status { get; set; } = string.Empty;
    public int ClaimCount { get; set; }
    public int PendingClaimCount { get; set; }

    public int CustomerId { get; set; }
    public string CustomerName { get; set; } = string.Empty;
    public string? CustomerPhone { get; set; }
    public string? CustomerEmail { get; set; }

    public int? OrderId { get; set; }
    public string? OrderCode { get; set; }
    public int? ContractId { get; set; }
}

/// <summary>
/// DTO chi tiết phiếu bảo hành cho Admin
/// </summary>
public class AdminWarrantyTicketDetailDto
{
    public int Id { get; set; }
    public string TicketNumber { get; set; } = string.Empty;
    public DateTime IssueDate { get; set; }
    public DateTime? ValidUntil { get; set; }
    public string Status { get; set; } = string.Empty;

    public AdminWarrantyCustomerDto Customer { get; set; } = null!;
    public AdminWarrantyOrderDto? Order { get; set; }
    public int? ContractId { get; set; }
    public AdminWarrantyContractDto? Contract { get; set; }

    public List<AdminWarrantyTicketLineDto> Lines { get; set; } = [];
    public List<AdminWarrantyClaimDto> Claims { get; set; } = [];
}

/// <summary>
/// Phạm vi bảo hành theo từng dòng đơn trên phiếu.
/// </summary>
public class AdminWarrantyTicketLineDto
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

    /// <summary>Claim đang xử lý trên dòng này (nếu có) — FE ẩn nút tạo mới.</summary>
    public int? ActiveClaimId { get; set; }
}

public class AdminWarrantyContractDto
{
    public int Id { get; set; }
    public string ContractNumber { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
}

public class AdminWarrantyCustomerDto
{
    public int Id { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string? Phone { get; set; }
    public string CustomerType { get; set; } = string.Empty;
    public string? CompanyName { get; set; }
}

public class AdminWarrantyOrderDto
{
    public int Id { get; set; }
    public string OrderCode { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public string OrderStatus { get; set; } = string.Empty;
    public decimal PayableTotal { get; set; }
}

/// <summary>
/// Một dòng trong danh sách yêu cầu bảo hành (claim) — dùng hàng đợi xử lý.
/// </summary>
public class AdminWarrantyClaimListItemDto
{
    public int Id { get; set; }
    public int WarrantyTicketId { get; set; }
    public string TicketNumber { get; set; } = string.Empty;
    public int CustomerId { get; set; }
    public string CustomerName { get; set; } = string.Empty;
    public string? CustomerPhone { get; set; }
    public int? OrderId { get; set; }
    public string? OrderCode { get; set; }
    public int? OrderItemId { get; set; }
    public int VariantId { get; set; }
    public string Sku { get; set; } = string.Empty;
    public DateTime? LineValidUntil { get; set; }
    public string VariantName { get; set; } = string.Empty;
    public string ProductName { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public decimal EstimatedCost { get; set; }
    public string? DefectDescription { get; set; }
}

public class AdminWarrantyClaimDto
{
    public int Id { get; set; }
    public int WarrantyTicketId { get; set; }
    public int? OrderItemId { get; set; }
    public int VariantId { get; set; }
    public string Sku { get; set; } = string.Empty;
    public DateTime? LineValidUntil { get; set; }
    public string VariantName { get; set; } = string.Empty;
    public string ProductName { get; set; } = string.Empty;
    public string? ImageUrl { get; set; }

    public string? DefectDescription { get; set; }
    public string? ImagesUrl { get; set; }
    public string Status { get; set; } = string.Empty;
    public decimal EstimatedCost { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? ResolvedDate { get; set; }
    public string? Resolution { get; set; }
    public string? Note { get; set; }
}

/// <summary>
/// DTO tạo phiếu bảo hành
/// </summary>
public class AdminWarrantyTicketCreateDto
{
    public int CustomerId { get; set; }
    public int? OrderId { get; set; }
    public int? ContractId { get; set; }
    
    /// <summary>
    /// Ngày hết hạn bảo hành. Nếu không nhập, mặc định 12 tháng kể từ ngày tạo.
    /// </summary>
    public DateTime? ValidUntil { get; set; }
}

/// <summary>
/// DTO tạo yêu cầu bảo hành
/// </summary>
public class AdminWarrantyClaimCreateDto
{
    /// <summary>Dòng đơn được bảo hành (ưu tiên). Nếu thiếu, BE suy ra từ VariantId khi chỉ có một dòng còn hạn.</summary>
    public int? OrderItemId { get; set; }

    public int VariantId { get; set; }
    public string? DefectDescription { get; set; }
    
    /// <summary>
    /// URL hình ảnh lỗi (nhiều URL cách nhau bằng dấu phẩy hoặc dấu ;)
    /// </summary>
    public string? ImagesUrl { get; set; }
    
    /// <summary>
    /// Chi phí sửa chữa dự kiến (nếu có)
    /// </summary>
    public decimal EstimatedCost { get; set; }
    
    public string? Note { get; set; }
}

/// <summary>
/// DTO cập nhật trạng thái yêu cầu bảo hành
/// </summary>
public class AdminWarrantyClaimUpdateStatusDto
{
    public string Status { get; set; } = string.Empty;
    
    /// <summary>
    /// Chi phí sửa chữa dự kiến (cập nhật khi cần)
    /// </summary>
    public decimal? EstimatedCost { get; set; }
    
    /// <summary>
    /// Kết quả xử lý (khi hoàn thành hoặc từ chối)
    /// </summary>
    public string? Resolution { get; set; }
    
    /// <summary>
    /// Ghi chú thêm
    /// </summary>
    public string? Note { get; set; }
}
