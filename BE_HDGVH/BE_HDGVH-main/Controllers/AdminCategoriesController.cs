using BE_API.Authorization;
using BE_API.Dto.Category;
using BE_API.Dto.Common;
using BE_API.Service.IService;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Swashbuckle.AspNetCore.Annotations;

namespace BE_API.Controllers;

[ApiController]
[Route("api/admin/categories")]
[Authorize(Policy = Policies.AdminOnly)]
public class AdminCategoriesController(ICategoryService categoryService) : ControllerBase
{
    [HttpGet]
    [SwaggerOperation(Summary = "Danh sách danh mục (phân trang, lọc parentId hoặc chỉ gốc)")]
    public async Task<IActionResult> GetList(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50,
        [FromQuery] int? parentId = null,
        [FromQuery] bool rootsOnly = false,
        CancellationToken cancellationToken = default)
    {
        var data = await categoryService.GetPagedAsync(page, pageSize, parentId, rootsOnly, cancellationToken);
        return Ok(new ResponseDto
        {
            Success = true,
            Data = data,
            Message = "Lấy danh sách danh mục thành công"
        });
    }

    [HttpGet("tree")]
    [SwaggerOperation(Summary = "Cây danh mục (nested)")]
    public async Task<IActionResult> GetTree(CancellationToken cancellationToken = default)
    {
        var data = await categoryService.GetTreeAsync(cancellationToken);
        return Ok(new ResponseDto
        {
            Success = true,
            Data = data,
            Message = "Lấy cây danh mục thành công"
        });
    }

    [HttpGet("{id:int}")]
    [SwaggerOperation(Summary = "Chi tiết danh mục")]
    public async Task<IActionResult> GetById(int id, CancellationToken cancellationToken = default)
    {
        var data = await categoryService.GetByIdAsync(id, cancellationToken);
        return Ok(new ResponseDto
        {
            Success = true,
            Data = data,
            Message = "Lấy danh mục thành công"
        });
    }

    [HttpPost]
    [SwaggerOperation(Summary = "Tạo danh mục (tuỳ chọn ImageUrl — link ảnh đại diện)")]
    public async Task<IActionResult> Create([FromBody] CategoryCreateDto dto, CancellationToken cancellationToken = default)
    {
        var data = await categoryService.CreateAsync(dto, cancellationToken);
        return Ok(new ResponseDto
        {
            Success = true,
            Data = data,
            Message = "Tạo danh mục thành công"
        });
    }

    [HttpPut("{id:int}")]
    [SwaggerOperation(Summary = "Cập nhật danh mục (ImageUrl: bỏ field/null = giữ nguyên; \"\" = xóa ảnh)")]
    public async Task<IActionResult> Update(int id, [FromBody] CategoryUpdateDto dto, CancellationToken cancellationToken = default)
    {
        var data = await categoryService.UpdateAsync(id, dto, cancellationToken);
        return Ok(new ResponseDto
        {
            Success = true,
            Data = data,
            Message = "Cập nhật danh mục thành công"
        });
    }

    [HttpDelete("{id:int}")]
    [SwaggerOperation(Summary = "Xóa danh mục (không có con và không có sản phẩm)")]
    public async Task<IActionResult> Delete(int id, CancellationToken cancellationToken = default)
    {
        await categoryService.DeleteAsync(id, cancellationToken);
        return Ok(new ResponseDto
        {
            Success = true,
            Message = "Xóa danh mục thành công"
        });
    }
}
