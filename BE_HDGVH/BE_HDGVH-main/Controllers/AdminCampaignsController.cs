using BE_API.Authorization;
using BE_API.Dto.Common;
using BE_API.Dto.Promotion;
using BE_API.Service.IService;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Swashbuckle.AspNetCore.Annotations;

namespace BE_API.Controllers;

[ApiController]
[Route("api/admin/campaigns")]
[Authorize(Policy = Policies.AdminOnly)]
public class AdminCampaignsController(IAdminPromotionService promotionService) : ControllerBase
{
    [HttpGet]
    [SwaggerOperation(Summary = "Danh sách chiến dịch (phân trang, lọc status)")]
    public async Task<IActionResult> GetList(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50,
        [FromQuery] string? status = null,
        CancellationToken cancellationToken = default)
    {
        var data = await promotionService.GetCampaignsPagedAsync(page, pageSize, status, cancellationToken);
        return Ok(new ResponseDto
        {
            Success = true,
            Data = data,
            Message = "Lấy danh sách chiến dịch thành công"
        });
    }

    [HttpGet("{id:int}")]
    [SwaggerOperation(Summary = "Chi tiết chiến dịch + danh sách voucher")]
    public async Task<IActionResult> GetById(int id, CancellationToken cancellationToken = default)
    {
        var data = await promotionService.GetCampaignByIdAsync(id, cancellationToken);
        return Ok(new ResponseDto
        {
            Success = true,
            Data = data,
            Message = "Lấy chi tiết chiến dịch thành công"
        });
    }

    [HttpPost]
    [SwaggerOperation(Summary = "Tạo chiến dịch mới")]
    public async Task<IActionResult> Create([FromBody] CampaignCreateDto dto, CancellationToken cancellationToken = default)
    {
        var data = await promotionService.CreateCampaignAsync(dto, cancellationToken);
        return Ok(new ResponseDto
        {
            Success = true,
            Data = data,
            Message = "Tạo chiến dịch thành công"
        });
    }

    [HttpPut("{id:int}")]
    [SwaggerOperation(Summary = "Cập nhật chiến dịch")]
    public async Task<IActionResult> Update(int id, [FromBody] CampaignUpdateDto dto, CancellationToken cancellationToken = default)
    {
        var data = await promotionService.UpdateCampaignAsync(id, dto, cancellationToken);
        return Ok(new ResponseDto
        {
            Success = true,
            Data = data,
            Message = "Cập nhật chiến dịch thành công"
        });
    }

    [HttpDelete("{id:int}")]
    [SwaggerOperation(Summary = "Xóa chiến dịch (nếu chưa có voucher được dùng)")]
    public async Task<IActionResult> Delete(int id, CancellationToken cancellationToken = default)
    {
        await promotionService.DeleteCampaignAsync(id, cancellationToken);
        return Ok(new ResponseDto
        {
            Success = true,
            Message = "Xóa chiến dịch thành công"
        });
    }
}
