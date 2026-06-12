using BE_API.Authorization;
using BE_API.Dto.Common;
using BE_API.Dto.Inventory;
using BE_API.Service.IService;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Swashbuckle.AspNetCore.Annotations;

namespace BE_API.Controllers;

[ApiController]
[Route("api/admin/products/{productId:int}/variants/{variantId:int}/inventory")]
[Authorize(Policy = Policies.WarehouseStaff)]
public class AdminInventoryController(IInventoryService inventoryService) : ControllerBase
{
    [HttpGet]
    [SwaggerOperation(Summary = "Lấy bản ghi tồn kho (404 nếu chưa khởi tạo)")]
    public async Task<IActionResult> Get(int productId, int variantId, CancellationToken cancellationToken = default)
    {
        var data = await inventoryService.GetAsync(productId, variantId, cancellationToken);
        return Ok(new ResponseDto
        {
            Success = true,
            Data = data,
            Message = "Lấy tồn kho thành công"
        });
    }

    [HttpPut]
    [SwaggerOperation(Summary = "Upsert tồn kho (tạo hoặc cập nhật); quantityAvailable = onHand − reserved")]
    public async Task<IActionResult> Upsert(
        int productId,
        int variantId,
        [FromBody] InventoryUpsertDto dto,
        CancellationToken cancellationToken = default)
    {
        var data = await inventoryService.UpsertAsync(productId, variantId, dto, cancellationToken);
        return Ok(new ResponseDto
        {
            Success = true,
            Data = data,
            Message = "Lưu tồn kho thành công"
        });
    }

    [HttpPost]
    [SwaggerOperation(Summary = "Tạo tồn kho lần đầu (409 nếu đã tồn tại)")]
    public async Task<IActionResult> Create(
        int productId,
        int variantId,
        [FromBody] InventoryUpsertDto dto,
        CancellationToken cancellationToken = default)
    {
        var data = await inventoryService.CreateIfNotExistsAsync(productId, variantId, dto, cancellationToken);
        return Ok(new ResponseDto
        {
            Success = true,
            Data = data,
            Message = "Tạo tồn kho thành công"
        });
    }

    [HttpPut("reorder-policy")]
    [SwaggerOperation(Summary = "Cập nhật ReorderPoint / SafetyStock (null = xóa); không đổi số lượng tồn")]
    public async Task<IActionResult> PutReorderPolicy(
        int productId,
        int variantId,
        [FromBody] InventoryReorderPolicyDto dto,
        CancellationToken cancellationToken = default)
    {
        var data = await inventoryService.UpdateReorderPolicyAsync(productId, variantId, dto, cancellationToken);
        return Ok(new ResponseDto
        {
            Success = true,
            Data = data,
            Message = "Cập nhật chính sách đặt hàng lại thành công"
        });
    }
}
