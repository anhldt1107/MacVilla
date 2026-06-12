using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using BE_API.Authorization;
using BE_API.Domain;
using BE_API.Dto.Common;
using BE_API.Dto.Fulfillment;
using BE_API.Service.IService;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Swashbuckle.AspNetCore.Annotations;

namespace BE_API.Controllers;

[ApiController]
[Route("api/admin/fulfillments")]
public class AdminFulfillmentsController(IAdminFulfillmentService fulfillmentService) : ControllerBase
{
    /// <summary>
    /// F1: Danh sách phiếu xuất kho (filter: status, orderId, assignedWorkerId)
    /// </summary>
    [HttpGet]
    [Authorize(Policy = Policies.StaffAuthenticated)]
    [SwaggerOperation(Summary = "Danh sách phiếu xuất kho (StaffAuthenticated — Sales xem được; filter orderId, …)")]
    public async Task<IActionResult> GetList(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? status = null,
        [FromQuery] int? orderId = null,
        [FromQuery] int? assignedWorkerId = null,
        CancellationToken cancellationToken = default)
    {
        var data = await fulfillmentService.GetPagedAsync(page, pageSize, status, orderId, assignedWorkerId, cancellationToken);
        return Ok(new ResponseDto
        {
            Success = true,
            Data = data,
            Message = "Lấy danh sách phiếu xuất kho thành công"
        });
    }

    /// <summary>
    /// F2: Chi tiết phiếu xuất kho + đơn hàng
    /// </summary>
    [HttpGet("{id:int}")]
    [Authorize(Policy = Policies.StaffAuthenticated)]
    [SwaggerOperation(Summary = "Chi tiết phiếu xuất kho + đơn hàng (StaffAuthenticated)")]
    public async Task<IActionResult> GetById(int id, CancellationToken cancellationToken = default)
    {
        var data = await fulfillmentService.GetByIdAsync(id, cancellationToken);
        return Ok(new ResponseDto
        {
            Success = true,
            Data = data,
            Message = "Lấy chi tiết phiếu xuất kho thành công"
        });
    }

    /// <summary>
    /// F5: Cập nhật trạng thái phiếu (Pending → Picking → Packed → Shipped)
    /// </summary>
    [HttpPut("{id:int}/status")]
    [Authorize(Policy = Policies.WarehouseStaff)]
    [SwaggerOperation(Summary = "Cập nhật trạng thái phiếu (Pending → Picking → Packed → Shipped)")]
    public async Task<IActionResult> UpdateStatus(
        int id,
        [FromBody] FulfillmentUpdateStatusDto dto,
        CancellationToken cancellationToken = default)
    {
        var data = await fulfillmentService.UpdateStatusAsync(id, dto, cancellationToken);
        return Ok(new ResponseDto
        {
            Success = true,
            Data = data,
            Message = "Cập nhật trạng thái phiếu xuất kho thành công"
        });
    }

    /// <summary>
    /// F4: Gán Worker cho phiếu xuất kho
    /// </summary>
    [HttpPut("{id:int}/assign")]
    [Authorize(Policy = Policies.WarehouseStaff)]
    [SwaggerOperation(Summary = "Gán Worker cho phiếu xuất kho")]
    public async Task<IActionResult> AssignWorker(
        int id,
        [FromBody] FulfillmentAssignWorkerDto dto,
        CancellationToken cancellationToken = default)
    {
        var data = await fulfillmentService.AssignWorkerAsync(id, dto, cancellationToken);
        return Ok(new ResponseDto
        {
            Success = true,
            Data = data,
            Message = "Gán Worker thành công"
        });
    }

    /// <summary>
    /// Lấy danh sách các trạng thái phiếu xuất kho
    /// </summary>
    [HttpGet("statuses")]
    [Authorize(Policy = Policies.StaffAuthenticated)]
    [SwaggerOperation(Summary = "Danh sách các trạng thái phiếu xuất kho (StaffAuthenticated)")]
    public IActionResult GetStatuses()
    {
        return Ok(new ResponseDto
        {
            Success = true,
            Data = FulfillmentStatuses.All,
            Message = "OK"
        });
    }

    private int? GetCurrentUserId()
    {
        var sub = User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value
                  ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return int.TryParse(sub, out var id) ? id : null;
    }
}

/// <summary>
/// Controller riêng để tạo phiếu xuất kho theo route /api/admin/orders/{orderId}/fulfillments
/// </summary>
[ApiController]
[Route("api/admin/orders/{orderId:int}/fulfillments")]
[Authorize(Policy = Policies.WarehouseStaff)]
public class AdminOrderFulfillmentsController(IAdminFulfillmentService fulfillmentService) : ControllerBase
{
    /// <summary>
    /// F3: Tạo phiếu xuất kho cho đơn hàng
    /// </summary>
    [HttpPost]
    [SwaggerOperation(Summary = "Tạo phiếu xuất kho cho đơn hàng")]
    public async Task<IActionResult> Create(
        int orderId,
        [FromBody] FulfillmentCreateDto dto,
        CancellationToken cancellationToken = default)
    {
        var userId = GetCurrentUserId()
            ?? throw new UnauthorizedAccessException("Không xác định được người dùng hiện tại");

        var data = await fulfillmentService.CreateAsync(orderId, dto, userId, cancellationToken);
        return Ok(new ResponseDto
        {
            Success = true,
            Data = data,
            Message = "Tạo phiếu xuất kho thành công"
        });
    }

    private int? GetCurrentUserId()
    {
        var sub = User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value
                  ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return int.TryParse(sub, out var id) ? id : null;
    }
}
