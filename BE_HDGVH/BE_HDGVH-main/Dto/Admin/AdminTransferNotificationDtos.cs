using System.ComponentModel.DataAnnotations;

namespace BE_API.Dto.Admin;

public class AdminTransferNotificationListItemDto
{
    public int Id { get; set; }
    public int CustomerId { get; set; }
    public string CustomerName { get; set; } = string.Empty;
    public string? CompanyName { get; set; }
    public int? InvoiceId { get; set; }
    public string? InvoiceNumber { get; set; }
    public string ReferenceCode { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string? Note { get; set; }
    public string? AttachmentUrl { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public int? ProcessedBy { get; set; }
    public string? ProcessedByName { get; set; }
    public DateTime? ProcessedAt { get; set; }
}

public class AdminTransferNotificationDetailDto : AdminTransferNotificationListItemDto
{
    public string? ProcessNote { get; set; }
}

/// <summary>Xác nhận thông báo CK (ghi nhận thanh toán + đánh dấu Verified).</summary>
public class AdminTransferNotificationVerifyDto
{
    /// <summary>Ghi chú kế toán khi xác nhận (lưu vào ProcessNote + ghép vào Note giao dịch).</summary>
    [MaxLength(2000)]
    public string? ProcessNote { get; set; }
}

/// <summary>Từ chối thông báo CK.</summary>
public class AdminTransferNotificationRejectDto
{
    [Required(ErrorMessage = "Lý do từ chối là bắt buộc.")]
    [MaxLength(2000)]
    public string Reason { get; set; } = string.Empty;
}
