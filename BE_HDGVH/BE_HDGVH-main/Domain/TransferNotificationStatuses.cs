namespace BE_API.Domain;

/// <summary>
/// Trạng thái thông báo chuyển khoản
/// </summary>
public static class TransferNotificationStatuses
{
    /// <summary>Chờ xử lý</summary>
    public const string Pending = "Pending";

    /// <summary>Đã xác nhận (khớp với giao dịch ngân hàng)</summary>
    public const string Verified = "Verified";

    /// <summary>Từ chối (không tìm thấy hoặc không khớp)</summary>
    public const string Rejected = "Rejected";

    public static readonly string[] All =
    [
        Pending,
        Verified,
        Rejected
    ];

    public static bool IsValid(string? status) =>
        !string.IsNullOrWhiteSpace(status) &&
        All.Contains(status, StringComparer.OrdinalIgnoreCase);
}
