namespace BE_API.Domain;

/// <summary>
/// Trạng thái yêu cầu bảo hành (WarrantyClaim)
/// </summary>
public static class WarrantyClaimStatuses
{
    /// <summary>Chờ kiểm tra</summary>
    public const string PendingCheck = "Pending_Check";

    /// <summary>Đang kiểm tra</summary>
    public const string Checking = "Checking";

    /// <summary>Đã xác nhận lỗi - chờ sửa chữa</summary>
    public const string ConfirmedDefect = "Confirmed_Defect";

    /// <summary>Đang sửa chữa</summary>
    public const string Repairing = "Repairing";

    /// <summary>Chờ khách nhận hàng</summary>
    public const string WaitingPickup = "Waiting_Pickup";

    /// <summary>Đã hoàn thành</summary>
    public const string Completed = "Completed";

    /// <summary>Từ chối bảo hành (lỗi do người dùng)</summary>
    public const string Rejected = "Rejected";

    /// <summary>Đã hủy</summary>
    public const string Cancelled = "Cancelled";

    public static readonly string[] All =
    [
        PendingCheck,
        Checking,
        ConfirmedDefect,
        Repairing,
        WaitingPickup,
        Completed,
        Rejected,
        Cancelled
    ];

    public static bool IsValid(string? status) =>
        !string.IsNullOrWhiteSpace(status) &&
        All.Contains(status, StringComparer.OrdinalIgnoreCase);

    /// <summary>
    /// Kiểm tra có thể chuyển trạng thái không
    /// </summary>
    public static bool CanTransition(string currentStatus, string newStatus)
    {
        return (currentStatus, newStatus) switch
        {
            // Từ Pending_Check có thể chuyển sang Checking hoặc Cancelled
            (PendingCheck, Checking) => true,
            (PendingCheck, Cancelled) => true,

            // Từ Checking có thể chuyển sang ConfirmedDefect, Rejected hoặc Cancelled
            (Checking, ConfirmedDefect) => true,
            (Checking, Rejected) => true,
            (Checking, Cancelled) => true,

            // Từ ConfirmedDefect có thể chuyển sang Repairing hoặc Cancelled
            (ConfirmedDefect, Repairing) => true,
            (ConfirmedDefect, Cancelled) => true,

            // Từ Repairing có thể chuyển sang WaitingPickup
            (Repairing, WaitingPickup) => true,

            // Từ WaitingPickup có thể chuyển sang Completed
            (WaitingPickup, Completed) => true,

            _ => false
        };
    }

    /// <summary>
    /// Kiểm tra trạng thái có thể cập nhật không (chưa hoàn thành/hủy)
    /// </summary>
    public static bool CanUpdate(string status) =>
        !string.Equals(status, Completed, StringComparison.OrdinalIgnoreCase) &&
        !string.Equals(status, Rejected, StringComparison.OrdinalIgnoreCase) &&
        !string.Equals(status, Cancelled, StringComparison.OrdinalIgnoreCase);
}
