namespace BE_API.Domain;

/// <summary>
/// Loại giao dịch thanh toán
/// </summary>
public static class PaymentTransactionTypes
{
    /// <summary>Thanh toán tiền (thu tiền)</summary>
    public const string Payment = "Payment";

    /// <summary>Hoàn tiền</summary>
    public const string Refund = "Refund";

    /// <summary>Điều chỉnh tăng</summary>
    public const string AdjustmentIncrease = "AdjustmentIncrease";

    /// <summary>Điều chỉnh giảm</summary>
    public const string AdjustmentDecrease = "AdjustmentDecrease";

    public static readonly string[] All =
    [
        Payment,
        Refund,
        AdjustmentIncrease,
        AdjustmentDecrease
    ];

    public static bool IsValid(string? type) =>
        !string.IsNullOrWhiteSpace(type) &&
        All.Contains(type, StringComparer.OrdinalIgnoreCase);

    /// <summary>
    /// Kiểm tra có phải loại ghi tăng tiền không (Payment, AdjustmentIncrease)
    /// </summary>
    public static bool IsIncome(string type) =>
        string.Equals(type, Payment, StringComparison.OrdinalIgnoreCase) ||
        string.Equals(type, AdjustmentIncrease, StringComparison.OrdinalIgnoreCase);

    /// <summary>
    /// Kiểm tra có phải loại ghi giảm tiền không (Refund, AdjustmentDecrease)
    /// </summary>
    public static bool IsOutcome(string type) =>
        string.Equals(type, Refund, StringComparison.OrdinalIgnoreCase) ||
        string.Equals(type, AdjustmentDecrease, StringComparison.OrdinalIgnoreCase);
}
