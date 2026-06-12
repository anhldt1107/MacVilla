using BE_API.Authorization;
using BE_API.Dto.Common;
using BE_API.Service.IService;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Swashbuckle.AspNetCore.Annotations;

namespace BE_API.Controllers;

[ApiController]
[Route("api/admin/dashboard/operations")]
[Authorize(Policy = Policies.WarehouseStaff)]
public class AdminDashboardOperationsController(IDashboardOperationsService operationsService) : ControllerBase
{
    [HttpGet("order-status-breakdown")]
    [SwaggerOperation(Summary = "Phân bố trạng thái đơn hàng (donut)")]
    public async Task<IActionResult> GetOrderStatusBreakdown(
        [FromQuery] DateTime? fromDate = null,
        [FromQuery] DateTime? toDate = null,
        CancellationToken cancellationToken = default)
    {
        var data = await operationsService.GetOrderStatusBreakdownAsync(fromDate, toDate, cancellationToken);
        return Ok(new ResponseDto { Success = true, Data = data, Message = "OK" });
    }

    [HttpGet("fulfillment-status")]
    [SwaggerOperation(Summary = "Phân bố trạng thái phiếu xuất kho (donut)")]
    public async Task<IActionResult> GetFulfillmentStatus(
        [FromQuery] DateTime? fromDate = null,
        [FromQuery] DateTime? toDate = null,
        CancellationToken cancellationToken = default)
    {
        var data = await operationsService.GetFulfillmentStatusAsync(fromDate, toDate, cancellationToken);
        return Ok(new ResponseDto { Success = true, Data = data, Message = "OK" });
    }

    [HttpGet("sla-confirmed-to-shipped")]
    [SwaggerOperation(Summary = "SLA giờ từ Confirmed → Shipped (avg, p50, p90 + histogram)")]
    public async Task<IActionResult> GetSla(
        [FromQuery] DateTime? fromDate = null,
        [FromQuery] DateTime? toDate = null,
        CancellationToken cancellationToken = default)
    {
        var data = await operationsService.GetSlaConfirmedToShippedAsync(fromDate, toDate, cancellationToken);
        return Ok(new ResponseDto { Success = true, Data = data, Message = "OK" });
    }

    [HttpGet("late-orders")]
    [SwaggerOperation(Summary = "Đơn ở Confirmed/Processing/ReadyToShip quá slaHours mà chưa Shipped")]
    public async Task<IActionResult> GetLateOrders(
        [FromQuery] int slaHours = 72,
        CancellationToken cancellationToken = default)
    {
        var data = await operationsService.GetLateOrdersAsync(slaHours, cancellationToken);
        return Ok(new ResponseDto { Success = true, Data = data, Message = "OK" });
    }
}
