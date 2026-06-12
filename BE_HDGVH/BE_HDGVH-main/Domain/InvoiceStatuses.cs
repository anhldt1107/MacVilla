namespace BE_API.Domain;

/// <summary>
/// Trạng thái hóa đơn VAT
/// </summary>
public static class InvoiceStatuses
{
    /// <summary>Bản nháp - chưa phát hành</summary>
    public const string Draft = "Draft";

    /// <summary>Chưa thanh toán</summary>
    public const string Unpaid = "Unpaid";

    /// <summary>Thanh toán một phần</summary>
    public const string PartiallyPaid = "PartiallyPaid";

    /// <summary>Đã thanh toán đủ</summary>
    public const string Paid = "Paid";

    /// <summary>Quá hạn</summary>
    public const string Overdue = "Overdue";

    /// <summary>Đã hủy</summary>
    public const string Cancelled = "Cancelled";

    public static readonly string[] All =
    [
        Draft,
        Unpaid,
        PartiallyPaid,
        Paid,
        Overdue,
        Cancelled
    ];

    public static bool IsValid(string? status) =>
        !string.IsNullOrWhiteSpace(status) &&
        All.Contains(status, StringComparer.OrdinalIgnoreCase);

    /// <summary>
    /// Kiểm tra có thể chỉnh sửa hóa đơn không
    /// </summary>
    public static bool CanEdit(string status) =>
        string.Equals(status, Draft, StringComparison.OrdinalIgnoreCase) ||
        string.Equals(status, Unpaid, StringComparison.OrdinalIgnoreCase);

    /// <summary>
    /// Kiểm tra có thể hủy hóa đơn không
    /// </summary>
    public static bool CanCancel(string status) =>
        string.Equals(status, Draft, StringComparison.OrdinalIgnoreCase) ||
        string.Equals(status, Unpaid, StringComparison.OrdinalIgnoreCase);

    /// <summary>
    /// Kiểm tra có thể ghi nhận thanh toán không
    /// </summary>
    public static bool CanReceivePayment(string status) =>
        string.Equals(status, Unpaid, StringComparison.OrdinalIgnoreCase) ||
        string.Equals(status, PartiallyPaid, StringComparison.OrdinalIgnoreCase) ||
        string.Equals(status, Overdue, StringComparison.OrdinalIgnoreCase);
}
