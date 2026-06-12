using BE_API.Authorization;
using BE_API.Domain;
using BE_API.Dto.Admin;
using BE_API.Dto.Common;
using BE_API.Service.IService;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Swashbuckle.AspNetCore.Annotations;
using System.Security.Claims;

namespace BE_API.Controllers;

[ApiController]
[Route("api/admin/returns")]
[Authorize(Policy = Policies.StaffAuthenticated)]
public class AdminReturnsController(IAdminReturnService returnService) : ControllerBase
{
    [HttpGet]
    [SwaggerOperation(Summary = "Danh sách yêu cầu đổi/trả (filter: status, type, customerId, orderId, fromDate, toDate, search)")]
    public async Task<IActionResult> GetList(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? status = null,
        [FromQuery] string? type = null,
        [FromQuery] int? customerId = null,
        [FromQuery] int? orderId = null,
        [FromQuery] DateTime? fromDate = null,
        [FromQuery] DateTime? toDate = null,
        [FromQuery] string? search = null,
        CancellationToken cancellationToken = default)
    {
        var data = await returnService.GetPagedAsync(
            page, pageSize, status, type, customerId, orderId,
            fromDate, toDate, search, cancellationToken);

        return Ok(new ResponseDto
        {
            Success = true,
            Data = data,
            Message = "Lấy danh sách phiếu đổi/trả thành công"
        });
    }

    [HttpGet("{id:int}")]
    [SwaggerOperation(Summary = "Chi tiết yêu cầu đổi/trả theo ID")]
    public async Task<IActionResult> GetById(int id, CancellationToken cancellationToken = default)
    {
        var data = await returnService.GetByIdAsync(id, cancellationToken);
        return Ok(new ResponseDto
        {
            Success = true,
            Data = data,
            Message = "Lấy chi tiết phiếu đổi/trả thành công"
        });
    }

    [HttpGet("by-number/{ticketNumber}")]
    [SwaggerOperation(Summary = "Chi tiết yêu cầu đổi/trả theo mã phiếu")]
    public async Task<IActionResult> GetByTicketNumber(string ticketNumber, CancellationToken cancellationToken = default)
    {
        var data = await returnService.GetByTicketNumberAsync(ticketNumber, cancellationToken);
        return Ok(new ResponseDto
        {
            Success = true,
            Data = data,
            Message = "Lấy chi tiết phiếu đổi/trả thành công"
        });
    }

    [HttpPost]
    [SwaggerOperation(Summary = "Tạo yêu cầu đổi/trả")]
    public async Task<IActionResult> Create(
        [FromBody] AdminReturnCreateDto dto,
        CancellationToken cancellationToken = default)
    {
        var data = await returnService.CreateAsync(dto, cancellationToken);
        return Ok(new ResponseDto
        {
            Success = true,
            Data = data,
            Message = "Tạo phiếu đổi/trả thành công"
        });
    }

    [HttpPut("{id:int}/approve")]
    [Authorize(Policy = Policies.ManagerOrAdmin)]
    [SwaggerOperation(Summary = "Manager/Admin duyệt yêu cầu đổi/trả")]
    public async Task<IActionResult> Approve(
        int id,
        [FromBody] AdminReturnApproveDto dto,
        CancellationToken cancellationToken = default)
    {
        var managerId = GetCurrentUserId();
        var data = await returnService.ApproveAsync(id, managerId, dto, cancellationToken);
        return Ok(new ResponseDto
        {
            Success = true,
            Data = data,
            Message = "Duyệt phiếu đổi/trả thành công"
        });
    }

