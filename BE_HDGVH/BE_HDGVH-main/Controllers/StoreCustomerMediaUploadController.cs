using BE_API.Authorization;
using BE_API.Dto.Common;
using BE_API.Dto.Store;
using BE_API.Service.IService;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Swashbuckle.AspNetCore.Annotations;

namespace BE_API.Controllers;

[ApiController]
[Route("api/store/me/uploads")]
[Authorize(Policy = Policies.CustomerAuthenticated)]
public class StoreCustomerMediaUploadController(IAdminMediaUploadService uploadService) : ControllerBase
{
    [HttpPost]
    [RequestSizeLimit(AdminMediaUploadController.MaxRequestBodyBytes)]
    [RequestFormLimits(MultipartBodyLengthLimit = AdminMediaUploadController.MaxRequestBodyBytes)]
    [Consumes("multipart/form-data")]
    [SwaggerOperation(Summary = "Upload một file (ảnh, pdf, doc/docx) lên Cloudinary cho yêu cầu bảo hành / chứng từ; trả secure URL.")]
    public async Task<IActionResult> Upload(
        IFormFile file,
        CancellationToken cancellationToken = default)
    {
        var customerId = StoreCustomerPrincipal.GetCustomerId(User);
        var subFolder = $"customer-warranty/{customerId}";
        var uploaded = await uploadService.UploadAsync(file, subFolder, cancellationToken);

        var data = new StoreMediaUploadResultDto
        {
            SecureUrl = uploaded.SecureUrl,
            PublicId = uploaded.PublicId,
            ResourceType = uploaded.ResourceType,
            Format = uploaded.Format,
            Bytes = uploaded.Bytes,
            OriginalFileName = uploaded.OriginalFileName
        };

        return Ok(new ResponseDto
        {
            Success = true,
            Data = data,
            Message = "Upload thành công"
        });
    }
}
