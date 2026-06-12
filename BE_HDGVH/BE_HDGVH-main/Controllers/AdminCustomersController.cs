using BE_API.Authorization;
using BE_API.Dto.Admin;
using BE_API.Dto.Common;
using BE_API.Service.IService;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Swashbuckle.AspNetCore.Annotations;

namespace BE_API.Controllers;

[ApiController]
[Route("api/admin/customers")]
[Authorize(Policy = Policies.StaffAuthenticated)]
public class AdminCustomersController(IAdminCustomerService customerService) : ControllerBase
{
    [HttpGet]
    [SwaggerOperation(Summary = "Danh sách khách hàng (filter: customerType, hasDebt, search)")]
    public async Task<IActionResult> GetList(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? customerType = null,
        [FromQuery] bool? hasDebt = null,
        [FromQuery] string? search = null,
        CancellationToken cancellationToken = default)
    {
        var data = await customerService.GetPagedAsync(
            page, pageSize, customerType, hasDebt, search,
            cancellationToken);

        return Ok(new ResponseDto
        {
            Success = true,
            Data = data,
            Message = "Lấy danh sách khách hàng thành công"
        });
    }

    [HttpGet("{id:int}")]
    [SwaggerOperation(Summary = "Chi tiết khách hàng theo ID")]
    public async Task<IActionResult> GetById(int id, CancellationToken cancellationToken = default)
    {
        var data = await customerService.GetByIdAsync(id, cancellationToken);
        return Ok(new ResponseDto
        {
            Success = true,
            Data = data,
            Message = "Lấy chi tiết khách hàng thành công"
        });
    }

    [HttpPost]
    [SwaggerOperation(Summary = "Tạo khách hàng mới (Sales nhập liệu)")]
    public async Task<IActionResult> Create(
        [FromBody] AdminCustomerCreateDto dto,
        CancellationToken cancellationToken = default)
    {
        var data = await customerService.CreateAsync(dto, cancellationToken);
        return Ok(new ResponseDto
        {
            Success = true,
            Data = data,
            Message = "Tạo khách hàng thành công"
        });
    }

    [HttpPut("{id:int}")]
    [SwaggerOperation(Summary = "Cập nhật thông tin khách hàng (B2B: companyName, taxCode)")]
    public async Task<IActionResult> Update(
        int id,
        [FromBody] AdminCustomerUpdateDto dto,
        CancellationToken cancellationToken = default)
    {
        var data = await customerService.UpdateAsync(id, dto, cancellationToken);
        return Ok(new ResponseDto
        {
            Success = true,
            Data = data,
            Message = "Cập nhật khách hàng thành công"
        });
    }

    [HttpGet("{id:int}/orders")]
    [SwaggerOperation(Summary = "Lịch sử đơn hàng của khách")]
    public async Task<IActionResult> GetOrderHistory(
        int id,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        var data = await customerService.GetOrderHistoryAsync(id, page, pageSize, cancellationToken);
        return Ok(new ResponseDto
        {
            Success = true,
            Data = data,
            Message = "Lấy lịch sử đơn hàng thành công"
        });
    }

    [HttpGet("{id:int}/debt")]
    [SwaggerOperation(Summary = "Thông tin công nợ B2B")]
    public async Task<IActionResult> GetDebt(
        int id,
        CancellationToken cancellationToken = default)
    {
        var data = await customerService.GetDebtInfoAsync(id, cancellationToken);
        return Ok(new ResponseDto
        {
            Success = true,
            Data = data,
            Message = "Lấy thông tin công nợ thành công"
        });
    }

    [HttpPost("{id:int}/debt/adjust")]
    [Authorize(Policy = Policies.ManagerOrAdmin)]
    [SwaggerOperation(Summary = "Điều chỉnh công nợ khách B2B (Manager/Admin; dương: tăng nợ, âm: giảm nợ/thanh toán)")]
    public async Task<IActionResult> AdjustDebt(
        int id,
        [FromBody] AdminCustomerAdjustDebtDto dto,
        CancellationToken cancellationToken = default)
    {
        var data = await customerService.AdjustDebtAsync(id, dto, cancellationToken);
        return Ok(new ResponseDto
        {
            Success = true,
            Data = data,
            Message = "Điều chỉnh công nợ thành công"
        });
    }

    [HttpGet("types")]
    [SwaggerOperation(Summary = "Danh sách các loại khách hàng (B2C, B2B)")]
    public IActionResult GetCustomerTypes()
    {
        return Ok(new ResponseDto
        {
            Success = true,
            Data = customerService.GetCustomerTypes(),
            Message = "OK"
        });
    }
}
