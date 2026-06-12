using BE_API.Authorization;
using BE_API.Dto.Common;
using BE_API.Dto.Store;
using BE_API.Service.IService;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Swashbuckle.AspNetCore.Annotations;

namespace BE_API.Controllers;

[ApiController]
[Route("api/store/notifications")]
[Authorize(Policy = Policies.CustomerAuthenticated)]
public class StoreNotificationsController(INotificationInboxService inboxService) : ControllerBase
{
    [HttpGet]
    [SwaggerOperation(Summary = "Danh sách thông báo in-app khách hàng (B2C/B2B)")]
    public async Task<IActionResult> GetList(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] bool unreadOnly = false,
        CancellationToken cancellationToken = default)
    {
        var customerId = StoreCustomerPrincipal.GetCustomerId(User);
        var data = await inboxService.GetCustomerPagedAsync(customerId, page, pageSize, unreadOnly, cancellationToken);
        return Ok(new ResponseDto { Success = true, Data = data, Message = "OK" });
    }

    [HttpGet("unread-count")]
    [SwaggerOperation(Summary = "Số thông báo chưa đọc")]
    public async Task<IActionResult> GetUnreadCount(CancellationToken cancellationToken = default)
    {
        var customerId = StoreCustomerPrincipal.GetCustomerId(User);
        var count = await inboxService.GetCustomerUnreadCountAsync(customerId, cancellationToken);
        return Ok(new ResponseDto
        {
            Success = true,
            Data = new StoreNotificationUnreadCountDto { UnreadCount = count },
            Message = "OK"
        });
    }

    [HttpPost("{id:int}/read")]
    [SwaggerOperation(Summary = "Đánh dấu đã đọc")]
    public async Task<IActionResult> MarkRead(int id, CancellationToken cancellationToken = default)
    {
        var customerId = StoreCustomerPrincipal.GetCustomerId(User);
        await inboxService.MarkCustomerReadAsync(customerId, id, cancellationToken);
        return Ok(new ResponseDto { Success = true, Message = "Đã đọc" });
    }
}
