using BE_API.Authorization;
using BE_API.Dto.Common;
using BE_API.Service.IService;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Swashbuckle.AspNetCore.Annotations;

namespace BE_API.Controllers;

[ApiController]
[Route("api/admin/dashboard/revenue")]
[Authorize(Policy = Policies.ManagerOrAdmin)]
public class AdminDashboardRevenueController(IDashboardRevenueService revenueService) : ControllerBase
{
    [HttpGet("overview")]
    [SwaggerOperation(Summary = "KPI tổng quan doanh thu (net, in, out, orders, AOV, refund rate, new customers)")]
    public async Task<IActionResult> GetOverview(
        [FromQuery] DateTime? fromDate = null,
        [FromQuery] DateTime? toDate = null,
        CancellationToken cancellationToken = default)
    {
        var data = await revenueService.GetOverviewAsync(fromDate, toDate, cancellationToken);
        return Ok(new ResponseDto { Success = true, Data = data, Message = "OK" });
    }

    [HttpGet("timeseries")]
    [SwaggerOperation(Summary = "Doanh thu theo thời gian (granularity day|week|month) — cho line/area chart")]
    public async Task<IActionResult> GetTimeseries(
        [FromQuery] DateTime? fromDate = null,
        [FromQuery] DateTime? toDate = null,
        [FromQuery] string granularity = "day",
        CancellationToken cancellationToken = default)
    {
        var data = await revenueService.GetTimeseriesAsync(fromDate, toDate, granularity, cancellationToken);
        return Ok(new ResponseDto { Success = true, Data = data, Message = "OK" });
    }

    [HttpGet("by-payment-method")]
    [SwaggerOperation(Summary = "Tỷ trọng doanh thu theo phương thức thanh toán (donut)")]
    public async Task<IActionResult> GetByPaymentMethod(
        [FromQuery] DateTime? fromDate = null,
        [FromQuery] DateTime? toDate = null,
        CancellationToken cancellationToken = default)
    {
        var data = await revenueService.GetByPaymentMethodAsync(fromDate, toDate, cancellationToken);
        return Ok(new ResponseDto { Success = true, Data = data, Message = "OK" });
    }

    [HttpGet("by-channel")]
    [SwaggerOperation(Summary = "Doanh thu B2C vs B2B theo thời gian (stacked bar)")]
    public async Task<IActionResult> GetByChannel(
        [FromQuery] DateTime? fromDate = null,
        [FromQuery] DateTime? toDate = null,
        [FromQuery] string granularity = "day",
        CancellationToken cancellationToken = default)
    {
        var data = await revenueService.GetByChannelAsync(fromDate, toDate, granularity, cancellationToken);
        return Ok(new ResponseDto { Success = true, Data = data, Message = "OK" });
    }
}
