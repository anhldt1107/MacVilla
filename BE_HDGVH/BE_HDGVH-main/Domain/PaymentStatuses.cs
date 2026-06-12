namespace BE_API.Domain;

/// <summary>
/// Trạng thái thanh toán đơn hàng
/// </summary>
public static class PaymentStatuses
{
    /// <summary>Chưa thanh toán</summary>
    public const string Unpaid = "Unpaid";

    /// <summary>Thanh toán một phần (cọc)</summary>
    public const string PartiallyPaid = "PartiallyPaid";

    /// <summary>Đã thanh toán đủ</summary>
    public const string Paid = "Paid";

    /// <summary>Đã hoàn tiền</summary>
    public const string Refunded = "Refunded";

    public static readonly string[] All =
    [
        Unpaid,
        PartiallyPaid,
        Paid,
        Refunded
    ];

    public static bool IsValid(string? status) =>
        !string.IsNullOrWhiteSpace(status) &&
        All.Contains(status, StringComparer.OrdinalIgnoreCase);

    /// <summary>
    /// Kiểm tra chuyển trạng thái thanh toán có hợp lệ không
    /// </summary>
    public static bool CanTransition(string from, string to)
    {
        if (string.Equals(from, to, StringComparison.OrdinalIgnoreCase))
            return false;

        return (from, to) switch
        {
            (Unpaid, PartiallyPaid) => true,
            (Unpaid, Paid) => true,
            (PartiallyPaid, Paid) => true,
            (Paid, Refunded) => true,
            (PartiallyPaid, Refunded) => true,
            _ => false
        };
    }
}
