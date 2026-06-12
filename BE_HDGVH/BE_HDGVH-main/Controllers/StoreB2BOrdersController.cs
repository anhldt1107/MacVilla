using BE_API.Authorization;
using BE_API.Dto.Common;
using BE_API.Service.IService;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Swashbuckle.AspNetCore.Annotations;

namespace BE_API.Controllers;

[ApiController]
[Route("api/store/b2b/orders")]
[Authorize(Policy = Policies.CustomerAuthenticated)]
public class StoreB2BOrdersController(IStoreB2BOrderService orderService) : ControllerBase
{
    [HttpGet]
    [SwaggerOperation(Summary = "Danh sách đơn hàng của doanh nghiệp (filter: orderStatus, paymentStatus)")]
    public async Task<IActionResult> GetList(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? orderStatus = null,
        [FromQuery] string? paymentStatus = null,
        CancellationToken cancellationToken = default)
    {
        var customerId = StoreCustomerPrincipal.GetCustomerId(User);
        var data = await orderService.GetPagedAsync(customerId, page, pageSize, orderStatus, paymentStatus, cancellationToken);
        return Ok(new ResponseDto
        {
            Success = true,
            Data = data,
            Message = "Lấy danh sách đơn hàng thành công"
        });
    }

    [HttpGet("{orderCode}")]
    [SwaggerOperation(Summary = "Chi tiết đơn hàng theo mã")]
    public async Task<IActionResult> GetByOrderCode(string orderCode, CancellationToken cancellationToken)
    {
        var customerId = StoreCustomerPrincipal.GetCustomerId(User);
        var data = await orderService.GetByOrderCodeAsync(customerId, orderCode, cancellationToken);
        return Ok(new ResponseDto
        {
            Success = true,
            Data = data,
            Message = "Lấy chi tiết đơn hàng thành công"
        });
    }

    [HttpGet("{orderCode}/timeline")]
    [SwaggerOperation(Summary = "Timeline đơn hàng - các sự kiện theo thời gian")]
    public async Task<IActionResult> GetTimeline(string orderCode, CancellationToken cancellationToken)
    {
        var customerId = StoreCustomerPrincipal.GetCustomerId(User);
        var data = await orderService.GetTimelineAsync(customerId, orderCode, cancellationToken);
        return Ok(new ResponseDto
        {
            Success = true,
            Data = data,
            Message = "Lấy timeline đơn hàng thành công"
        });
    }
}
