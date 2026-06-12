using BE_API.Authorization;
using BE_API.Dto.Common;
using BE_API.Dto.Store;
using BE_API.Service.IService;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Swashbuckle.AspNetCore.Annotations;

namespace BE_API.Controllers;

[ApiController]
[Route("api/store/orders")]
[Authorize(Policy = Policies.CustomerAuthenticated)]
public class StoreOrdersController(IStoreOrderService orderService) : ControllerBase
{
    [HttpPost("preview")]
    [SwaggerOperation(Summary = "Xem trước đơn từ giỏ (không ghi DB); có thể gửi kèm địa chỉ / voucher")]
    public async Task<IActionResult> Preview([FromBody] StoreOrderCheckoutDto dto, CancellationToken cancellationToken = default)
    {
        var id = StoreCustomerPrincipal.GetCustomerId(User);
        var data = await orderService.PreviewAsync(id, dto, cancellationToken);
        return Ok(new ResponseDto
        {
            Success = true,
            Data = data,
            Message = "Xem trước đơn hàng"
        });
    }

    [HttpPost]
    [SwaggerOperation(Summary = "Đặt hàng từ giỏ: bắt buộc shippingAddressId + paymentMethod; xóa giỏ sau khi thành công")]
    public async Task<IActionResult> Create([FromBody] StoreOrderCheckoutDto dto, CancellationToken cancellationToken = default)
    {
        var id = StoreCustomerPrincipal.GetCustomerId(User);
        var data = await orderService.CreateAsync(id, dto, cancellationToken);
        return Ok(new ResponseDto
        {
            Success = true,
            Data = data,
            Message = "Đặt hàng thành công"
        });
    }
}
