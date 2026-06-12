namespace BE_API.Domain;

/// <summary>
/// Trạng thái đơn hàng
/// </summary>
public static class OrderStatuses
{
    /// <summary>Đơn mới tạo, chờ xác nhận</summary>
    public const string New = "New";

    /// <summary>Đang chờ thanh toán (PayOS)</summary>
    public const string AwaitingPayment = "AwaitingPayment";

    /// <summary>Đã xác nhận, chờ xử lý</summary>
    public const string Confirmed = "Confirmed";

    /// <summary>Đang xử lý / chuẩn bị hàng</summary>
    public const string Processing = "Processing";

    /// <summary>Sẵn sàng giao hàng</summary>
    public const string ReadyToShip = "ReadyToShip";

    /// <summary>Đang giao hàng</summary>
    public const string Shipped = "Shipped";

    /// <summary>Đã giao hàng thành công</summary>
    public const string Delivered = "Delivered";

    /// <summary>Hoàn thành (khách xác nhận)</summary>
    public const string Completed = "Completed";

    /// <summary>Đã hủy</summary>
    public const string Cancelled = "Cancelled";

    public static readonly string[] All =
    [
        New,
        AwaitingPayment,
        Confirmed,
        Processing,
        ReadyToShip,
        Shipped,
        Delivered,
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
            (New, Confirmed) => true,
            (New, Cancelled) => true,
            (AwaitingPayment, Confirmed) => true,
            (AwaitingPayment, Cancelled) => true,
            (Confirmed, Processing) => true,
            (Confirmed, Cancelled) => true,
            (Processing, ReadyToShip) => true,
            (Processing, Cancelled) => true,
            (ReadyToShip, Shipped) => true,
            (ReadyToShip, Cancelled) => true,
            (Shipped, Delivered) => true,
            (Delivered, Completed) => true,
            _ => false
        };
    }

    /// <summary>
    /// Có thể hủy đơn không
    /// </summary>
    public static bool CanCancel(string status) =>
        status is New or AwaitingPayment or Confirmed or Processing or ReadyToShip;
}
