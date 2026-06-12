using BE_API.Authorization;
using BE_API.Dto.Common;
using BE_API.Service.IService;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Swashbuckle.AspNetCore.Annotations;

namespace BE_API.Controllers;

[ApiController]
[Route("api/admin/uploads")]
[Authorize(Policy = Policies.StaffAuthenticated)]
public class AdminMediaUploadController(IAdminMediaUploadService uploadService) : ControllerBase
{
    /// <summary>Giới hạn body multipart (ảnh / pdf / word).</summary>
    public const long MaxRequestBodyBytes = 30 * 1024 * 1024;

    [HttpPost]
    [RequestSizeLimit(MaxRequestBodyBytes)]
    [RequestFormLimits(MultipartBodyLengthLimit = MaxRequestBodyBytes)]
    [Consumes("multipart/form-data")]
    [SwaggerOperation(Summary = "Upload file (ảnh, pdf, doc/docx) lên Cloudinary; trả secure URL dùng cho ImageUrl / tài liệu")]
    public async Task<IActionResult> Upload(
        // Không gắn [FromForm] cho IFormFile — Swashbuckle 9 ném SwaggerGeneratorException, swagger.json trả 500.
        IFormFile file,
        [FromQuery] string? folder = null,
        CancellationToken cancellationToken = default)
    {
        if (!AdminMediaUploadAuthorization.CanUpload(User, folder))
            return Forbid();

        var data = await uploadService.UploadAsync(file, folder, cancellationToken);
        return Ok(new ResponseDto
        {
            Success = true,
            Data = data,
            Message = "Upload thành công"
        });
    }
}
