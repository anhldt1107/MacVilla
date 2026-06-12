namespace BE_API.Dto.Admin;

/// <summary>
/// DTO hiển thị danh sách khách hàng cho Admin
/// </summary>
public class AdminCustomerListItemDto
{
    public int Id { get; set; }
    public string CustomerType { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string Phone { get; set; } = string.Empty;
    public string? CompanyName { get; set; }
    public string? TaxCode { get; set; }
    public decimal DebtBalance { get; set; }
    public int OrderCount { get; set; }
    public decimal TotalSpent { get; set; }
    public DateTime CreatedAt { get; set; }
}

/// <summary>
/// DTO chi tiết khách hàng cho Admin
/// </summary>
public class AdminCustomerDetailDto
{
    public int Id { get; set; }
    public string CustomerType { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string Phone { get; set; } = string.Empty;
    public string? CompanyName { get; set; }
    public string? TaxCode { get; set; }
    public string? CompanyAddress { get; set; }
    public decimal DebtBalance { get; set; }
    public DateTime CreatedAt { get; set; }

    // Statistics
    public int OrderCount { get; set; }
    public decimal TotalSpent { get; set; }
    public DateTime? LastOrderDate { get; set; }

    // Addresses
    public List<AdminCustomerAddressDto> Addresses { get; set; } = [];
}

public class AdminCustomerAddressDto
{
    public int Id { get; set; }
    public string ReceiverName { get; set; } = string.Empty;
    public string ReceiverPhone { get; set; } = string.Empty;
    public string AddressLine { get; set; } = string.Empty;
    public bool IsDefault { get; set; }
}

/// <summary>
/// DTO tạo khách hàng mới (Sales nhập liệu)
/// </summary>
public class AdminCustomerCreateDto
{
    public string CustomerType { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string Phone { get; set; } = string.Empty;
    public string? CompanyName { get; set; }
    public string? TaxCode { get; set; }
    public string? CompanyAddress { get; set; }
}

/// <summary>
/// DTO cập nhật thông tin khách hàng
/// </summary>
public class AdminCustomerUpdateDto
{
    public string? CustomerType { get; set; }
    public string? FullName { get; set; }
    public string? Email { get; set; }
    public string? Phone { get; set; }
    public string? CompanyName { get; set; }
    public string? TaxCode { get; set; }
    public string? CompanyAddress { get; set; }
}

/// <summary>
/// DTO điều chỉnh công nợ B2B
/// </summary>
public class AdminCustomerAdjustDebtDto
{
    /// <summary>
    /// Số tiền điều chỉnh (dương: tăng nợ, âm: giảm nợ/thanh toán)
    /// </summary>
    public decimal Amount { get; set; }

    /// <summary>
    /// Lý do điều chỉnh
    /// </summary>
    public string? Reason { get; set; }
}

/// <summary>
/// DTO thông tin công nợ khách hàng
/// </summary>
public class AdminCustomerDebtDto
{
    public int CustomerId { get; set; }
    public string CustomerName { get; set; } = string.Empty;
    public string CustomerType { get; set; } = string.Empty;
    public string? CompanyName { get; set; }
    public decimal DebtBalance { get; set; }
    public decimal TotalInvoiced { get; set; }
    public decimal TotalPaid { get; set; }
    public List<AdminCustomerDebtOrderDto> UnpaidOrders { get; set; } = [];
}

public class AdminCustomerDebtOrderDto
{
    public int OrderId { get; set; }
    public string OrderCode { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public decimal PayableTotal { get; set; }
    public string PaymentStatus { get; set; } = string.Empty;
}

/// <summary>
/// DTO lịch sử đơn hàng của khách
/// </summary>
public class AdminCustomerOrderHistoryDto
{
    public int Id { get; set; }
    public string OrderCode { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public string OrderStatus { get; set; } = string.Empty;
    public string PaymentStatus { get; set; } = string.Empty;
    public decimal PayableTotal { get; set; }
    public int LineCount { get; set; }
}
