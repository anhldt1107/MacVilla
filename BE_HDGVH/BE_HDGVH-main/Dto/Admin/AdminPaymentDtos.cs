namespace BE_API.Dto.Admin;

/// <summary>
/// DTO hiển thị danh sách giao dịch thanh toán cho Admin
/// </summary>
public class AdminPaymentListItemDto
{
    public int Id { get; set; }
    public decimal Amount { get; set; }
    public string? PaymentMethod { get; set; }
    public string? TransactionType { get; set; }
    public DateTime PaymentDate { get; set; }
    public string? ReferenceCode { get; set; }
    public string? Note { get; set; }

    public int CustomerId { get; set; }
    public string CustomerName { get; set; } = string.Empty;
    public string? CustomerPhone { get; set; }
    public string? CustomerEmail { get; set; }
    public string? CompanyName { get; set; }

    public int? InvoiceId { get; set; }
    public string? InvoiceNumber { get; set; }
}

/// <summary>
/// DTO chi tiết giao dịch thanh toán cho Admin
/// </summary>
public class AdminPaymentDetailDto
{
    public int Id { get; set; }
    public decimal Amount { get; set; }
    public string? PaymentMethod { get; set; }
    public string? TransactionType { get; set; }
    public DateTime PaymentDate { get; set; }
    public string? ReferenceCode { get; set; }
    public string? Note { get; set; }

    public AdminPaymentCustomerDto Customer { get; set; } = null!;
    public AdminPaymentInvoiceDto? Invoice { get; set; }
}

public class AdminPaymentCustomerDto
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

public class AdminPaymentInvoiceDto
{
    public int Id { get; set; }
    public string InvoiceNumber { get; set; } = string.Empty;
    public DateTime IssueDate { get; set; }
    public DateTime? DueDate { get; set; }
    public string Status { get; set; } = string.Empty;
    public decimal? TotalAmount { get; set; }
    public int? OrderId { get; set; }
    public string? OrderCode { get; set; }
}

/// <summary>
/// DTO ghi nhận thanh toán (thu tiền từ sổ phụ ngân hàng)
/// </summary>
public class AdminPaymentCreateDto
{
    public int CustomerId { get; set; }
    public int? InvoiceId { get; set; }
    public decimal Amount { get; set; }
    public string PaymentMethod { get; set; } = string.Empty;
    public DateTime PaymentDate { get; set; }
    public string? ReferenceCode { get; set; }
    public string? Note { get; set; }
}

/// <summary>
/// DTO ghi nhận hoàn tiền
/// </summary>
public class AdminPaymentRefundDto
{
    public int CustomerId { get; set; }
    public int? InvoiceId { get; set; }
    public decimal Amount { get; set; }
    public string PaymentMethod { get; set; } = string.Empty;
    public DateTime PaymentDate { get; set; }
    public string? ReferenceCode { get; set; }
    public string? Note { get; set; }
}
