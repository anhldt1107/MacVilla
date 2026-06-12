using BE_API.Authorization;
using BE_API.Dto.Common;
using BE_API.Dto.ProductAttributeValue;
using BE_API.Service.IService;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Swashbuckle.AspNetCore.Annotations;

namespace BE_API.Controllers;

[ApiController]
[Route("api/admin/products/{productId:int}/attributes/{attributeId:int}/values")]
[Authorize(Policy = Policies.AdminOnly)]
public class AdminProductAttributeValuesController(IProductAttributeValueService valueService) : ControllerBase
{
    [HttpGet]
    [SwaggerOperation(Summary = "Danh sách giá trị của thuộc tính")]
    public async Task<IActionResult> GetList(
        int productId,
        int attributeId,
        CancellationToken cancellationToken = default)
    {
        var data = await valueService.GetListAsync(productId, attributeId, cancellationToken);
        return Ok(new ResponseDto
        {
            Success = true,
            Data = data,
            Message = "Lấy danh sách giá trị thành công"
        });
    }

    [HttpPost]
    [SwaggerOperation(Summary = "Thêm giá trị thuộc tính")]
    public async Task<IActionResult> Create(
        int productId,
        int attributeId,
        [FromBody] ProductAttributeValueCreateDto dto,
        CancellationToken cancellationToken = default)
    {
        var data = await valueService.CreateAsync(productId, attributeId, dto, cancellationToken);
        return Ok(new ResponseDto
        {
            Success = true,
            Data = data,
            Message = "Tạo giá trị thành công"
        });
    }

    [HttpPut("{valueId:int}")]
    [SwaggerOperation(Summary = "Cập nhật giá trị")]
    public async Task<IActionResult> Update(
        int productId,
        int attributeId,
        int valueId,
        [FromBody] ProductAttributeValueUpdateDto dto,
        CancellationToken cancellationToken = default)
    {
        var data = await valueService.UpdateAsync(productId, attributeId, valueId, dto, cancellationToken);
        return Ok(new ResponseDto
        {
            Success = true,
            Data = data,
            Message = "Cập nhật giá trị thành công"
        });
    }

    [HttpDelete("{valueId:int}")]
    [SwaggerOperation(Summary = "Xóa giá trị")]
    public async Task<IActionResult> Delete(
        int productId,
        int attributeId,
        int valueId,
        CancellationToken cancellationToken = default)
    {
        await valueService.DeleteAsync(productId, attributeId, valueId, cancellationToken);
        return Ok(new ResponseDto
        {
            Success = true,
            Message = "Xóa giá trị thành công"
        });
    }
}
