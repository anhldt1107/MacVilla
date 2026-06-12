namespace BE_API.Domain;

/// <summary>
/// Trạng thái phiếu xuất kho (Fulfillment)
/// </summary>
public static class FulfillmentStatuses
{
    /// <summary>Chờ xử lý</summary>
    public const string Pending = "Pending";

    /// <summary>Đang lấy hàng</summary>
    public const string Picking = "Picking";

    /// <summary>Đã đóng gói</summary>
    public const string Packed = "Packed";

    /// <summary>Đã giao vận chuyển</summary>
    public const string Shipped = "Shipped";

    /// <summary>Đã hủy</summary>
    public const string Cancelled = "Cancelled";

    public static readonly string[] All =
    [
        Pending,
        Picking,
        Packed,
        Shipped,
        Cancelled
    ];

    public static bool IsValid(string? status) =>
        !string.IsNullOrWhiteSpace(status) &&
        All.Contains(status, StringComparer.OrdinalIgnoreCase);

    /// <summary>
    /// Kiểm tra chuyển trạng thái có hợp lệ không
    /// Pending → Picking → Packed → Shipped
    /// </summary>
    public static bool CanTransition(string from, string to)
    {
        if (string.Equals(from, to, StringComparison.OrdinalIgnoreCase))
            return false;

        return (from, to) switch
        {
            (Pending, Picking) => true,
            (Pending, Cancelled) => true,
            (Picking, Packed) => true,
            (Picking, Cancelled) => true,
            (Packed, Shipped) => true,
            (Packed, Cancelled) => true,
            _ => false
        };
    }

    /// <summary>
    /// Có thể hủy phiếu không
    /// </summary>
    public static bool CanCancel(string status) =>
        status is Pending or Picking or Packed;
}
