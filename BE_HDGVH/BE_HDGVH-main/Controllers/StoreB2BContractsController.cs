using BE_API.Authorization;
using BE_API.Dto.Common;
using BE_API.Dto.Store;
using BE_API.Service.IService;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Swashbuckle.AspNetCore.Annotations;

namespace BE_API.Controllers;

[ApiController]
[Route("api/store/b2b/contracts")]
[Authorize(Policy = Policies.CustomerAuthenticated)]
public class StoreB2BContractsController(IStoreB2BContractService contractService) : ControllerBase
{
    [HttpGet]
    [SwaggerOperation(Summary = "Danh sách hợp đồng của doanh nghiệp (filter: status)")]
    public async Task<IActionResult> GetList(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? status = null,
        CancellationToken cancellationToken = default)
    {
        var customerId = StoreCustomerPrincipal.GetCustomerId(User);
        var data = await contractService.GetPagedAsync(customerId, page, pageSize, status, cancellationToken);
        return Ok(new ResponseDto
        {
            Success = true,
            Data = data,
            Message = "Lấy danh sách hợp đồng thành công"
        });
    }

    [HttpGet("{contractNumber}")]
    [SwaggerOperation(Summary = "Chi tiết hợp đồng theo mã")]
    public async Task<IActionResult> GetByContractNumber(string contractNumber, CancellationToken cancellationToken)
    {
        var customerId = StoreCustomerPrincipal.GetCustomerId(User);
        var data = await contractService.GetByContractNumberAsync(customerId, contractNumber, cancellationToken);
        return Ok(new ResponseDto
        {
            Success = true,
            Data = data,
            Message = "Lấy chi tiết hợp đồng thành công"
        });
    }

    [HttpPost("{id:int}/confirm")]
    [SwaggerOperation(Summary = "Khách xác nhận hợp đồng (PendingConfirmation → Confirmed)")]
    public async Task<IActionResult> Confirm(
        int id,
        [FromBody] StoreB2BContractConfirmDto? dto,
        CancellationToken cancellationToken)
    {
        var customerId = StoreCustomerPrincipal.GetCustomerId(User);
        var data = await contractService.ConfirmAsync(customerId, id, dto, cancellationToken);
        return Ok(new ResponseDto
        {
            Success = true,
            Data = data,
            Message = "Xác nhận hợp đồng thành công"
        });
    }
}
