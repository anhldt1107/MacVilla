namespace BE_API.Dto.Store;

/// <summary>
/// DTO hiển thị danh sách giao dịch thanh toán B2B
/// </summary>
public class StoreB2BPaymentListItemDto
{
    public int Id { get; set; }

    /// <summary>Số tiền giao dịch</summary>
    public decimal Amount { get; set; }

    /// <summary>Phương thức thanh toán (BankTransfer, Cash, etc.)</summary>
    public string? PaymentMethod { get; set; }

    /// <summary>Loại giao dịch (Payment, Refund, etc.)</summary>
    public string? TransactionType { get; set; }

    /// <summary>Ngày thanh toán</summary>
    public DateTime PaymentDate { get; set; }

    /// <summary>Mã tham chiếu giao dịch</summary>
    public string? ReferenceCode { get; set; }

    /// <summary>Ghi chú</summary>
    public string? Note { get; set; }

    /// <summary>ID hóa đơn (nếu có)</summary>
    public int? InvoiceId { get; set; }

    /// <summary>Số hóa đơn (nếu có)</summary>
    public string? InvoiceNumber { get; set; }
}

/// <summary>
/// DTO chi tiết giao dịch thanh toán B2B
/// </summary>
public class StoreB2BPaymentDetailDto
{
    public int Id { get; set; }

    /// <summary>Số tiền giao dịch</summary>
    public decimal Amount { get; set; }

    /// <summary>Phương thức thanh toán (BankTransfer, Cash, etc.)</summary>
    public string? PaymentMethod { get; set; }

    /// <summary>Loại giao dịch (Payment, Refund, etc.)</summary>
    public string? TransactionType { get; set; }

    /// <summary>Ngày thanh toán</summary>
    public DateTime PaymentDate { get; set; }

    /// <summary>Mã tham chiếu giao dịch</summary>
    public string? ReferenceCode { get; set; }

    /// <summary>Ghi chú</summary>
    public string? Note { get; set; }

    /// <summary>Thông tin hóa đơn liên quan (nếu có)</summary>
    public StoreB2BPaymentInvoiceDto? Invoice { get; set; }
}

/// <summary>
/// DTO thông tin hóa đơn trong giao dịch thanh toán B2B
/// </summary>
public class StoreB2BPaymentInvoiceDto
{
    public int Id { get; set; }
    public string InvoiceNumber { get; set; } = string.Empty;
    public DateTime IssueDate { get; set; }
    public DateTime? DueDate { get; set; }
    public string Status { get; set; } = string.Empty;
    public decimal? TotalAmount { get; set; }
}

/// <summary>
/// DTO request thông báo chuyển khoản từ khách B2B
/// </summary>
public class StoreB2BNotifyTransferRequestDto
{
    /// <summary>Mã tham chiếu chuyển khoản (từ ngân hàng)</summary>
    public string ReferenceCode { get; set; } = string.Empty;

    /// <summary>Số tiền chuyển khoản</summary>
    public decimal Amount { get; set; }

    /// <summary>Ghi chú / nội dung chuyển khoản</summary>
    public string? Note { get; set; }

    /// <summary>URL chứng từ (ảnh chụp màn hình, biên lai, etc.)</summary>
    public string? AttachmentUrl { get; set; }

    /// <summary>ID hóa đơn thanh toán (nếu có)</summary>
    public int? InvoiceId { get; set; }
}

/// <summary>
/// DTO response sau khi gửi thông báo chuyển khoản
/// </summary>
public class StoreB2BNotifyTransferResponseDto
{
    /// <summary>ID thông báo chuyển khoản</summary>
    public int Id { get; set; }

    /// <summary>Số tiền</summary>
    public decimal Amount { get; set; }

    /// <summary>Mã tham chiếu</summary>
    public string? ReferenceCode { get; set; }

    /// <summary>Ghi chú</summary>
    public string? Note { get; set; }

    /// <summary>Ngày tạo thông báo</summary>
    public DateTime CreatedAt { get; set; }

    /// <summary>Trạng thái xử lý</summary>
    public string Status { get; set; } = string.Empty;

    /// <summary>Thông báo</summary>
    public string Message { get; set; } = string.Empty;
}

/// <summary>
/// Thông báo CK do khách gửi (đọc)
/// </summary>
public class StoreB2BTransferNotificationListItemDto
{
    public int Id { get; set; }
    public string ReferenceCode { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string? Note { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public string? AttachmentUrl { get; set; }
    public int? InvoiceId { get; set; }
    public string? InvoiceNumber { get; set; }
    public string? ProcessNote { get; set; }
}

/// <summary>
/// TK nhận tiền (hiển thị B2B)
/// </summary>
public class StoreB2BBankTransferInfoDto
{
    public string Beneficiary { get; set; } = string.Empty;
    public string AccountNumber { get; set; } = string.Empty;
    public string BankName { get; set; } = string.Empty;
    public string TransferSyntaxPrefix { get; set; } = string.Empty;
}
