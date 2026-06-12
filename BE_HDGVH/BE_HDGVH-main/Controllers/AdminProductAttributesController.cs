using System.Text.Json;
using BE_API.Authorization;
using BE_API.Dto.Common;
using BE_API.Dto.ProductAttribute;
using BE_API.Service.IService;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Swashbuckle.AspNetCore.Annotations;

namespace BE_API.Controllers;

[ApiController]
[Route("api/admin/products/{productId:int}/attributes")]
[Authorize(Policy = Policies.AdminOnly)]
public class AdminProductAttributesController(IProductAttributeService attributeService) : ControllerBase
{
    [HttpGet]
    [SwaggerOperation(Summary = "Danh sách thuộc tính của sản phẩm")]
    public async Task<IActionResult> GetList(int productId, CancellationToken cancellationToken = default)
    {
        var data = await attributeService.GetListAsync(productId, cancellationToken);
        return Ok(new ResponseDto
        {
            Success = true,
            Data = data,
            Message = "Lấy danh sách thuộc tính thành công"
        });
    }

    /// <summary>
    /// Body là object JSON: mỗi key = tên thuộc tính, value = chuỗi hoặc mảng chuỗi.
    /// Chỉ các thuộc tính có trong body được upsert; giá trị của từng thuộc tính được thay thế hoàn toàn theo payload.
    /// </summary>
    [HttpPut("bulk-upsert")]
    [SwaggerOperation(
        Summary = "Bulk upsert thuộc tính & giá trị (partial)",
        Description = "Ví dụ: { \"Kích thước\": \"15x28\", \"Màu\": [\"Đỏ\", \"Xanh\"] }. Thuộc tính không có trong body giữ nguyên.")]
    public async Task<IActionResult> BulkUpsert(
        int productId,
        [FromBody] Dictionary<string, JsonElement>? body,
        CancellationToken cancellationToken = default)
    {
        var data = await attributeService.BulkUpsertAsync(
            productId,
            body ?? new Dictionary<string, JsonElement>(),
            cancellationToken);
        return Ok(new ResponseDto
        {
            Success = true,
            Data = data,
            Message = "Upsert thuộc tính thành công"
        });
    }

    [HttpGet("{id:int}")]
    [SwaggerOperation(Summary = "Chi tiết thuộc tính (kèm danh sách giá trị)")]
    public async Task<IActionResult> GetById(int productId, int id, CancellationToken cancellationToken = default)
    {
        var data = await attributeService.GetByIdAsync(productId, id, cancellationToken);
        return Ok(new ResponseDto
        {
            Success = true,
            Data = data,
            Message = "Lấy thuộc tính thành công"
        });
    }

    [HttpPost]
    [SwaggerOperation(Summary = "Tạo thuộc tính")]
    public async Task<IActionResult> Create(int productId, [FromBody] ProductAttributeCreateDto dto, CancellationToken cancellationToken = default)
    {
        var data = await attributeService.CreateAsync(productId, dto, cancellationToken);
        return Ok(new ResponseDto
        {
            Success = true,
            Data = data,
            Message = "Tạo thuộc tính thành công"
        });
    }

    [HttpPut("{id:int}")]
    [SwaggerOperation(Summary = "Cập nhật tên thuộc tính")]
    public async Task<IActionResult> Update(
        int productId,
        int id,
        [FromBody] ProductAttributeUpdateDto dto,
        CancellationToken cancellationToken = default)
    {
        var data = await attributeService.UpdateAsync(productId, id, dto, cancellationToken);
        return Ok(new ResponseDto
        {
            Success = true,
            Data = data,
            Message = "Cập nhật thuộc tính thành công"
        });
    }

    [HttpDelete("{id:int}")]
    [SwaggerOperation(Summary = "Xóa thuộc tính (cascade xóa các giá trị)")]
    public async Task<IActionResult> Delete(int productId, int id, CancellationToken cancellationToken = default)
    {
        await attributeService.DeleteAsync(productId, id, cancellationToken);
        return Ok(new ResponseDto
        {
            Success = true,
            Message = "Xóa thuộc tính thành công"
        });
    }
}
