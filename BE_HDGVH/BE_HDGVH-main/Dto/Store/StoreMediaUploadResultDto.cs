namespace BE_API.Dto.Store;

/// <summary>Kết quả upload file (ảnh, pdf, doc) cho khách B2C — cùng semantic với admin, tách DTO để contract store không phụ thuộc namespace Admin.</summary>
public class StoreMediaUploadResultDto
{
    public string SecureUrl { get; set; } = "";
    public string PublicId { get; set; } = "";
    public string ResourceType { get; set; } = "";
    public string? Format { get; set; }
    public long Bytes { get; set; }
    public string OriginalFileName { get; set; } = "";
}
