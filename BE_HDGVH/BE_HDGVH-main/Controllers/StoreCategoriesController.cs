using BE_API.Dto.Common;
using BE_API.Service.IService;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Swashbuckle.AspNetCore.Annotations;

namespace BE_API.Controllers;

[ApiController]
[Route("api/store/categories")]
[AllowAnonymous]
public class StoreCategoriesController(IStoreCatalogService storeCatalog) : ControllerBase
{
    [HttpGet]
    [SwaggerOperation(Summary = "Cây danh mục (công khai) — menu cửa hàng; mỗi node có ImageUrl nếu đã cấu hình")]
    public async Task<IActionResult> GetTree(CancellationToken cancellationToken = default)
    {
        var data = await storeCatalog.GetCategoryTreeAsync(cancellationToken);
        return Ok(new ResponseDto
        {
            Success = true,
            Data = data,
            Message = "Lấy danh mục thành công"
        });
    }
}
