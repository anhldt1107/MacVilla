namespace BE_API.Domain;

/// <summary>Loại giao dịch kho: IN (nhập), OUT (xuất), ADJUST (điều chỉnh), RESERVE (giữ hàng), RELEASE (trả reserve).</summary>
public static class TransactionTypes
{
    public const string In = "IN";
    public const string Out = "OUT";
    public const string Adjust = "ADJUST";
    public const string Reserve = "RESERVE";
    public const string Release = "RELEASE";

    public static readonly string[] All = [In, Out, Adjust, Reserve, Release];

    public static bool IsValid(string? transactionType)
        => !string.IsNullOrWhiteSpace(transactionType) && All.Contains(transactionType, StringComparer.OrdinalIgnoreCase);
}
