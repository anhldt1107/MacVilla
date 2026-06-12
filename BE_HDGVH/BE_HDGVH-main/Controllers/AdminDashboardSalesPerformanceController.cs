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
[Route("api/admin/dashboard/sales-performance")]
[Authorize(Policy = Policies.StaffAuthenticated)]
public class AdminDashboardSalesPerformanceController(IDashboardSalesPerformanceService perfService) : ControllerBase
{
    [HttpGet("top-sales")]
    [Authorize(Policy = Policies.ManagerOrAdmin)]
    [SwaggerOperation(Summary = "Top Sales theo doanh thu (Manager/Admin)")]
    public async Task<IActionResult> GetTopSales(
        [FromQuery] DateTime? fromDate = null,
        [FromQuery] DateTime? toDate = null,
        [FromQuery] int limit = 10,
        CancellationToken cancellationToken = default)
    {
        var data = await perfService.GetTopSalesAsync(fromDate, toDate, limit, cancellationToken);
        return Ok(new ResponseDto { Success = true, Data = data, Message = "OK" });
    }

    [HttpGet("per-sales-detail")]
    [SwaggerOperation(Summary = "KPI cá nhân Sales. Sales chỉ xem được chính mình; Manager/Admin xem mọi salesId")]
    public async Task<IActionResult> GetPerSalesDetail(
        [FromQuery] int? salesId = null,
        [FromQuery] DateTime? fromDate = null,
        [FromQuery] DateTime? toDate = null,
        CancellationToken cancellationToken = default)
    {
        var resolved = ResolveSalesId(salesId);
        if (!resolved.HasValue)
        {
            return BadRequest(new ResponseDto
            {
                Success = false,
                Message = "Vui lòng cung cấp salesId.",
                ErrorCode = "VALIDATION_ERROR"
            });
        }

        var data = await perfService.GetPerSalesDetailAsync(resolved.Value, fromDate, toDate, cancellationToken);
        return Ok(new ResponseDto { Success = true, Data = data, Message = "OK" });
    }

    [HttpGet("quote-conversion-by-sales")]
    [Authorize(Policy = Policies.ManagerOrAdmin)]
    [SwaggerOperation(Summary = "So sánh conversion báo giá → đơn theo từng Sales (Manager/Admin)")]
    public async Task<IActionResult> GetQuoteConversionBySales(
        [FromQuery] DateTime? fromDate = null,
        [FromQuery] DateTime? toDate = null,
        CancellationToken cancellationToken = default)
    {
        var data = await perfService.GetQuoteConversionBySalesAsync(fromDate, toDate, cancellationToken);
        return Ok(new ResponseDto { Success = true, Data = data, Message = "OK" });
    }

    private int? ResolveSalesId(int? requestedSalesId)
    {
        if (IsManagerOrAdmin())
        {
            return requestedSalesId ?? GetCurrentUserId();
        }

        return GetCurrentUserId();
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
