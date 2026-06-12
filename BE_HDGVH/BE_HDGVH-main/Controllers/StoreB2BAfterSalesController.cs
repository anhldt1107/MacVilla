using BE_API.Authorization;
using BE_API.Dto.Common;
using BE_API.Dto.Store;
using BE_API.Service.IService;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Swashbuckle.AspNetCore.Annotations;

namespace BE_API.Controllers;

[ApiController]
[Route("api/store/b2b")]
[Authorize(Policy = Policies.CustomerAuthenticated)]
public class StoreB2BAfterSalesController(IStoreB2BAfterSalesService afterSalesService) : ControllerBase
{
    #region Warranty Tickets

    [HttpGet("warranty-tickets")]
    [SwaggerOperation(Summary = "Danh sách phiếu bảo hành của doanh nghiệp (filter: status)")]
    public async Task<IActionResult> GetWarrantyTickets(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? status = null,
        CancellationToken cancellationToken = default)
    {
        var customerId = StoreCustomerPrincipal.GetCustomerId(User);
        var data = await afterSalesService.GetWarrantyTicketsPagedAsync(
            customerId, page, pageSize, status, cancellationToken);
        return Ok(new ResponseDto
        {
            Success = true,
            Data = data,
            Message = "Lấy danh sách phiếu bảo hành thành công"
        });
    }

    [HttpGet("warranty-tickets/{ticketNumber}")]
    [SwaggerOperation(Summary = "Chi tiết phiếu bảo hành theo mã phiếu")]
    public async Task<IActionResult> GetWarrantyTicketByNumber(string ticketNumber, CancellationToken cancellationToken)
    {
        var customerId = StoreCustomerPrincipal.GetCustomerId(User);
        var data = await afterSalesService.GetWarrantyTicketByNumberAsync(customerId, ticketNumber, cancellationToken);
        return Ok(new ResponseDto
        {
            Success = true,
            Data = data,
            Message = "Lấy chi tiết phiếu bảo hành thành công"
        });
    }

    [HttpPost("warranty-tickets")]
    [SwaggerOperation(Summary = "Tạo yêu cầu bảo hành mới")]
    public async Task<IActionResult> CreateWarrantyClaim(
        [FromBody] StoreB2BWarrantyClaimCreateDto dto,
        CancellationToken cancellationToken = default)
    {
        var customerId = StoreCustomerPrincipal.GetCustomerId(User);
        var data = await afterSalesService.CreateWarrantyClaimAsync(customerId, dto, cancellationToken);
        return Ok(new ResponseDto
        {
            Success = true,
            Data = data,
            Message = data.Message
        });
    }

    #endregion

    #region Return/Exchange Tickets

    [HttpGet("return-exchange-requests")]
    [SwaggerOperation(Summary = "Danh sách phiếu đổi/trả của doanh nghiệp (filter: status, type)")]
    public async Task<IActionResult> GetReturnExchangeRequests(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? status = null,
        [FromQuery] string? type = null,
        CancellationToken cancellationToken = default)
    {
        var customerId = StoreCustomerPrincipal.GetCustomerId(User);
        var data = await afterSalesService.GetReturnTicketsPagedAsync(
            customerId, page, pageSize, status, type, cancellationToken);
        return Ok(new ResponseDto
        {
            Success = true,
            Data = data,
            Message = "Lấy danh sách phiếu đổi/trả thành công"
        });
    }

    [HttpGet("return-exchange-requests/{ticketNumber}")]
    [SwaggerOperation(Summary = "Chi tiết phiếu đổi/trả theo mã phiếu")]
    public async Task<IActionResult> GetReturnExchangeRequestByNumber(string ticketNumber, CancellationToken cancellationToken)
    {
        var customerId = StoreCustomerPrincipal.GetCustomerId(User);
        var data = await afterSalesService.GetReturnTicketByNumberAsync(customerId, ticketNumber, cancellationToken);
        return Ok(new ResponseDto
        {
            Success = true,
            Data = data,
            Message = "Lấy chi tiết phiếu đổi/trả thành công"
        });
    }

    [HttpPost("return-exchange-requests")]
    [SwaggerOperation(Summary = "Tạo yêu cầu đổi/trả hàng mới")]
    public async Task<IActionResult> CreateReturnExchangeRequest(
        [FromBody] StoreB2BReturnCreateDto dto,
        CancellationToken cancellationToken = default)
    {
        var customerId = StoreCustomerPrincipal.GetCustomerId(User);
        var data = await afterSalesService.CreateReturnRequestAsync(customerId, dto, cancellationToken);
        return Ok(new ResponseDto
        {
            Success = true,
            Data = data,
            Message = data.Message
        });
    }

    [HttpPut("return-exchange-requests/{ticketNumber}/cancel")]
    [SwaggerOperation(Summary = "Khách hủy yêu cầu đổi/trả (Requested / PendingApproval)")]
    public async Task<IActionResult> CancelReturnExchangeRequest(string ticketNumber, CancellationToken cancellationToken)
    {
        var customerId = StoreCustomerPrincipal.GetCustomerId(User);
        var data = await afterSalesService.CancelReturnRequestAsync(customerId, ticketNumber, cancellationToken);
        return Ok(new ResponseDto
        {
            Success = true,
            Data = data,
            Message = "Đã hủy yêu cầu đổi/trả"
        });
    }

    #endregion
}
