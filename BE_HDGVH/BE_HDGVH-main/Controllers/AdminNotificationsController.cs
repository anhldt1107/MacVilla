using BE_API.Authorization;
using BE_API.Dto.Admin;
using BE_API.Dto.Common;
using BE_API.Service.IService;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Swashbuckle.AspNetCore.Annotations;

namespace BE_API.Controllers;

[ApiController]
[Route("api/admin/notifications")]
[Authorize(Policy = Policies.StaffAuthenticated)]
public class AdminNotificationsController(INotificationInboxService inboxService) : ControllerBase
{
    [HttpGet]
    [SwaggerOperation(Summary = "Danh sách thông báo in-app của nhân sự đang đăng nhập")]
    public async Task<IActionResult> GetList(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] bool unreadOnly = false,
        CancellationToken cancellationToken = default)
    {
        var userId = StaffPrincipal.GetStaffUserId(User);
        var data = await inboxService.GetStaffPagedAsync(userId, page, pageSize, unreadOnly, cancellationToken);
        return Ok(new ResponseDto { Success = true, Data = data, Message = "OK" });
    }

    [HttpGet("unread-count")]
    [SwaggerOperation(Summary = "Số thông báo chưa đọc")]
    public async Task<IActionResult> GetUnreadCount(CancellationToken cancellationToken = default)
    {
        var userId = StaffPrincipal.GetStaffUserId(User);
        var count = await inboxService.GetStaffUnreadCountAsync(userId, cancellationToken);
        return Ok(new ResponseDto
        {
            Success = true,
            Data = new AdminNotificationUnreadCountDto { UnreadCount = count },
            Message = "OK"
        });
    }

    [HttpPost("{id:int}/read")]
    [SwaggerOperation(Summary = "Đánh dấu đã đọc một thông báo")]
    public async Task<IActionResult> MarkRead(int id, CancellationToken cancellationToken = default)
    {
        var userId = StaffPrincipal.GetStaffUserId(User);
        await inboxService.MarkStaffReadAsync(userId, id, cancellationToken);
        return Ok(new ResponseDto { Success = true, Message = "Đã đọc" });
    }

    [HttpPost("read-all")]
    [SwaggerOperation(Summary = "Đánh dấu đã đọc tất cả")]
    public async Task<IActionResult> MarkReadAll(CancellationToken cancellationToken = default)
    {
        var userId = StaffPrincipal.GetStaffUserId(User);
        await inboxService.MarkStaffReadAllAsync(userId, cancellationToken);
        return Ok(new ResponseDto { Success = true, Message = "Đã đọc tất cả" });
    }
}
