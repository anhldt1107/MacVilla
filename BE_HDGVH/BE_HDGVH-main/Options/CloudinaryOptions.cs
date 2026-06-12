namespace BE_API.Options;

public class CloudinaryOptions
{
    public const string SectionName = "Cloudinary";

    public string CloudName { get; set; } = "";
    public string ApiKey { get; set; } = "";
    public string ApiSecret { get; set; } = "";

    /// <summary>Thư mục gốc trên Cloudinary (vd. macvilla/admin).</summary>
    public string BaseFolder { get; set; } = "admin";

    /// <summary>Giới hạn kích thước file (bytes), mặc định 15 MB.</summary>
    public long MaxFileBytes { get; set; } = 15 * 1024 * 1024;
}
