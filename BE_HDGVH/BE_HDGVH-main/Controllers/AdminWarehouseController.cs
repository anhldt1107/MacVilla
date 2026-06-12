using BE_API.Authorization;
using BE_API.Dto.Common;
using BE_API.Service.IService;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Swashbuckle.AspNetCore.Annotations;

namespace BE_API.Controllers;

/// <summary>
/// Dashboard / list / cảnh báo cho nhân sự kho (StockManager / Worker / Manager / Admin).
/// Khác với <c>/api/admin/reports/*</c> (ManagerOrAdmin) — endpoint ở đây mở cho cả tổ kho.
/// </summary>
[ApiController]
[Route("api/admin/warehouse")]
[Authorize(Policy = Policies.WarehouseStaff)]
public class AdminWarehouseController(IAdminWarehouseService warehouseService) : ControllerBase
{
    [HttpGet("overview")]
    [SwaggerOperation(Summary = "Tổng quan kho: phiếu xuất theo trạng thái, low/out-of-stock, giao dịch hôm nay, đổi/trả chờ kho, BH active")]
    public async Task<IActionResult> GetOverview(
        [FromQuery] int lowStockThreshold = 10,
        CancellationToken cancellationToken = default)
    {
        var data = await warehouseService.GetOverviewAsync(lowStockThreshold, cancellationToken);
        return Ok(new ResponseDto { Success = true, Data = data, Message = "OK" });
    }

    [HttpGet("low-stock")]
    [SwaggerOperation(Summary = "Danh sách SKU tồn thấp (COALESCE(ReorderPoint, threshold); mirror /reports/low-stock)")]
    public async Task<IActionResult> GetLowStock(
        [FromQuery] int threshold = 10,
        [FromQuery] int take = 100,
        CancellationToken cancellationToken = default)
    {
        var data = await warehouseService.GetLowStockAsync(threshold, take, cancellationToken);
        return Ok(new ResponseDto { Success = true, Data = data, Message = "OK" });
    }

    [HttpGet("inventory")]
    [SwaggerOperation(Summary = "Danh sách tồn cắt ngang toàn kho; onlyBelowThreshold dùng COALESCE(ReorderPoint, threshold)")]
    public async Task<IActionResult> GetInventory(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50,
        [FromQuery] string? search = null,
        [FromQuery] string? warehouseLocation = null,
        [FromQuery] bool onlyOutOfStock = false,
        [FromQuery] bool onlyBelowThreshold = false,
        [FromQuery] int threshold = 10,
        CancellationToken cancellationToken = default)
    {
        var data = await warehouseService.GetInventoryPagedAsync(
            page, pageSize, search, warehouseLocation,
            onlyOutOfStock, onlyBelowThreshold, threshold,
            cancellationToken);
        return Ok(new ResponseDto { Success = true, Data = data, Message = "OK" });
    }
}
