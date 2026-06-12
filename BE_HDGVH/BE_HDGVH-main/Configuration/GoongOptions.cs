namespace BE_API.Configuration;

/// <summary>
/// Cấu hình Goong Maps (Autocomplete). Bind từ section "Goong" + ENV GOONG_*.
/// </summary>
public class GoongOptions
{
    public const string SectionName = "Goong";

    public string ApiKey { get; set; } = string.Empty;

    public string BaseUrl { get; set; } = "https://rsapi.goong.io";

    public int DefaultLimit { get; set; } = 5;

    /// <summary>Tọa độ bias mặc định (lat,lng) khi client không gửi location.</summary>
    public string DefaultLocation { get; set; } = "21.0278,105.8342";

    public bool MoreCompound { get; set; } = true;

    public int RequestTimeoutSeconds { get; set; } = 10;
}
