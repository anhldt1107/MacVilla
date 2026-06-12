namespace BE_API.Domain;

/// <summary>
/// Trạng thái phiếu bảo hành
/// </summary>
public static class WarrantyTicketStatuses
{
    /// <summary>Đang hoạt động - còn hạn bảo hành</summary>
    public const string Active = "Active";

    /// <summary>Hết hạn bảo hành</summary>
    public const string Expired = "Expired";

    /// <summary>Đã vô hiệu hóa (do đổi/trả hàng)</summary>
    public const string Voided = "Voided";

    public static readonly string[] All =
    [
        Active,
        Expired,
        Voided
    ];

    public static bool IsValid(string? status) =>
        !string.IsNullOrWhiteSpace(status) &&
        All.Contains(status, StringComparer.OrdinalIgnoreCase);

    /// <summary>
    /// Kiểm tra có thể tạo yêu cầu bảo hành không
    /// </summary>
    public static bool CanCreateClaim(string status) =>
        string.Equals(status, Active, StringComparison.OrdinalIgnoreCase);
}
