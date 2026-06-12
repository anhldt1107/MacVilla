using BE_API.Authorization;
using BE_API.Dto.Common;
using BE_API.Service.IService;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Swashbuckle.AspNetCore.Annotations;

namespace BE_API.Controllers;

[ApiController]
[Route("api/admin/dashboard/inventory")]
[Authorize(Policy = Policies.WarehouseStaff)]
public class AdminDashboardInventoryController(IDashboardInventoryService inventoryService) : ControllerBase
{
    [HttpGet("overview")]
    [SwaggerOperation(Summary = "KPI tồn kho: SKU active, low stock, on-hand, reserved, on-hand value")]
    public async Task<IActionResult> GetOverview(
        [FromQuery] int defaultThreshold = 10,
        CancellationToken cancellationToken = default)
    {
        var data = await inventoryService.GetOverviewAsync(defaultThreshold, cancellationToken);
        return Ok(new ResponseDto { Success = true, Data = data, Message = "OK" });
    }

    [HttpGet("low-stock")]
    [SwaggerOperation(Summary = "Danh sách SKU dưới ngưỡng (kèm DaysOfCover từ giao dịch OUT trong window)")]
    public async Task<IActionResult> GetLowStock(
        [FromQuery] int threshold = 10,
        [FromQuery] int take = 100,
        [FromQuery] int windowDays = 30,
        CancellationToken cancellationToken = default)
    {
        var data = await inventoryService.GetLowStockAsync(threshold, take, windowDays, cancellationToken);
        return Ok(new ResponseDto { Success = true, Data = data, Message = "OK" });
    }

    [HttpGet("days-of-cover")]
    [SwaggerOperation(Summary = "Days of cover toàn kho — DOC = Available / avgDailyOut(windowDays)")]
    public async Task<IActionResult> GetDaysOfCover(
        [FromQuery] int windowDays = 30,
        [FromQuery] int take = 30,
        CancellationToken cancellationToken = default)
    {
        var data = await inventoryService.GetDaysOfCoverAsync(windowDays, take, cancellationToken);
        return Ok(new ResponseDto { Success = true, Data = data, Message = "OK" });
    }

    [HttpGet("reserve-ratio")]
    [SwaggerOperation(Summary = "Tỷ lệ Reserved/OnHand cao nhất (cảnh báo SKU bị giữ nhiều)")]
    public async Task<IActionResult> GetReserveRatio(
        [FromQuery] int take = 30,
        CancellationToken cancellationToken = default)
    {
        var data = await inventoryService.GetReserveRatioAsync(take, cancellationToken);
        return Ok(new ResponseDto { Success = true, Data = data, Message = "OK" });
    }

    [HttpGet("transactions-trend")]
    [SwaggerOperation(Summary = "Giao dịch kho theo thời gian, group theo TransactionType (stacked bar)")]
    public async Task<IActionResult> GetTransactionsTrend(
        [FromQuery] DateTime? fromDate = null,
        [FromQuery] DateTime? toDate = null,
        [FromQuery] string granularity = "day",
        CancellationToken cancellationToken = default)
    {
        var data = await inventoryService.GetTransactionsTrendAsync(fromDate, toDate, granularity, cancellationToken);
        return Ok(new ResponseDto { Success = true, Data = data, Message = "OK" });
    }

    [HttpGet("top-moving")]
    [SwaggerOperation(Summary = "Top SKU bán chạy theo tổng OUT trong khoảng thời gian")]
    public async Task<IActionResult> GetTopMoving(
        [FromQuery] DateTime? fromDate = null,
        [FromQuery] DateTime? toDate = null,
        [FromQuery] int limit = 10,
        CancellationToken cancellationToken = default)
    {
        var data = await inventoryService.GetTopMovingAsync(fromDate, toDate, limit, cancellationToken);
        return Ok(new ResponseDto { Success = true, Data = data, Message = "OK" });
    }
}
