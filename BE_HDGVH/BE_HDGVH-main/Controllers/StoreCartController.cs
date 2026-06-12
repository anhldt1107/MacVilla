using BE_API.Authorization;
using BE_API.Dto.Common;
using BE_API.Dto.Store;
using BE_API.Service.IService;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Swashbuckle.AspNetCore.Annotations;

namespace BE_API.Controllers;

[ApiController]
[Route("api/store/me/cart")]
[Authorize(Policy = Policies.CustomerAuthenticated)]
public class StoreCartController(ICustomerCartService cartService, IStoreVoucherService voucherService) : ControllerBase
{
    [HttpGet]
    [SwaggerOperation(Summary = "Giỏ hàng hiện tại (B2C đã đăng nhập)")]
    public async Task<IActionResult> Get(CancellationToken cancellationToken = default)
    {
        var id = StoreCustomerPrincipal.GetCustomerId(User);
        var data = await cartService.GetCartAsync(id, cancellationToken);
        return Ok(new ResponseDto
        {
            Success = true,
            Data = data,
            Message = "OK"
        });
    }

    [HttpGet("vouchers")]
    [SwaggerOperation(
        Summary = "Danh sách mã giảm giá đang mở + cờ áp dụng được với giỏ hiện tại",
        Description = "Tạm tính dùng so MinOrderValue (SP Active trong giỏ; không kiểm tra tồn). applicableToCart = Eligible ∧ đạt giá trị tối thiểu.")]
    public async Task<IActionResult> ListVouchersForCart(CancellationToken cancellationToken = default)
    {
        var id = StoreCustomerPrincipal.GetCustomerId(User);
        var data = await voucherService.ListForCartAsync(id, cancellationToken);
        return Ok(new ResponseDto
        {
            Success = true,
            Data = data,
            Message = "OK"
        });
    }

    [HttpPost("items")]
    [SwaggerOperation(Summary = "Thêm hoặc cộng dồn số lượng theo variant")]
    public async Task<IActionResult> AddItem([FromBody] StoreCartAddItemDto dto, CancellationToken cancellationToken = default)
    {
        var id = StoreCustomerPrincipal.GetCustomerId(User);
        var data = await cartService.AddOrUpdateItemAsync(id, dto, cancellationToken);
        return Ok(new ResponseDto
        {
            Success = true,
            Data = data,
            Message = "Đã cập nhật giỏ hàng"
        });
    }

    [HttpPut("items/{variantId:int}")]
    [SwaggerOperation(Summary = "Đặt số lượng (0 = xóa dòng)")]
    public async Task<IActionResult> SetQuantity(
        int variantId,
        [FromBody] StoreCartSetQuantityDto dto,
        CancellationToken cancellationToken = default)
    {
        var id = StoreCustomerPrincipal.GetCustomerId(User);
        var data = await cartService.SetQuantityAsync(id, variantId, dto, cancellationToken);
        return Ok(new ResponseDto
        {
            Success = true,
            Data = data,
            Message = "Đã cập nhật giỏ hàng"
        });
    }

    [HttpDelete("items/{variantId:int}")]
    [SwaggerOperation(Summary = "Xóa một dòng theo variant")]
    public async Task<IActionResult> RemoveItem(int variantId, CancellationToken cancellationToken = default)
    {
        var id = StoreCustomerPrincipal.GetCustomerId(User);
        var data = await cartService.RemoveItemAsync(id, variantId, cancellationToken);
        return Ok(new ResponseDto
        {
            Success = true,
            Data = data,
            Message = "Đã xóa dòng"
        });
    }

    [HttpDelete]
    [SwaggerOperation(Summary = "Làm rỗng giỏ")]
    public async Task<IActionResult> Clear(CancellationToken cancellationToken = default)
    {
        var id = StoreCustomerPrincipal.GetCustomerId(User);
        await cartService.ClearAsync(id, cancellationToken);
        return Ok(new ResponseDto
        {
            Success = true,
            Message = "Đã làm rỗng giỏ hàng"
        });
    }
}
