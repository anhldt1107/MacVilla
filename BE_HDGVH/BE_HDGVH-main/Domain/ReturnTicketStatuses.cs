namespace BE_API.Domain;

/// <summary>
/// Trạng thái phiếu đổi/trả hàng
/// </summary>
public static class ReturnTicketStatuses
{
    /// <summary>Yêu cầu mới, chờ duyệt</summary>
    public const string Requested = "Requested";

    /// <summary>Đang chờ Manager duyệt</summary>
    public const string PendingApproval = "PendingApproval";

    /// <summary>Đã được Manager duyệt</summary>
    public const string Approved = "Approved";

    /// <summary>Manager từ chối</summary>
    public const string Rejected = "Rejected";

    /// <summary>Đang xử lý thu hồi hàng</summary>
    public const string Processing = "Processing";

    /// <summary>Đã thu hồi hàng, chờ hoàn tiền/đổi hàng</summary>
    public const string ItemsReceived = "ItemsReceived";

    /// <summary>Hoàn thành (đã hoàn tiền hoặc đổi hàng xong)</summary>
    public const string Completed = "Completed";

    /// <summary>Đã hủy</summary>
    public const string Cancelled = "Cancelled";

    public static readonly string[] All =
    [
        Requested,
        PendingApproval,
        Approved,
        Rejected,
        Processing,
        ItemsReceived,
        Completed,
        Cancelled
    ];

    public static bool IsValid(string? status) =>
        !string.IsNullOrWhiteSpace(status) &&
        All.Contains(status, StringComparer.OrdinalIgnoreCase);

    /// <summary>
    /// Kiểm tra chuyển trạng thái có hợp lệ không
    /// </summary>
    public static bool CanTransition(string from, string to)
    {
        if (string.Equals(from, to, StringComparison.OrdinalIgnoreCase))
            return false;

        return (from, to) switch
        {
            (Requested, PendingApproval) => true,
            (Requested, Approved) => true,
            (Requested, Rejected) => true,
            (Requested, Cancelled) => true,
            (PendingApproval, Approved) => true,
            (PendingApproval, Rejected) => true,
            (PendingApproval, Cancelled) => true,
            (Approved, Processing) => true,
            (Approved, Cancelled) => true,
            (Processing, ItemsReceived) => true,
            (Processing, Cancelled) => true,
            (ItemsReceived, Completed) => true,
            _ => false
        };
    }

    /// <summary>
    /// Có thể duyệt phiếu không
    /// </summary>
    public static bool CanApprove(string status) =>
        status is Requested or PendingApproval;

    /// <summary>
    /// Có thể từ chối phiếu không
    /// </summary>
    public static bool CanReject(string status) =>
        status is Requested or PendingApproval;

    /// <summary>
    /// Có thể hoàn thành phiếu không
    /// </summary>
    public static bool CanComplete(string status) =>
        status is ItemsReceived;

    /// <summary>
    /// Có thể hủy phiếu không
    /// </summary>
    public static bool CanCancel(string status) =>
        status is Requested or PendingApproval or Approved or Processing;
}
