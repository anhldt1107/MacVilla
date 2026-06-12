using BE_API.Authorization;
using BE_API.Dto.Common;
using BE_API.Service.IService;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Swashbuckle.AspNetCore.Annotations;

namespace BE_API.Controllers;

[ApiController]
[Route("api/admin/reports")]
[Authorize(Policy = Policies.ManagerOrAdmin)]
public class AdminReportsController(IAdminReportService reportService) : ControllerBase
{
    /// <summary>
    /// Tổng quan kinh doanh (doanh thu thu ròng, đơn, khách mới, báo giá chờ duyệt, CK chờ đối soát, công nợ quá hạn).
    /// </summary>
    [HttpGet("sales-overview")]
    [SwaggerOperation(Summary = "Dashboard Manager: tổng quan kinh doanh theo khoảng thời gian")]
    public async Task<IActionResult> GetSalesOverview(
        [FromQuery] DateTime? fromDate = null,
        [FromQuery] DateTime? toDate = null,
        CancellationToken cancellationToken = default)
    {
        var data = await reportService.GetSalesOverviewAsync(fromDate, toDate, cancellationToken);
        return Ok(new ResponseDto { Success = true, Data = data, Message = "OK" });
    }

    /// <summary>
    /// Danh sách SKU có tồn khả dụng thấp (<= threshold) — cảnh báo bổ sung hàng.
    /// </summary>
    [HttpGet("low-stock")]
    [SwaggerOperation(Summary = "Danh sách SKU tồn thấp (QuantityAvailable <= COALESCE(ReorderPoint, threshold))")]
    public async Task<IActionResult> GetLowStock(
        [FromQuery] int threshold = 10,
        [FromQuery] int take = 100,
        CancellationToken cancellationToken = default)
    {
        var data = await reportService.GetLowStockAsync(threshold, take, cancellationToken);
        return Ok(new ResponseDto { Success = true, Data = data, Message = "OK" });
    }

    /// <summary>
    /// Xếp hạng Sales theo doanh thu đơn (loại Cancelled).
    /// </summary>
    [HttpGet("top-sales")]
    [SwaggerOperation(Summary = "Top Sales theo doanh thu trong khoảng thời gian")]
    public async Task<IActionResult> GetTopSales(
        [FromQuery] DateTime? fromDate = null,
        [FromQuery] DateTime? toDate = null,
        [FromQuery] int limit = 10,
        CancellationToken cancellationToken = default)
    {
        var data = await reportService.GetTopSalesAsync(fromDate, toDate, limit, cancellationToken);
        return Ok(new ResponseDto { Success = true, Data = data, Message = "OK" });
    }
}
