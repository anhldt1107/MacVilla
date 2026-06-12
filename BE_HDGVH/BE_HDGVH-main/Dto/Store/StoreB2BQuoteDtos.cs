namespace BE_API.Dto.Store;

/// <summary>
/// DTO yêu cầu báo giá từ khách B2B
/// </summary>
public class StoreB2BQuoteRequestDto
{
    /// <summary>Danh sách sản phẩm cần báo giá</summary>
    public List<StoreB2BQuoteRequestItemDto> Items { get; set; } = [];

    /// <summary>Ghi chú / yêu cầu đặc biệt từ khách</summary>
    public string? Notes { get; set; }
}

public class StoreB2BQuoteRequestItemDto
{
    /// <summary>ID của ProductVariant</summary>
    public int VariantId { get; set; }

    /// <summary>Số lượng yêu cầu</summary>
    public int Quantity { get; set; }
}

/// <summary>
/// DTO hiển thị danh sách báo giá cho khách B2B
/// </summary>
public class StoreB2BQuoteListItemDto
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
    public string? SalesName { get; set; }
}

/// <summary>
/// DTO chi tiết báo giá cho khách B2B
/// </summary>
public class StoreB2BQuoteDetailDto
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

    /// <summary>Ghi chú từ Sales/Admin</summary>
    public string? Notes { get; set; }

    /// <summary>Ghi chú ban đầu từ khách khi yêu cầu báo giá</summary>
    public string? CustomerNotes { get; set; }

    /// <summary>Lý do từ chối (nếu Manager reject)</summary>
    public string? RejectReason { get; set; }

    /// <summary>Lý do khách từ chối (nếu có)</summary>
    public string? CustomerRejectReason { get; set; }

    /// <summary>Nội dung phản hồi thương lượng gần nhất từ khách (counter-offer)</summary>
    public string? CounterOfferMessage { get; set; }

    public DateTime? ApprovedAt { get; set; }

    public StoreB2BQuoteSalesDto? Sales { get; set; }

    public List<StoreB2BQuoteLineDto> Lines { get; set; } = [];
}

public class StoreB2BQuoteSalesDto
{
    public int Id { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string? Phone { get; set; }
}

public class StoreB2BQuoteLineDto
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
}

/// <summary>
/// DTO khách từ chối báo giá
/// </summary>
public class StoreB2BQuoteRejectDto
{
    /// <summary>Lý do khách từ chối</summary>
    public string? Reason { get; set; }
}

/// <summary>
/// DTO khách gửi phản hồi thương lượng (counter-offer)
/// </summary>
public class StoreB2BQuoteCounterOfferDto
{
    /// <summary>Nội dung đề xuất / thương lượng từ khách</summary>
    public string Message { get; set; } = string.Empty;

    /// <summary>Danh sách điều chỉnh (nếu có)</summary>
    public List<StoreB2BQuoteCounterOfferItemDto>? Items { get; set; }
}

public class StoreB2BQuoteCounterOfferItemDto
{
    public int VariantId { get; set; }
    public int? DesiredQuantity { get; set; }
    public decimal? DesiredUnitPrice { get; set; }
}
