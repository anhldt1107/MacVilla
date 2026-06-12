namespace BE_API.Dto.Store;

/// <summary>
/// DTO tổng quan công nợ của khách hàng B2B
/// </summary>
public class StoreB2BDebtSummaryDto
{
    /// <summary>Tổng số dư công nợ hiện tại</summary>
    public decimal TotalDebtBalance { get; set; }

    /// <summary>Tổng số tiền đã quá hạn (Overdue)</summary>
    public decimal OverdueAmount { get; set; }

    /// <summary>Số hóa đơn quá hạn</summary>
    public int OverdueCount { get; set; }

    /// <summary>Tổng số tiền sắp đến hạn (trong 7 ngày tới)</summary>
    public decimal DueSoonAmount { get; set; }

    /// <summary>Số hóa đơn sắp đến hạn</summary>
    public int DueSoonCount { get; set; }

    /// <summary>Tổng số tiền chưa thanh toán (bao gồm cả quá hạn và chưa đến hạn)</summary>
    public decimal TotalUnpaidAmount { get; set; }

    /// <summary>Số hóa đơn chưa thanh toán</summary>
    public int TotalUnpaidCount { get; set; }

    /// <summary>Số hóa đơn đã thanh toán đủ</summary>
    public int PaidCount { get; set; }
}

/// <summary>
/// DTO hiển thị danh sách hóa đơn B2B
/// </summary>
public class StoreB2BInvoiceListItemDto
{
    public int Id { get; set; }
    public string InvoiceNumber { get; set; } = string.Empty;
    public DateTime IssueDate { get; set; }
    public DateTime? DueDate { get; set; }
    public string Status { get; set; } = string.Empty;

    /// <summary>Tiền trước thuế</summary>
    public decimal? SubTotal { get; set; }

    /// <summary>Tiền thuế VAT</summary>
    public decimal? TaxAmount { get; set; }

    /// <summary>Tổng tiền</summary>
    public decimal? TotalAmount { get; set; }

    /// <summary>Số tiền đã thanh toán</summary>
    public decimal PaidAmount { get; set; }

    /// <summary>Số tiền còn phải trả</summary>
    public decimal RemainingAmount { get; set; }

    /// <summary>ID đơn hàng (nếu có)</summary>
    public int? OrderId { get; set; }

    /// <summary>Mã đơn hàng (nếu có)</summary>
    public string? OrderCode { get; set; }

    /// <summary>ID hợp đồng (nếu có)</summary>
    public int? ContractId { get; set; }

    /// <summary>Mã hợp đồng (nếu có)</summary>
    public string? ContractNumber { get; set; }

    /// <summary>Số ngày còn lại đến hạn (âm nếu quá hạn)</summary>
    public int? DaysUntilDue { get; set; }
}

/// <summary>
/// DTO chi tiết hóa đơn B2B
/// </summary>
public class StoreB2BInvoiceDetailDto
{
    public int Id { get; set; }
    public string InvoiceNumber { get; set; } = string.Empty;
    public DateTime IssueDate { get; set; }
    public DateTime? DueDate { get; set; }
    public string Status { get; set; } = string.Empty;

    /// <summary>Tiền trước thuế</summary>
    public decimal? SubTotal { get; set; }

    /// <summary>Tiền thuế VAT</summary>
    public decimal? TaxAmount { get; set; }

    /// <summary>Tổng tiền</summary>
    public decimal? TotalAmount { get; set; }

    /// <summary>Số tiền đã thanh toán</summary>
    public decimal PaidAmount { get; set; }

    /// <summary>Số tiền còn phải trả</summary>
    public decimal RemainingAmount { get; set; }

    /// <summary>Mã số thuế trên hóa đơn</summary>
    public string? TaxCode { get; set; }

    /// <summary>Tên công ty trên hóa đơn</summary>
    public string? CompanyName { get; set; }

    /// <summary>Địa chỉ xuất hóa đơn</summary>
    public string? BillingAddress { get; set; }

    /// <summary>URL file PDF hóa đơn (nếu có)</summary>
    public string? PdfUrl { get; set; }

    /// <summary>Thông tin đơn hàng liên quan (nếu có)</summary>
    public StoreB2BInvoiceOrderDto? Order { get; set; }

    /// <summary>Thông tin hợp đồng liên quan (nếu có)</summary>
    public StoreB2BInvoiceContractDto? Contract { get; set; }

    /// <summary>Lịch sử thanh toán</summary>
    public List<StoreB2BInvoicePaymentDto> Payments { get; set; } = [];

    /// <summary>Số ngày còn lại đến hạn (âm nếu quá hạn)</summary>
    public int? DaysUntilDue { get; set; }
}

/// <summary>
/// DTO thông tin đơn hàng trong hóa đơn B2B
/// </summary>
public class StoreB2BInvoiceOrderDto
{
    public int Id { get; set; }
    public string OrderCode { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public string OrderStatus { get; set; } = string.Empty;
    public string PaymentStatus { get; set; } = string.Empty;
    public decimal PayableTotal { get; set; }
}

/// <summary>
/// DTO thông tin hợp đồng trong hóa đơn B2B
/// </summary>
public class StoreB2BInvoiceContractDto
{
    public int Id { get; set; }
    public string ContractNumber { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public DateTime? ValidFrom { get; set; }
    public DateTime? ValidTo { get; set; }
}

/// <summary>
/// DTO giao dịch thanh toán trong hóa đơn B2B
/// </summary>
public class StoreB2BInvoicePaymentDto
{
    public int Id { get; set; }
    public decimal Amount { get; set; }
    public string? PaymentMethod { get; set; }
    public string? TransactionType { get; set; }
    public DateTime PaymentDate { get; set; }
    public string? ReferenceCode { get; set; }
    public string? Note { get; set; }
}
