using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using BE_API.Authorization;
using BE_API.Dto.Common;
using BE_API.Service.IService;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Swashbuckle.AspNetCore.Annotations;

namespace BE_API.Controllers;

[ApiController]
[Route("api/admin/dashboard/sales-pipeline")]
[Authorize(Policy = Policies.StaffAuthenticated)]
public class AdminDashboardSalesPipelineController(IDashboardSalesPipelineService pipelineService) : ControllerBase
{
    [HttpGet("funnel")]
    [SwaggerOperation(Summary = "Funnel báo giá theo status (Sales chỉ thấy bản thân, Manager/Admin thấy tất cả)")]
    public async Task<IActionResult> GetFunnel(
        [FromQuery] DateTime? fromDate = null,
        [FromQuery] DateTime? toDate = null,
        [FromQuery] int? salesId = null,
        CancellationToken cancellationToken = default)
    {
        var effectiveSalesId = ResolveSalesId(salesId);
        var data = await pipelineService.GetFunnelAsync(fromDate, toDate, effectiveSalesId, cancellationToken);
        return Ok(new ResponseDto { Success = true, Data = data, Message = "OK" });
    }

    [HttpGet("conversion")]
    [SwaggerOperation(Summary = "KPI conversion báo giá → đơn (rate, avg ngày)")]
    public async Task<IActionResult> GetConversion(
        [FromQuery] DateTime? fromDate = null,
        [FromQuery] DateTime? toDate = null,
        [FromQuery] int? salesId = null,
        CancellationToken cancellationToken = default)
    {
        var effectiveSalesId = ResolveSalesId(salesId);
        var data = await pipelineService.GetConversionAsync(fromDate, toDate, effectiveSalesId, cancellationToken);
        return Ok(new ResponseDto { Success = true, Data = data, Message = "OK" });
    }

    [HttpGet("time-in-stage")]
    [SwaggerOperation(Summary = "Trung bình số ngày ở từng giai đoạn báo giá")]
    public async Task<IActionResult> GetTimeInStage(
        [FromQuery] DateTime? fromDate = null,
        [FromQuery] DateTime? toDate = null,
        [FromQuery] int? salesId = null,
        CancellationToken cancellationToken = default)
    {
        var effectiveSalesId = ResolveSalesId(salesId);
        var data = await pipelineService.GetTimeInStageAsync(fromDate, toDate, effectiveSalesId, cancellationToken);
        return Ok(new ResponseDto { Success = true, Data = data, Message = "OK" });
    }

    [HttpGet("expiring-soon")]
    [SwaggerOperation(Summary = "Báo giá Approved sắp hết hạn (within N ngày tới)")]
    public async Task<IActionResult> GetExpiringSoon(
        [FromQuery] int days = 7,
        [FromQuery] int? salesId = null,
        CancellationToken cancellationToken = default)
    {
        var effectiveSalesId = ResolveSalesId(salesId);
        var data = await pipelineService.GetExpiringSoonAsync(days, effectiveSalesId, cancellationToken);
        return Ok(new ResponseDto { Success = true, Data = data, Message = "OK" });
    }

    /// <summary>
    /// Manager/Admin: dùng salesId truyền vào (null = tất cả).
    /// Role khác (Sales/StockManager/Worker): bị buộc filter theo salesId của chính mình.
    /// </summary>
    private int? ResolveSalesId(int? requestedSalesId)
    {
        if (IsManagerOrAdmin()) return requestedSalesId;

        var callerId = GetCurrentUserId();
        return callerId;
    }

    private bool IsManagerOrAdmin()
    {
        var role = User.FindFirst(JwtClaimTypes.Role)?.Value ?? string.Empty;
        return string.Equals(role, AppRoles.Admin, StringComparison.OrdinalIgnoreCase)
               || string.Equals(role, AppRoles.Manager, StringComparison.OrdinalIgnoreCase);
    }

    private int? GetCurrentUserId()
    {
        var sub = User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value
                  ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return int.TryParse(sub, out var id) ? id : null;
    }
}
