namespace BE_API.Dto.Admin;

public class AdminMediaUploadResultDto
{
    public string SecureUrl { get; set; } = "";
    public string PublicId { get; set; } = "";
    public string ResourceType { get; set; } = "";
    public string? Format { get; set; }
    public long Bytes { get; set; }
    public string OriginalFileName { get; set; } = "";
}
