using BE_API.Authorization;
using BE_API.Dto.Common;
using BE_API.Dto.Promotion;
using BE_API.Service.IService;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Swashbuckle.AspNetCore.Annotations;

namespace BE_API.Controllers;

[ApiController]
[Route("api/admin/vouchers")]
[Authorize(Policy = Policies.AdminOnly)]
public class AdminVouchersController(IAdminPromotionService promotionService) : ControllerBase
{
    [HttpGet]
    [SwaggerOperation(Summary = "Danh sách voucher (lọc: campaignId, status)")]
    public async Task<IActionResult> GetList(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50,
        [FromQuery] int? campaignId = null,
        [FromQuery] string? status = null,
        CancellationToken cancellationToken = default)
    {
        var data = await promotionService.GetVouchersPagedAsync(page, pageSize, campaignId, status, cancellationToken);
        return Ok(new ResponseDto
        {
            Success = true,
            Data = data,
            Message = "Lấy danh sách voucher thành công"
        });
    }

    [HttpPost]
    [SwaggerOperation(Summary = "Tạo voucher mới")]
    public async Task<IActionResult> Create([FromBody] VoucherCreateDto dto, CancellationToken cancellationToken = default)
    {
        var data = await promotionService.CreateVoucherAsync(dto, cancellationToken);
        return Ok(new ResponseDto
        {
            Success = true,
            Data = data,
            Message = "Tạo voucher thành công"
        });
    }

    [HttpPut("{id:int}")]
    [SwaggerOperation(Summary = "Cập nhật voucher")]
    public async Task<IActionResult> Update(int id, [FromBody] VoucherUpdateDto dto, CancellationToken cancellationToken = default)
    {
        var data = await promotionService.UpdateVoucherAsync(id, dto, cancellationToken);
        return Ok(new ResponseDto
        {
            Success = true,
            Data = data,
            Message = "Cập nhật voucher thành công"
        });
    }

    [HttpPut("{id:int}/status")]
    [SwaggerOperation(Summary = "Kích hoạt / Hết hạn voucher")]
    public async Task<IActionResult> UpdateStatus(int id, [FromBody] VoucherStatusUpdateDto dto, CancellationToken cancellationToken = default)
    {
        var data = await promotionService.UpdateVoucherStatusAsync(id, dto, cancellationToken);
        return Ok(new ResponseDto
        {
            Success = true,
            Data = data,
            Message = "Cập nhật trạng thái voucher thành công"
        });
    }
}
