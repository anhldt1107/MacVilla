namespace BE_API.Domain;

/// <summary>
/// Trạng thái hợp đồng B2B
/// </summary>
public static class ContractStatuses
{
    /// <summary>Nháp - đang soạn hợp đồng</summary>
    public const string Draft = "Draft";

    /// <summary>Chờ khách xác nhận</summary>
    public const string PendingConfirmation = "PendingConfirmation";

    /// <summary>Khách đã xác nhận (ký điện tử/acknowledge)</summary>
    public const string Confirmed = "Confirmed";

    /// <summary>Đang thực hiện - có đơn hàng đang xử lý</summary>
    public const string Active = "Active";

    /// <summary>Hoàn thành - tất cả đơn hàng và thanh toán đã xong</summary>
    public const string Completed = "Completed";

    /// <summary>Đã hủy</summary>
    public const string Cancelled = "Cancelled";

    /// <summary>Hết hạn</summary>
    public const string Expired = "Expired";

    public static readonly string[] All =
    [
        Draft,
        PendingConfirmation,
        Confirmed,
        Active,
        Completed,
        Cancelled,
        Expired
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
            // Luồng tạo và gửi hợp đồng
            (Draft, PendingConfirmation) => true,
            (Draft, Cancelled) => true,

            // Khách xác nhận hoặc từ chối
            (PendingConfirmation, Confirmed) => true,
            (PendingConfirmation, Cancelled) => true,
            (PendingConfirmation, Expired) => true,

            // Kích hoạt khi có đơn hàng
            (Confirmed, Active) => true,
            (Confirmed, Cancelled) => true,
            (Confirmed, Expired) => true,

            // Hoàn thành hoặc hủy khi đang thực hiện
            (Active, Completed) => true,
            (Active, Cancelled) => true,

            _ => false
        };
    }

    /// <summary>
    /// Khách có thể xác nhận hợp đồng không
    /// </summary>
    public static bool CanCustomerConfirm(string status) =>
        string.Equals(status, PendingConfirmation, StringComparison.OrdinalIgnoreCase);

    /// <summary>
    /// Trạng thái mà khách B2B có thể xem được
    /// </summary>
    public static readonly string[] VisibleToCustomer =
    [
        PendingConfirmation,
        Confirmed,
        Active,
        Completed,
        Cancelled,
        Expired
    ];

    public static bool IsVisibleToCustomer(string status) =>
        VisibleToCustomer.Contains(status, StringComparer.OrdinalIgnoreCase);

    /// <summary>
    /// Hợp đồng còn hiệu lực (khách có thể đặt đơn theo hợp đồng)
    /// </summary>
    public static bool IsActiveContract(string status) =>
        string.Equals(status, Confirmed, StringComparison.OrdinalIgnoreCase) ||
        string.Equals(status, Active, StringComparison.OrdinalIgnoreCase);
}
