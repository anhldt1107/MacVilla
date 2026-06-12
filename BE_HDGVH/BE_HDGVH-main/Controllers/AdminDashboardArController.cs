using BE_API.Authorization;
using BE_API.Dto.Common;
using BE_API.Service.IService;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Swashbuckle.AspNetCore.Annotations;

namespace BE_API.Controllers;

[ApiController]
[Route("api/admin/dashboard/ar")]
[Authorize(Policy = Policies.ManagerOrAdmin)]
public class AdminDashboardArController(IDashboardArService arService) : ControllerBase
{
    [HttpGet("summary")]
    [SwaggerOperation(Summary = "KPI công nợ: unpaid, overdue, due-soon")]
    public async Task<IActionResult> GetSummary(
        [FromQuery] int dueSoonDays = 7,
        CancellationToken cancellationToken = default)
    {
        var data = await arService.GetSummaryAsync(dueSoonDays, cancellationToken);
        return Ok(new ResponseDto { Success = true, Data = data, Message = "OK" });
    }

    [HttpGet("aging")]
    [SwaggerOperation(Summary = "Aging buckets công nợ (Current, 1-30, 31-60, 61-90, >90)")]
    public async Task<IActionResult> GetAging(CancellationToken cancellationToken = default)
    {
        var data = await arService.GetAgingAsync(cancellationToken);
        return Ok(new ResponseDto { Success = true, Data = data, Message = "OK" });
    }

    [HttpGet("top-debtors")]
    [SwaggerOperation(Summary = "Top khách nợ (Remaining giảm dần)")]
    public async Task<IActionResult> GetTopDebtors(
        [FromQuery] int limit = 10,
        CancellationToken cancellationToken = default)
    {
        var data = await arService.GetTopDebtorsAsync(limit, cancellationToken);
        return Ok(new ResponseDto { Success = true, Data = data, Message = "OK" });
    }

    [HttpGet("timeseries")]
    [SwaggerOperation(Summary = "Tổng dư nợ và nợ quá hạn theo thời gian (snapshot end-of-bucket)")]
    public async Task<IActionResult> GetTimeseries(
        [FromQuery] DateTime? fromDate = null,
        [FromQuery] DateTime? toDate = null,
        [FromQuery] string granularity = "day",
        CancellationToken cancellationToken = default)
    {
        var data = await arService.GetTimeseriesAsync(fromDate, toDate, granularity, cancellationToken);
        return Ok(new ResponseDto { Success = true, Data = data, Message = "OK" });
    }
}
