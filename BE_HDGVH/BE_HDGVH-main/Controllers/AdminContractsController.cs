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
[Route("api/admin/contracts")]
[Authorize(Policy = Policies.StaffAuthenticated)]
public class AdminContractsController(IAdminContractService contractService) : ControllerBase
{
    [HttpGet]
    [SwaggerOperation(Summary = "Danh sách hợp đồng (lọc status, customerId, quoteId)")]
    public async Task<IActionResult> GetList(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? status = null,
        [FromQuery] int? customerId = null,
        [FromQuery] int? quoteId = null,
        CancellationToken cancellationToken = default)
    {
        var data = await contractService.GetPagedAsync(page, pageSize, status, customerId, quoteId, cancellationToken);
        return Ok(new ResponseDto
        {
            Success = true,
            Data = data,
            Message = "Lấy danh sách hợp đồng thành công"
        });
    }

    [HttpGet("{id:int}")]
    [SwaggerOperation(Summary = "Chi tiết hợp đồng theo ID")]
    public async Task<IActionResult> GetById(int id, CancellationToken cancellationToken = default)
    {
        var data = await contractService.GetByIdAsync(id, cancellationToken);
        return Ok(new ResponseDto { Success = true, Data = data, Message = "OK" });
    }

    [HttpGet("by-number/{contractNumber}")]
    [SwaggerOperation(Summary = "Chi tiết hợp đồng theo mã")]
    public async Task<IActionResult> GetByNumber(string contractNumber, CancellationToken cancellationToken = default)
    {
        var data = await contractService.GetByNumberAsync(contractNumber, cancellationToken);
        return Ok(new ResponseDto { Success = true, Data = data, Message = "OK" });
    }

    [HttpPost]
    [SwaggerOperation(Summary = "Tạo hợp đồng từ báo giá (Approved hoặc CustomerAccepted)")]
    public async Task<IActionResult> Create(
        [FromBody] AdminContractCreateDto dto,
        CancellationToken cancellationToken = default)
    {
        var data = await contractService.CreateAsync(dto, cancellationToken);
        return Ok(new ResponseDto { Success = true, Data = data, Message = "Tạo hợp đồng thành công" });
    }

    [HttpPut("{id:int}")]
    [SwaggerOperation(Summary = "Cập nhật hợp đồng (Draft hoặc PendingConfirmation, trước khi khách xác nhận)")]
    public async Task<IActionResult> Update(
        int id,
        [FromBody] AdminContractUpdateDto dto,
        CancellationToken cancellationToken = default)
    {
        var data = await contractService.UpdateAsync(id, dto, cancellationToken);
        return Ok(new ResponseDto { Success = true, Data = data, Message = "Cập nhật hợp đồng thành công" });
    }

    [HttpPut("{id:int}/send-for-customer-confirmation")]
    [SwaggerOperation(Summary = "Gửi khách xác nhận (Draft → PendingConfirmation)")]
    public async Task<IActionResult> SendForCustomerConfirmation(int id, CancellationToken cancellationToken = default)
    {
        var data = await contractService.SendForCustomerConfirmationAsync(id, cancellationToken);
        return Ok(new ResponseDto { Success = true, Data = data, Message = "Đã gửi hợp đồng cho khách xác nhận" });
    }

    [HttpPut("{id:int}/cancel")]
    [SwaggerOperation(Summary = "Hủy hợp đồng (theo luồng ContractStatuses)")]
    public async Task<IActionResult> Cancel(
        int id,
        [FromBody] AdminContractCancelDto? dto,
        CancellationToken cancellationToken = default)
    {
        var data = await contractService.CancelAsync(id, dto ?? new AdminContractCancelDto(), cancellationToken);
        return Ok(new ResponseDto { Success = true, Data = data, Message = "Đã hủy hợp đồng" });
    }

    [HttpGet("statuses")]
    [SwaggerOperation(Summary = "Danh sách trạng thái hợp đồng")]
    public IActionResult GetStatuses()
    {
        return Ok(new ResponseDto
        {
            Success = true,
            Data = ContractStatuses.All,
            Message = "OK"
        });
    }
}
