namespace BE_API.Domain;

/// <summary>
/// Hành động xử lý hàng trả về với tồn kho
/// </summary>
public static class InventoryActions
{
    /// <summary>Nhập lại kho (hàng còn tốt)</summary>
    public const string Restock = "Restock";

    /// <summary>Hủy/loại bỏ (hàng hỏng)</summary>
    public const string Dispose = "Dispose";

    /// <summary>Chờ kiểm tra</summary>
    public const string PendingInspection = "PendingInspection";

    public static readonly string[] All =
    [
        Restock,
        Dispose,
        PendingInspection
    ];

    public static bool IsValid(string? action) =>
        !string.IsNullOrWhiteSpace(action) &&
        All.Contains(action, StringComparer.OrdinalIgnoreCase);
}
