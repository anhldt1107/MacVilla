using BE_API.Authorization;
using BE_API.Dto.Common;
using BE_API.Dto.Product;
using BE_API.Service.IService;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Swashbuckle.AspNetCore.Annotations;

namespace BE_API.Controllers;

[ApiController]
[Route("api/admin/products")]
[Authorize(Policy = Policies.AdminOnly)]
public class AdminProductsController(IProductService productService) : ControllerBase
{
    [HttpGet]
    [SwaggerOperation(Summary = "Danh sách sản phẩm (lọc category gồm cả nhánh con theo mặc định, status, search)")]
    public async Task<IActionResult> GetList(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50,
        [FromQuery] int? categoryId = null,
        [FromQuery] bool includeSubcategories = true,
        [FromQuery] string? status = null,
        [FromQuery] string? search = null,
        CancellationToken cancellationToken = default)
    {
        var data = await productService.GetPagedAsync(
            page, pageSize, categoryId, includeSubcategories, status, search, cancellationToken);
        return Ok(new ResponseDto
        {
            Success = true,
            Data = data,
            Message = "Lấy danh sách sản phẩm thành công"
        });
    }

    [HttpGet("{id:int}")]
    [SwaggerOperation(Summary = "Chi tiết sản phẩm: thuộc tính + giá trị, biến thể + tồn kho (nếu có)")]
    public async Task<IActionResult> GetById(int id, CancellationToken cancellationToken = default)
    {
        var data = await productService.GetByIdAsync(id, cancellationToken);
        return Ok(new ResponseDto
        {
            Success = true,
            Data = data,
            Message = "Lấy sản phẩm thành công"
        });
    }

    [HttpPost]
    [SwaggerOperation(Summary = "Tạo sản phẩm (tuỳ chọn ImageUrl — ảnh đại diện catalog)")]
    public async Task<IActionResult> Create([FromBody] ProductCreateDto dto, CancellationToken cancellationToken = default)
    {
        var data = await productService.CreateAsync(dto, cancellationToken);
        return Ok(new ResponseDto
        {
            Success = true,
            Data = data,
            Message = "Tạo sản phẩm thành công"
        });
    }

    [HttpPut("{id:int}")]
    [SwaggerOperation(Summary = "Cập nhật sản phẩm (ImageUrl: bỏ field/null = giữ; \"\" = xóa ảnh đại diện)")]
    public async Task<IActionResult> Update(int id, [FromBody] ProductUpdateDto dto, CancellationToken cancellationToken = default)
    {
        var data = await productService.UpdateAsync(id, dto, cancellationToken);
        return Ok(new ResponseDto
        {
            Success = true,
            Data = data,
            Message = "Cập nhật sản phẩm thành công"
        });
    }

    [HttpDelete("{id:int}")]
    [SwaggerOperation(Summary = "Xóa sản phẩm (chặn nếu variant có trong OrderItem/QuoteItem)")]
    public async Task<IActionResult> Delete(int id, CancellationToken cancellationToken = default)
    {
        await productService.DeleteAsync(id, cancellationToken);
        return Ok(new ResponseDto
        {
            Success = true,
            Message = "Xóa sản phẩm thành công"
        });
    }
}
