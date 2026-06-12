namespace BE_API.Domain;

/// <summary>
/// Loại yêu cầu đổi/trả
/// </summary>
public static class ReturnTypes
{
    /// <summary>Trả hàng - hoàn tiền</summary>
    public const string Return = "Return";

    /// <summary>Đổi hàng - đổi sang sản phẩm khác</summary>
    public const string Exchange = "Exchange";

    public static readonly string[] All =
    [
        Return,
        Exchange
    ];

    public static bool IsValid(string? type) =>
        !string.IsNullOrWhiteSpace(type) &&
        All.Contains(type, StringComparer.OrdinalIgnoreCase);
}
