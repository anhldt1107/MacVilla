namespace BE_API.Options;

/// <summary>Cấu hình tích hợp payOS (kênh thanh toán). Xem https://payos.vn/docs/api/</summary>
public class PayOsAppOptions
{
    public const string SectionName = "PayOs";

    public string ClientId { get; set; } = "";
    public string ApiKey { get; set; } = "";
    public string ChecksumKey { get; set; } = "";
    public string? PartnerCode { get; set; }

    /// <summary>URL mặc định khi khách hoàn tất thanh toán (FE có thể ghi đè trong body P1).</summary>
    public string ReturnUrl { get; set; } = "";

    /// <summary>URL mặc định khi khách hủy trên cổng payOS.</summary>
    public string CancelUrl { get; set; } = "";

    /// <summary>Thời sống link (phút), truyền vào payOS <c>expiredAt</c>.</summary>
    public int LinkLifetimeMinutes { get; set; } = 24 * 60;
}
