using BE_API.Authorization;
using BE_API.Dto.Common;
using BE_API.Dto.Store;
using BE_API.Service.IService;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Swashbuckle.AspNetCore.Annotations;

namespace BE_API.Controllers;

[ApiController]
[Route("api/store/me/addresses")]
[Authorize(Policy = Policies.CustomerAuthenticated)]
public class StoreCustomerAddressesController(ICustomerAddressService addressService) : ControllerBase
{
    [HttpGet]
    [SwaggerOperation(Summary = "Danh sách địa chỉ giao hàng (B2C / B2B đang đăng nhập)")]
    public async Task<IActionResult> List(CancellationToken cancellationToken = default)
    {
        var customerId = StoreCustomerPrincipal.GetCustomerId(User);
        var data = await addressService.ListAsync(customerId, cancellationToken);
        return Ok(new ResponseDto
        {
            Success = true,
            Data = data,
            Message = "Lấy danh sách địa chỉ thành công"
        });
    }

    [HttpPost]
    [SwaggerOperation(Summary = "Thêm địa chỉ giao hàng B2C/B2B (địa chỉ đầu hoặc khi chưa có mặc định sẽ thành mặc định)")]
    public async Task<IActionResult> Create([FromBody] StoreAddressCreateDto dto, CancellationToken cancellationToken = default)
    {
        var customerId = StoreCustomerPrincipal.GetCustomerId(User);
        var data = await addressService.CreateAsync(customerId, dto, cancellationToken);
        return Ok(new ResponseDto
        {
            Success = true,
            Data = data,
            Message = "Thêm địa chỉ thành công"
        });
    }

    [HttpPut("{id:int}")]
    [SwaggerOperation(Summary = "Cập nhật địa chỉ")]
    public async Task<IActionResult> Update(
        int id,
        [FromBody] StoreAddressUpdateDto dto,
        CancellationToken cancellationToken = default)
    {
        var customerId = StoreCustomerPrincipal.GetCustomerId(User);
        var data = await addressService.UpdateAsync(customerId, id, dto, cancellationToken);
        return Ok(new ResponseDto
        {
            Success = true,
            Data = data,
            Message = "Cập nhật địa chỉ thành công"
        });
    }

    [HttpDelete("{id:int}")]
    [SwaggerOperation(Summary = "Xóa địa chỉ (chặn nếu đã dùng trong đơn); nếu xóa mặc định sẽ chọn địa chỉ khác làm mặc định")]
    public async Task<IActionResult> Delete(int id, CancellationToken cancellationToken = default)
    {
        var customerId = StoreCustomerPrincipal.GetCustomerId(User);
        await addressService.DeleteAsync(customerId, id, cancellationToken);
        return Ok(new ResponseDto
        {
            Success = true,
            Message = "Xóa địa chỉ thành công"
        });
    }

    [HttpPost("{id:int}/set-default")]
    [SwaggerOperation(Summary = "Đặt địa chỉ làm mặc định")]
    public async Task<IActionResult> SetDefault(int id, CancellationToken cancellationToken = default)
    {
        var customerId = StoreCustomerPrincipal.GetCustomerId(User);
        var data = await addressService.SetDefaultAsync(customerId, id, cancellationToken);
        return Ok(new ResponseDto
        {
            Success = true,
            Data = data,
            Message = "Đã đặt địa chỉ mặc định"
        });
    }
}
