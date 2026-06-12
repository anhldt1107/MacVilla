namespace BE_API.Dto.Store;

/// <summary>
/// DTO hiển thị danh sách hợp đồng cho khách B2B
/// </summary>
public class StoreB2BContractListItemDto
{
    public int Id { get; set; }
    public string ContractNumber { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public DateTime? ValidFrom { get; set; }
    public DateTime? ValidTo { get; set; }
    public DateTime? SignedDate { get; set; }
    public DateTime CreatedAt { get; set; }

    /// <summary>Mã báo giá gốc</summary>
    public string QuoteCode { get; set; } = string.Empty;

    /// <summary>Tổng giá trị hợp đồng (từ Quote)</summary>
    public decimal? TotalAmount { get; set; }

    /// <summary>Số đơn hàng phát sinh từ hợp đồng</summary>
    public int OrderCount { get; set; }
}

/// <summary>
/// DTO chi tiết hợp đồng cho khách B2B
/// </summary>
public class StoreB2BContractDetailDto
{
    public int Id { get; set; }
    public string ContractNumber { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public DateTime? ValidFrom { get; set; }
    public DateTime? ValidTo { get; set; }
    public DateTime? SignedDate { get; set; }
    public DateTime? CustomerConfirmedAt { get; set; }
    public DateTime CreatedAt { get; set; }

    /// <summary>Điều khoản thanh toán</summary>
    public string? PaymentTerms { get; set; }

    /// <summary>URL file đính kèm (hợp đồng PDF, ...)</summary>
    public string? AttachmentUrl { get; set; }

    /// <summary>Ghi chú điều khoản bổ sung</summary>
    public string? Notes { get; set; }

    /// <summary>Giá trị hiển thị (thường = thành tiền báo giá <c>Quote.FinalAmount</c>)</summary>
    public decimal? TotalAmount { get; set; }

    /// <summary>Thông tin báo giá gốc</summary>
    public StoreB2BContractQuoteDto? Quote { get; set; }

    /// <summary>Danh sách đơn hàng phát sinh từ hợp đồng</summary>
    public List<StoreB2BContractOrderDto> Orders { get; set; } = [];
}

/// <summary>
/// DTO thông tin báo giá trong chi tiết hợp đồng
/// </summary>
public class StoreB2BContractQuoteDto
{
    public int Id { get; set; }
    public string QuoteCode { get; set; } = string.Empty;
    public decimal? TotalAmount { get; set; }
    public decimal? DiscountValue { get; set; }
    public string? DiscountType { get; set; }
    public decimal? FinalAmount { get; set; }
    public DateTime? ApprovedAt { get; set; }

    /// <summary>Danh sách sản phẩm trong báo giá</summary>
    public List<StoreB2BContractQuoteItemDto> Items { get; set; } = [];
}

/// <summary>
/// DTO item trong báo giá của hợp đồng
/// </summary>
public class StoreB2BContractQuoteItemDto
{
    /// <summary>ID dòng báo giá</summary>
    public int Id { get; set; }

    public int VariantId { get; set; }
    public string? Sku { get; set; }
    public string? ProductName { get; set; }
    public string? VariantName { get; set; }
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal SubTotal { get; set; }

    /// <summary>Ảnh biến thể hoặc ảnh sản phẩm</summary>
    public string? ImageUrl { get; set; }

    /// <summary>Kích thước (SKU)</summary>
    public string? Dimensions { get; set; }

    /// <summary>Khối lượng (SKU)</summary>
    public decimal? Weight { get; set; }

    /// <summary>Thời hạn bảo hành sản phẩm (tháng)</summary>
    public int WarrantyPeriodMonths { get; set; }
}

/// <summary>
/// DTO đơn hàng trong chi tiết hợp đồng
/// </summary>
public class StoreB2BContractOrderDto
{
    public int Id { get; set; }
    public string OrderCode { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public decimal? PayableTotal { get; set; }
    public DateTime CreatedAt { get; set; }
}

/// <summary>
/// DTO xác nhận hợp đồng (không cần body, có thể mở rộng sau)
/// </summary>
public class StoreB2BContractConfirmDto
{
    /// <summary>Ghi chú từ khách khi xác nhận (tuỳ chọn)</summary>
    public string? Notes { get; set; }
}