    [HttpPut("{id:int}/reject")]
    [Authorize(Policy = Policies.ManagerOrAdmin)]
    [SwaggerOperation(Summary = "Manager/Admin từ chối yêu cầu đổi/trả")]
    public async Task<IActionResult> Reject(
        int id,
        [FromBody] AdminReturnRejectDto dto,
        CancellationToken cancellationToken = default)
    {
        var managerId = GetCurrentUserId();
        var data = await returnService.RejectAsync(id, managerId, dto, cancellationToken);
        return Ok(new ResponseDto
        {
            Success = true,
            Data = data,
            Message = "Từ chối phiếu đổi/trả thành công"
        });
    }

    [HttpPut("{id:int}/start-processing")]
    [Authorize(Policy = Policies.WarehouseStaff)]
    [SwaggerOperation(Summary = "Bắt đầu thu hồi hàng (Approved → Processing)")]
    public async Task<IActionResult> StartProcessing(
        int id,
        [FromBody] AdminReturnTransitionDto dto,
        CancellationToken cancellationToken = default)
    {
        var staffId = GetCurrentUserId();
        var data = await returnService.StartProcessingAsync(id, staffId, dto, cancellationToken);
        return Ok(new ResponseDto { Success = true, Data = data, Message = "Đã bắt đầu thu hồi hàng" });
    }

    [HttpPut("{id:int}/receive-items")]
    [Authorize(Policy = Policies.WarehouseStaff)]
    [SwaggerOperation(Summary = "Xác nhận đã nhận hàng (Processing → ItemsReceived)")]
    public async Task<IActionResult> ReceiveItems(
        int id,
        [FromBody] AdminReturnTransitionDto dto,
        CancellationToken cancellationToken = default)
    {
        var staffId = GetCurrentUserId();
        var data = await returnService.ReceiveItemsAsync(id, staffId, dto, cancellationToken);
        return Ok(new ResponseDto { Success = true, Data = data, Message = "Đã xác nhận nhận hàng" });
    }

    [HttpPut("{id:int}/cancel")]
    [SwaggerOperation(Summary = "Hủy phiếu đổi/trả (staff)")]
    public async Task<IActionResult> Cancel(
        int id,
        [FromBody] AdminReturnTransitionDto dto,
        CancellationToken cancellationToken = default)
    {
        var data = await returnService.CancelAsync(id, dto, cancellationToken);
        return Ok(new ResponseDto { Success = true, Data = data, Message = "Đã hủy phiếu đổi/trả" });
    }

    [HttpPut("{id:int}/complete")]
    [Authorize(Policy = Policies.WarehouseStaff)]
    [SwaggerOperation(Summary = "Hoàn tất yêu cầu đổi/trả (sau khi thu hồi hàng + hoàn tiền)")]
    public async Task<IActionResult> Complete(
        int id,
        [FromBody] AdminReturnCompleteDto dto,
        CancellationToken cancellationToken = default)
    {
        var stockManagerId = GetCurrentUserId();
        var data = await returnService.CompleteAsync(id, stockManagerId, dto, cancellationToken);
        return Ok(new ResponseDto
        {
            Success = true,
            Data = data,
            Message = "Hoàn thành phiếu đổi/trả thành công"
        });
    }

    [HttpGet("statuses")]
    [SwaggerOperation(Summary = "Danh sách các trạng thái phiếu đổi/trả")]
    public IActionResult GetStatuses()
    {
        return Ok(new ResponseDto
        {
            Success = true,
            Data = new
            {
                Statuses = ReturnTicketStatuses.All,
                Types = ReturnTypes.All,
                InventoryActions = InventoryActions.All
            },
            Message = "OK"
        });
    }

    [HttpGet("types")]
    [SwaggerOperation(Summary = "Danh sách các loại phiếu (Return/Exchange)")]
    public IActionResult GetTypes()
    {
        return Ok(new ResponseDto
        {
            Success = true,
            Data = ReturnTypes.All,
            Message = "OK"
        });
    }

    private int GetCurrentUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? User.FindFirst("sub")?.Value;

        if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out var userId))
            throw new UnauthorizedAccessException("Không xác định được người dùng hiện tại");

        return userId;
    }
}
