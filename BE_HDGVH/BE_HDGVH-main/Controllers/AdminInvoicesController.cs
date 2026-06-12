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
[Route("api/admin/invoices")]
[Authorize(Policy = Policies.StaffAuthenticated)]
public class AdminInvoicesController(IAdminInvoiceService invoiceService) : ControllerBase
{
    [HttpGet]
    [SwaggerOperation(Summary = "Danh sách hóa đơn (filter: status, customerId, orderId, dueDate, issueDate, search)")]
    public async Task<IActionResult> GetList(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? status = null,
        [FromQuery] int? customerId = null,
        [FromQuery] int? orderId = null,
        [FromQuery] DateTime? fromDueDate = null,
        [FromQuery] DateTime? toDueDate = null,
        [FromQuery] DateTime? fromIssueDate = null,
        [FromQuery] DateTime? toIssueDate = null,
        [FromQuery] string? search = null,
        CancellationToken cancellationToken = default)
    {
        var data = await invoiceService.GetPagedAsync(
            page, pageSize, status, customerId, orderId,
            fromDueDate, toDueDate, fromIssueDate, toIssueDate,
            search, cancellationToken);

        return Ok(new ResponseDto
        {
            Success = true,
            Data = data,
            Message = "Lấy danh sách hóa đơn thành công"
        });
    }

    [HttpGet("{id:int}")]
    [SwaggerOperation(Summary = "Chi tiết hóa đơn theo ID")]
    public async Task<IActionResult> GetById(int id, CancellationToken cancellationToken = default)
    {
        var data = await invoiceService.GetByIdAsync(id, cancellationToken);
        return Ok(new ResponseDto
        {
            Success = true,
            Data = data,
            Message = "Lấy chi tiết hóa đơn thành công"
        });
    }

    [HttpGet("by-number/{invoiceNumber}")]
    [SwaggerOperation(Summary = "Chi tiết hóa đơn theo số hóa đơn")]
    public async Task<IActionResult> GetByNumber(string invoiceNumber, CancellationToken cancellationToken = default)
    {
        var data = await invoiceService.GetByNumberAsync(invoiceNumber, cancellationToken);
        return Ok(new ResponseDto
        {
            Success = true,
            Data = data,
            Message = "Lấy chi tiết hóa đơn thành công"
        });
    }

    [HttpPost]
    [SwaggerOperation(Summary = "Tạo hóa đơn VAT mới")]
    public async Task<IActionResult> Create(
        [FromBody] AdminInvoiceCreateDto dto,
        CancellationToken cancellationToken = default)
    {
        var data = await invoiceService.CreateAsync(dto, cancellationToken);
        return Ok(new ResponseDto
        {
            Success = true,
            Data = data,
            Message = "Tạo hóa đơn thành công"
        });
    }

    [HttpPut("{id:int}")]
    [SwaggerOperation(Summary = "Cập nhật thông tin xuất VAT")]
    public async Task<IActionResult> Update(
        int id,
        [FromBody] AdminInvoiceUpdateDto dto,
        CancellationToken cancellationToken = default)
    {
        var data = await invoiceService.UpdateAsync(id, dto, cancellationToken);
        return Ok(new ResponseDto
        {
            Success = true,
            Data = data,
            Message = "Cập nhật hóa đơn thành công"
        });
    }

    [HttpPost("{id:int}/cancel")]
    [SwaggerOperation(Summary = "Hủy hóa đơn")]
    public async Task<IActionResult> Cancel(
        int id,
        [FromBody] AdminInvoiceCancelDto? dto,
        CancellationToken cancellationToken = default)
    {
        var data = await invoiceService.CancelAsync(id, dto?.Reason, cancellationToken);
        return Ok(new ResponseDto
        {
            Success = true,
            Data = data,
            Message = "Hủy hóa đơn thành công"
        });
    }

    [HttpGet("statuses")]
    [SwaggerOperation(Summary = "Danh sách các trạng thái hóa đơn")]
    public IActionResult GetInvoiceStatuses()
    {
        return Ok(new ResponseDto
        {
            Success = true,
            Data = new
            {
                Statuses = InvoiceStatuses.All
            },
            Message = "OK"
        });
    }
}

public class AdminInvoiceCancelDto
{
    public string? Reason { get; set; }
}
