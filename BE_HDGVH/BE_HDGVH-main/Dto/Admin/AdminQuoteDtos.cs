namespace BE_API.Dto.Admin;

/// <summary>
/// DTO hiển thị danh sách báo giá cho Admin
/// </summary>
public class AdminQuoteListItemDto
{
    public int Id { get; set; }
    public string QuoteCode { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public string Status { get; set; } = string.Empty;
    public int LineCount { get; set; }
    public decimal? TotalAmount { get; set; }
    public decimal? DiscountValue { get; set; }
    public string? DiscountType { get; set; }
    public decimal? FinalAmount { get; set; }
    public DateTime? ValidUntil { get; set; }

    public int CustomerId { get; set; }
    public string CustomerName { get; set; } = string.Empty;
    public string? CustomerPhone { get; set; }
    public string? CustomerEmail { get; set; }
    public string? CompanyName { get; set; }
    public string? TaxCode { get; set; }

    public int? SalesId { get; set; }
    public string? SalesName { get; set; }

    public int? ManagerId { get; set; }
    public string? ManagerName { get; set; }
}

/// <summary>
/// DTO chi tiết báo giá cho Admin
/// </summary>
public class AdminQuoteDetailDto
{
    public int Id { get; set; }
    public string QuoteCode { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public string Status { get; set; } = string.Empty;

    public decimal? TotalAmount { get; set; }
    public string? DiscountType { get; set; }
    public decimal? DiscountValue { get; set; }
    public decimal? FinalAmount { get; set; }
    public DateTime? ValidUntil { get; set; }
    public string? Notes { get; set; }
    public string? RejectReason { get; set; }
    public DateTime? ApprovedAt { get; set; }
    public DateTime? RejectedAt { get; set; }

    /// <summary>Ghi chú ban đầu từ khách khi yêu cầu báo giá (B2B).</summary>
    public string? CustomerNotes { get; set; }

    /// <summary>Phản hồi thương lượng từ khách (Approved → CounterOffer).</summary>
    public string? CounterOfferMessage { get; set; }

    /// <summary>Lý do khách từ chối báo giá.</summary>
    public string? CustomerRejectReason { get; set; }

    public DateTime? CustomerAcceptedAt { get; set; }
    public DateTime? CustomerRejectedAt { get; set; }

    public AdminQuoteCustomerDto Customer { get; set; } = null!;
    public AdminQuoteSalesDto? Sales { get; set; }
    public AdminQuoteManagerDto? Manager { get; set; }

    public List<AdminQuoteLineDto> Lines { get; set; } = [];
}

public class AdminQuoteCustomerDto
{
    public int Id { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string Phone { get; set; } = string.Empty;
    public string CustomerType { get; set; } = string.Empty;
    public string? CompanyName { get; set; }
    public string? TaxCode { get; set; }
    public string? CompanyAddress { get; set; }
    public decimal DebtBalance { get; set; }
}

public class AdminQuoteSalesDto
{
    public int Id { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string? Phone { get; set; }
}

public class AdminQuoteManagerDto
{
    public int Id { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string? Phone { get; set; }
}

public class AdminQuoteLineDto
{
    public int Id { get; set; }
    public int VariantId { get; set; }
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal SubTotal { get; set; }

    public string? CurrentSku { get; set; }
    public string? VariantName { get; set; }
    public string? ProductName { get; set; }
    public string? ImageUrl { get; set; }
    public decimal? CurrentRetailPrice { get; set; }
}

/// <summary>
/// DTO tạo báo giá (Sales tạo)
/// </summary>
public class AdminQuoteCreateDto
{
    public int CustomerId { get; set; }
    public List<AdminQuoteCreateLineDto> Lines { get; set; } = [];
    public string? DiscountType { get; set; }
    public decimal? DiscountValue { get; set; }
    public DateTime? ValidUntil { get; set; }
    public string? Notes { get; set; }
}

public class AdminQuoteCreateLineDto
{
    public int VariantId { get; set; }
    public int Quantity { get; set; }
    public decimal? UnitPrice { get; set; }
}

/// <summary>
/// DTO cập nhật báo giá (chỉ khi Draft)
/// </summary>
public class AdminQuoteUpdateDto
{
    public List<AdminQuoteUpdateLineDto> Lines { get; set; } = [];
    public string? DiscountType { get; set; }
    public decimal? DiscountValue { get; set; }
    public DateTime? ValidUntil { get; set; }
    public string? Notes { get; set; }
}

public class AdminQuoteUpdateLineDto
{
    public int? Id { get; set; }
    public int VariantId { get; set; }
    public int Quantity { get; set; }
    public decimal? UnitPrice { get; set; }
}

/// <summary>
/// Tiếp nhận / gán Sales cho báo giá (Requested / CounterOffer → Draft).
/// </summary>
public class AdminQuoteAssignDto
{
    /// <summary>
    /// Bỏ qua hoặc null: gán cho chính user đang gọi (Sales tự tiếp nhận).
    /// Có giá trị: user phải tồn tại (service); nếu khác user hiện tại thì chỉ Manager hoặc admin được phép (controller).
    /// </summary>
    public int? SalesId { get; set; }
}

/// <summary>
/// DTO từ chối báo giá
/// </summary>
public class AdminQuoteRejectDto
{
    public string? RejectReason { get; set; }
}

/// <summary>
/// DTO chuyển báo giá thành đơn hàng
/// </summary>
public class AdminQuoteConvertToOrderDto
{
    public int ShippingAddressId { get; set; }
    public string PaymentMethod { get; set; } = string.Empty;
    public string? Note { get; set; }

    /// <summary>Tuỳ chọn: hợp đồng đã được khách xác nhận (Confirmed) hoặc Active, cùng báo giá và khách.</summary>
    public int? ContractId { get; set; }
}
