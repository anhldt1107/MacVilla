using BE_API.Authorization;
using BE_API.Domain;
using BE_API.Dto.Admin;
using BE_API.Dto.Common;
using BE_API.Service.IService;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Swashbuckle.AspNetCore.Annotations;

namespace BE_API.Controllers;

[ApiController]
[Route("api/admin/warranty-tickets")]
[Authorize(Policy = Policies.StaffAuthenticated)]
public class AdminWarrantyController(IAdminWarrantyService warrantyService) : ControllerBase
{
    [HttpGet]
    [SwaggerOperation(Summary = "Danh sách phiếu bảo hành (filter: status, customerId, orderId, fromDate, toDate, search)")]
    public async Task<IActionResult> GetList(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? status = null,
        [FromQuery] int? customerId = null,
        [FromQuery] int? orderId = null,
        [FromQuery] DateTime? fromDate = null,
        [FromQuery] DateTime? toDate = null,
        [FromQuery] string? search = null,
        CancellationToken cancellationToken = default)
    {
        var data = await warrantyService.GetPagedAsync(
            page, pageSize, status, customerId, orderId,
            fromDate, toDate, search, cancellationToken);

        return Ok(new ResponseDto
        {
            Success = true,
            Data = data,
            Message = "Lấy danh sách phiếu bảo hành thành công"
        });
    }

    [HttpGet("{id:int}")]
    [SwaggerOperation(Summary = "Chi tiết phiếu bảo hành theo ID")]
    public async Task<IActionResult> GetById(int id, CancellationToken cancellationToken = default)
    {
        var data = await warrantyService.GetByIdAsync(id, cancellationToken);
        return Ok(new ResponseDto
        {
            Success = true,
            Data = data,
            Message = "Lấy chi tiết phiếu bảo hành thành công"
        });
    }

    [HttpGet("by-number/{ticketNumber}")]
    [SwaggerOperation(Summary = "Chi tiết phiếu bảo hành theo mã phiếu")]
    public async Task<IActionResult> GetByTicketNumber(string ticketNumber, CancellationToken cancellationToken = default)
    {
        var data = await warrantyService.GetByTicketNumberAsync(ticketNumber, cancellationToken);
        return Ok(new ResponseDto
        {
            Success = true,
            Data = data,
            Message = "Lấy chi tiết phiếu bảo hành thành công"
        });
    }

    [HttpPost]
    [SwaggerOperation(Summary = "Tạo phiếu bảo hành (thường khi giao hàng thành công)")]
    public async Task<IActionResult> Create(
        [FromBody] AdminWarrantyTicketCreateDto dto,
        CancellationToken cancellationToken = default)
    {
        var data = await warrantyService.CreateAsync(dto, cancellationToken);
        return Ok(new ResponseDto
        {
            Success = true,
            Data = data,
            Message = "Tạo phiếu bảo hành thành công"
        });
    }

    [HttpPost("{id:int}/claims")]
    [SwaggerOperation(Summary = "Tạo yêu cầu bảo hành cho phiếu")]
    public async Task<IActionResult> CreateClaim(
        int id,
        [FromBody] AdminWarrantyClaimCreateDto dto,
        CancellationToken cancellationToken = default)
    {
        var data = await warrantyService.CreateClaimAsync(id, dto, cancellationToken);
        return Ok(new ResponseDto
        {
            Success = true,
            Data = data,
            Message = "Tạo yêu cầu bảo hành thành công"
        });
    }

    [HttpGet("statuses")]
    [SwaggerOperation(Summary = "Danh sách các trạng thái phiếu bảo hành và yêu cầu bảo hành")]
    public IActionResult GetStatuses()
    {
        return Ok(new ResponseDto
        {
            Success = true,
            Data = new
            {
                TicketStatuses = WarrantyTicketStatuses.All,
                ClaimStatuses = WarrantyClaimStatuses.All
            },
            Message = "OK"
        });
    }
}

[ApiController]
[Route("api/admin/warranty-claims")]
[Authorize(Policy = Policies.StaffAuthenticated)]
public class AdminWarrantyClaimsController(IAdminWarrantyService warrantyService) : ControllerBase
{
    [HttpGet]
    [SwaggerOperation(
        Summary = "Danh sách yêu cầu bảo hành (claim) phân trang",
        Description = "Filter: `status` (một trạng thái), `onlyOpen=true` = loại Completed/Rejected/Cancelled (hàng chờ xử lý). Thêm `customerId`, `warrantyTicketId`, `orderId`, `fromDate`/`toDate`, `search`.")]
    public async Task<IActionResult> GetList(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? status = null,
        [FromQuery] bool onlyOpen = false,
        [FromQuery] int? customerId = null,
        [FromQuery] int? warrantyTicketId = null,
        [FromQuery] int? orderId = null,
        [FromQuery] DateTime? fromDate = null,
        [FromQuery] DateTime? toDate = null,
        [FromQuery] string? search = null,
        CancellationToken cancellationToken = default)
    {
        var data = await warrantyService.GetClaimsPagedAsync(
            page, pageSize, status, onlyOpen, customerId, warrantyTicketId, orderId,
            fromDate, toDate, search, cancellationToken);

        return Ok(new ResponseDto
        {
            Success = true,
            Data = data,
            Message = "Lấy danh sách yêu cầu bảo hành thành công"
        });
    }

    [HttpGet("{id:int}")]
    [SwaggerOperation(Summary = "Chi tiết yêu cầu bảo hành theo ID")]
    public async Task<IActionResult> GetById(int id, CancellationToken cancellationToken = default)
    {
        var data = await warrantyService.GetClaimByIdAsync(id, cancellationToken);
        return Ok(new ResponseDto
        {
            Success = true,
            Data = data,
            Message = "Lấy chi tiết yêu cầu bảo hành thành công"
        });
    }

    [HttpPut("{id:int}/status")]
    [SwaggerOperation(Summary = "Cập nhật trạng thái yêu cầu bảo hành (Pending_Check → Checking → Confirmed_Defect → Repairing → Waiting_Pickup → Completed)")]
    public async Task<IActionResult> UpdateStatus(
        int id,
        [FromBody] AdminWarrantyClaimUpdateStatusDto dto,
        CancellationToken cancellationToken = default)
    {
        var data = await warrantyService.UpdateClaimStatusAsync(id, dto, cancellationToken);
        return Ok(new ResponseDto
        {
            Success = true,
            Data = data,
            Message = "Cập nhật trạng thái yêu cầu bảo hành thành công"
        });
    }
}
