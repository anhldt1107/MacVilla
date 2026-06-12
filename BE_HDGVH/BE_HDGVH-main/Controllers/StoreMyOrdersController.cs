using BE_API.Authorization;
using BE_API.Dto.Common;
using BE_API.Service.IService;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Swashbuckle.AspNetCore.Annotations;

namespace BE_API.Controllers;

[ApiController]
[Route("api/store/me/orders")]
[Authorize(Policy = Policies.CustomerAuthenticated)]
public class StoreMyOrdersController(IStoreOrderService orderService) : ControllerBase
{
    [HttpGet]
    [SwaggerOperation(Summary = "Lịch sử đơn hàng của khách")]
    public async Task<IActionResult> List(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        var id = StoreCustomerPrincipal.GetCustomerId(User);
        var data = await orderService.ListMyOrdersAsync(id, page, pageSize, cancellationToken);
        return Ok(new ResponseDto
        {
            Success = true,
            Data = data,
            Message = "Lấy danh sách đơn thành công"
        });
    }

    [HttpGet("{orderCode}")]
    [SwaggerOperation(Summary = "Chi tiết đơn theo mã (chỉ đơn của khách)")]
    public async Task<IActionResult> Detail(string orderCode, CancellationToken cancellationToken = default)
    {
        var id = StoreCustomerPrincipal.GetCustomerId(User);
        var data = await orderService.GetMyOrderByCodeAsync(id, orderCode, cancellationToken);
        return Ok(new ResponseDto
        {
            Success = true,
            Data = data,
            Message = "OK"
        });
    }

    [HttpGet("{orderCode}/timeline")]
    [SwaggerOperation(Summary = "Timeline đơn (sự kiện: Order / Fulfillment / Payment / Invoice / Return)")]
    public async Task<IActionResult> Timeline(string orderCode, CancellationToken cancellationToken = default)
    {
        var id = StoreCustomerPrincipal.GetCustomerId(User);
        var data = await orderService.GetTimelineAsync(id, orderCode, cancellationToken);
        return Ok(new ResponseDto { Success = true, Data = data, Message = "OK" });
    }

    [HttpPost("{orderCode}/cancel")]
    [SwaggerOperation(Summary = "Khách tự hủy đơn (chỉ khi trạng thái cho phép: New, AwaitingPayment, Confirmed, Processing, ReadyToShip)")]
    public async Task<IActionResult> Cancel(
        string orderCode,
        [FromBody] Dto.Store.StoreOrderCancelDto? dto,
        CancellationToken cancellationToken = default)
    {
        var id = StoreCustomerPrincipal.GetCustomerId(User);
        var data = await orderService.CancelAsync(id, orderCode, dto, cancellationToken);
        return Ok(new ResponseDto { Success = true, Data = data, Message = "Đã hủy đơn" });
    }

    [HttpPost("{orderCode}/reorder")]
    [SwaggerOperation(Summary = "Đặt lại đơn cũ: thêm các SKU còn bán vào giỏ hiện tại")]
    public async Task<IActionResult> Reorder(string orderCode, CancellationToken cancellationToken = default)
    {
        var id = StoreCustomerPrincipal.GetCustomerId(User);
        var data = await orderService.ReorderAsync(id, orderCode, cancellationToken);
        return Ok(new ResponseDto { Success = true, Data = data, Message = data.Message });
    }
}
