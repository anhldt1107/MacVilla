namespace BE_API.Entities;

/// <summary>
/// Thông báo chuyển khoản từ khách B2B
/// </summary>
public class TransferNotification : IEntity
{
    public int Id { get; set; }

    /// <summary>ID khách hàng B2B</summary>
    public int CustomerId { get; set; }

    /// <summary>ID hóa đơn (nếu có)</summary>
    public int? InvoiceId { get; set; }

    /// <summary>Mã tham chiếu từ ngân hàng</summary>
    public string ReferenceCode { get; set; } = string.Empty;

    /// <summary>Số tiền chuyển khoản</summary>
    public decimal Amount { get; set; }

    /// <summary>Ghi chú / nội dung chuyển khoản</summary>
    public string? Note { get; set; }

    /// <summary>URL chứng từ (ảnh chụp màn hình, biên lai, etc.)</summary>
    public string? AttachmentUrl { get; set; }

    /// <summary>Trạng thái: Pending, Verified, Rejected</summary>
    public string Status { get; set; } = "Pending";

    /// <summary>Ghi chú xử lý từ kế toán</summary>
    public string? ProcessNote { get; set; }

    /// <summary>ID người xử lý (kế toán/admin)</summary>
    public int? ProcessedBy { get; set; }

    /// <summary>Ngày tạo thông báo</summary>
    public DateTime CreatedAt { get; set; }

    /// <summary>Ngày xử lý</summary>
    public DateTime? ProcessedAt { get; set; }

    public Customer Customer { get; set; } = null!;
    public Invoice? Invoice { get; set; }
    public AppUser? ProcessedByUser { get; set; }
}
