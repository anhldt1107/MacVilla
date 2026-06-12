using BE_API.Dto.Admin;
using Microsoft.AspNetCore.Http;

namespace BE_API.Service.IService;

public interface IAdminMediaUploadService
{
    /// <summary>Upload ảnh (jpg/png/gif/webp) hoặc raw (pdf, doc, docx) lên Cloudinary.</summary>
    Task<AdminMediaUploadResultDto> UploadAsync(
        IFormFile file,
        string? subFolder,
        CancellationToken cancellationToken = default);
}
