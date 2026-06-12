using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using BE_API.Authorization;
using BE_API.Domain;
using BE_API.Dto.Admin;
using BE_API.Dto.Common;
using BE_API.Service.IService;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Swashbuckle.AspNetCore.Annotations;

namespace BE_API.Controllers;

[ApiController]
[Route("api/admin/transfer-notifications")]
[Authorize(Policy = Policies.StaffAuthenticated)]
public class AdminTransferNotificationsController(IAdminTransferNotificationService transferNotificationService)
    : ControllerBase
{
    /// <summary>
    /// Danh sách thông báo chuyển khoản B2B (lọc: status, customerId, khoảng ngày tạo).
    /// </summary>
    [HttpGet]
    [SwaggerOperation(Summary = "Danh sách thông báo chuyển khoản (filter: status, customerId, fromDate, toDate)")]
    public async Task<IActionResult> GetList(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? status = null,
        [FromQuery] int? customerId = null,
        [FromQuery] DateTime? fromDate = null,
        [FromQuery] DateTime? toDate = null,
        CancellationToken cancellationToken = default)
    {
        var data = await transferNotificationService.GetPagedAsync(
            page, pageSize, status, customerId, fromDate, toDate, cancellationToken);

        return Ok(new ResponseDto
        {
            Success = true,
            Data = data,
            Message = "Lấy danh sách thông báo chuyển khoản thành công"
        });
    }

    [HttpGet("statuses")]
    [SwaggerOperation(Summary = "Các trạng thái thông báo chuyển khoản (Pending, Verified, Rejected)")]
    public IActionResult GetStatuses()
    {
        return Ok(new ResponseDto
        {
            Success = true,
            Data = new { Statuses = TransferNotificationStatuses.All },
            Message = "OK"
        });
    }

    [HttpGet("{id:int}")]
    [SwaggerOperation(Summary = "Chi tiết thông báo chuyển khoản theo ID")]
    public async Task<IActionResult> GetById(int id, CancellationToken cancellationToken = default)
    {
        var data = await transferNotificationService.GetByIdAsync(id, cancellationToken);
        return Ok(new ResponseDto
        {
            Success = true,
            Data = data,
            Message = "Lấy chi tiết thông báo chuyển khoản thành công"
        });
    }

    /// <summary>
    /// Xác nhận đối soát: ghi nhận giao dịch thanh toán (BankTransfer) và chuyển trạng thái Verified.
    /// </summary>
    [HttpPost("{id:int}/verify")]
    [Authorize(Policy = Policies.ManagerOrAdmin)]
    [SwaggerOperation(Summary = "Xác nhận thông báo CK - Manager/Admin (ghi nhận thanh toán + Verified)")]
    public async Task<IActionResult> Verify(
        int id,
        [FromBody] AdminTransferNotificationVerifyDto? dto,
        CancellationToken cancellationToken = default)
    {
        var userId = GetCurrentUserId()
            ?? throw new UnauthorizedAccessException("Không xác định được người dùng hiện tại");

        var data = await transferNotificationService.VerifyAsync(id, userId, dto, cancellationToken);
        return Ok(new ResponseDto
        {
            Success = true,
            Data = data,
            Message = "Xác nhận thông báo chuyển khoản thành công"
        });
    }

    [HttpPost("{id:int}/reject")]
    [Authorize(Policy = Policies.ManagerOrAdmin)]
    [SwaggerOperation(Summary = "Từ chối thông báo CK - Manager/Admin (Rejected, không tạo thanh toán)")]
    public async Task<IActionResult> Reject(
        int id,
        [FromBody] AdminTransferNotificationRejectDto dto,
        CancellationToken cancellationToken = default)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(new ResponseDto { Success = false, Message = "Dữ liệu không hợp lệ", Data = ModelState });
        }

        var userId = GetCurrentUserId()
            ?? throw new UnauthorizedAccessException("Không xác định được người dùng hiện tại");

        var data = await transferNotificationService.RejectAsync(id, userId, dto, cancellationToken);
        return Ok(new ResponseDto
        {
            Success = true,
            Data = data,
            Message = "Đã từ chối thông báo chuyển khoản"
        });
    }

    private int? GetCurrentUserId()
    {
        var sub = User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value
                  ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return int.TryParse(sub, out var uid) ? uid : null;
    }
}
