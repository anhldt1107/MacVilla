using BE_API.Dto.Common;
using BE_API.Dto.Store;
using BE_API.Service.IService;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Swashbuckle.AspNetCore.Annotations;

namespace BE_API.Controllers;

[ApiController]
[Route("api/store/vouchers")]
[AllowAnonymous]
public class StoreVouchersController(IStoreVoucherService voucherService) : ControllerBase
{
    [HttpPost("validate")]
    [SwaggerOperation(Summary = "Kiểm tra mã voucher; gửi kèm tạm tính để tính số tiền giảm")]
    public async Task<IActionResult> Validate(
        [FromBody] StoreVoucherValidateRequestDto dto,
        CancellationToken cancellationToken = default)
    {
        var data = await voucherService.ValidateAsync(dto, cancellationToken);
        return Ok(new ResponseDto
        {
            Success = true,
            Data = data,
            Message = data.Applicable ? "Hợp lệ" : data.Message ?? "Không áp dụng được"
        });
    }
}
