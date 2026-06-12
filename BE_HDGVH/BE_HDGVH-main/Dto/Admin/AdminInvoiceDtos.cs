namespace BE_API.Dto.Admin;

/// <summary>
/// DTO hiển thị danh sách hóa đơn cho Admin
/// </summary>
public class AdminInvoiceListItemDto
{
    public int Id { get; set; }
    public string InvoiceNumber { get; set; } = string.Empty;
    public DateTime IssueDate { get; set; }
    public DateTime? DueDate { get; set; }
    public string Status { get; set; } = string.Empty;
    public decimal? SubTotal { get; set; }
    public decimal? TaxAmount { get; set; }
    public decimal? TotalAmount { get; set; }
    public decimal PaidAmount { get; set; }
    public decimal RemainingAmount { get; set; }

    public int CustomerId { get; set; }
    public string CustomerName { get; set; } = string.Empty;
    public string? CustomerPhone { get; set; }
    public string? CustomerEmail { get; set; }
    public string? CompanyName { get; set; }
    public string? TaxCode { get; set; }

    public int? OrderId { get; set; }
    public string? OrderCode { get; set; }
    public int? ContractId { get; set; }
}

/// <summary>
/// DTO chi tiết hóa đơn cho Admin
/// </summary>
public class AdminInvoiceDetailDto
{
    public int Id { get; set; }
    public string InvoiceNumber { get; set; } = string.Empty;
    public DateTime IssueDate { get; set; }
    public DateTime? DueDate { get; set; }
    public string Status { get; set; } = string.Empty;

    public decimal? SubTotal { get; set; }
    public decimal? TaxAmount { get; set; }
    public decimal? TotalAmount { get; set; }
    public decimal PaidAmount { get; set; }
    public decimal RemainingAmount { get; set; }

    public string? TaxCodeOnInvoice { get; set; }
    public string? CompanyNameOnInvoice { get; set; }
    public string? BillingAddress { get; set; }
    public string? PdfUrl { get; set; }

    public AdminInvoiceCustomerDto Customer { get; set; } = null!;
    public AdminInvoiceOrderDto? Order { get; set; }
    public int? ContractId { get; set; }

    public List<AdminInvoicePaymentDto> Payments { get; set; } = [];
}

public class AdminInvoiceCustomerDto
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

public class AdminInvoiceOrderDto
{
    public int Id { get; set; }
    public string OrderCode { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public string OrderStatus { get; set; } = string.Empty;
    public string PaymentStatus { get; set; } = string.Empty;
    public decimal PayableTotal { get; set; }
}

public class AdminInvoicePaymentDto
{
    public int Id { get; set; }
    public decimal Amount { get; set; }
    public string? PaymentMethod { get; set; }
    public string? TransactionType { get; set; }
    public DateTime PaymentDate { get; set; }
    public string? ReferenceCode { get; set; }
    public string? Note { get; set; }
}

/// <summary>
/// DTO tạo hóa đơn VAT
/// </summary>
public class AdminInvoiceCreateDto
{
    public int CustomerId { get; set; }
    public int? OrderId { get; set; }
    public int? ContractId { get; set; }
    public string? TaxCode { get; set; }
    public string? CompanyName { get; set; }
    public string? BillingAddress { get; set; }
    public decimal SubTotal { get; set; }
    public decimal? TaxAmount { get; set; }
    public DateTime? DueDate { get; set; }
}

/// <summary>
/// DTO cập nhật thông tin xuất VAT
/// </summary>
public class AdminInvoiceUpdateDto
{
    public string? TaxCode { get; set; }
    public string? CompanyName { get; set; }
    public string? BillingAddress { get; set; }
    public DateTime? DueDate { get; set; }
    public string? PdfUrl { get; set; }
}
