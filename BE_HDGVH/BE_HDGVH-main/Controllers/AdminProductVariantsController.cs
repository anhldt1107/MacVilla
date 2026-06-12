using BE_API.Authorization;
using BE_API.Dto.Common;
using BE_API.Dto.ProductVariant;
using BE_API.Service.IService;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Swashbuckle.AspNetCore.Annotations;

namespace BE_API.Controllers;

[ApiController]
[Route("api/admin/products/{productId:int}/variants")]
[Authorize(Policy = Policies.AdminOnly)]
public class AdminProductVariantsController(IProductVariantService variantService) : ControllerBase
{
    [HttpGet]
    [SwaggerOperation(Summary = "Danh sách biến thể (SKU) của sản phẩm")]
    public async Task<IActionResult> GetList(int productId, CancellationToken cancellationToken = default)
    {
        var data = await variantService.GetListByProductAsync(productId, cancellationToken);
        return Ok(new ResponseDto
        {
            Success = true,
            Data = data,
            Message = "Lấy danh sách biến thể thành công"
        });
    }

    [HttpGet("{id:int}")]
    [SwaggerOperation(Summary = "Chi tiết biến thể")]
    public async Task<IActionResult> GetById(int productId, int id, CancellationToken cancellationToken = default)
    {
        var data = await variantService.GetByIdAsync(productId, id, cancellationToken);
        return Ok(new ResponseDto
        {
            Success = true,
            Data = data,
            Message = "Lấy biến thể thành công"
        });
    }

    [HttpPost]
    [SwaggerOperation(Summary = "Tạo biến thể")]
    public async Task<IActionResult> Create(
        int productId,
        [FromBody] ProductVariantCreateDto dto,
        CancellationToken cancellationToken = default)
    {
        var data = await variantService.CreateAsync(productId, dto, cancellationToken);
        return Ok(new ResponseDto
        {
            Success = true,
            Data = data,
            Message = "Tạo biến thể thành công"
        });
    }

    [HttpPut("{id:int}")]
    [SwaggerOperation(Summary = "Cập nhật biến thể (SKU vẫn kiểm tra unique)")]
    public async Task<IActionResult> Update(
        int productId,
        int id,
        [FromBody] ProductVariantUpdateDto dto,
        CancellationToken cancellationToken = default)
    {
        var data = await variantService.UpdateAsync(productId, id, dto, cancellationToken);
        return Ok(new ResponseDto
        {
            Success = true,
            Data = data,
            Message = "Cập nhật biến thể thành công"
        });
    }

    [HttpDelete("{id:int}")]
    [SwaggerOperation(Summary = "Xóa biến thể (chặn nếu có trong đơn/báo giá)")]
    public async Task<IActionResult> Delete(int productId, int id, CancellationToken cancellationToken = default)
    {
        await variantService.DeleteAsync(productId, id, cancellationToken);
        return Ok(new ResponseDto
        {
            Success = true,
            Message = "Xóa biến thể thành công"
        });
    }
}
