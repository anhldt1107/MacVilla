using BE_API.Authorization;
using BE_API.Dto.Common;
using BE_API.Dto.Store;
using BE_API.Service.IService;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Swashbuckle.AspNetCore.Annotations;

namespace BE_API.Controllers;

/// <summary>
/// Hậu mãi B2C (bảo hành + đổi/trả) — tái dụng <see cref="IStoreB2BAfterSalesService"/>,
/// không ràng buộc loại khách. Prefix `/api/store/me/*`.
/// </summary>
[ApiController]
[Route("api/store/me")]
[Authorize(Policy = Policies.CustomerAuthenticated)]
public class StoreAfterSalesController(IStoreB2BAfterSalesService afterSalesService) : ControllerBase
{
    // --------------- Warranty ---------------

    [HttpGet("warranty-tickets")]
    [SwaggerOperation(Summary = "Danh sách phiếu bảo hành của khách (filter: status)")]
    public async Task<IActionResult> GetWarrantyTickets(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? status = null,
        CancellationToken cancellationToken = default)
    {
        var customerId = StoreCustomerPrincipal.GetCustomerId(User);
        var data = await afterSalesService.GetWarrantyTicketsPagedAsync(customerId, page, pageSize, status, cancellationToken);
        return Ok(new ResponseDto { Success = true, Data = data, Message = "OK" });
    }

    [HttpGet("warranty-tickets/{ticketNumber}")]
    [SwaggerOperation(Summary = "Chi tiết phiếu bảo hành theo mã")]
    public async Task<IActionResult> GetWarrantyTicketByNumber(string ticketNumber, CancellationToken cancellationToken)
    {
        var customerId = StoreCustomerPrincipal.GetCustomerId(User);
        var data = await afterSalesService.GetWarrantyTicketByNumberAsync(customerId, ticketNumber, cancellationToken);
        return Ok(new ResponseDto { Success = true, Data = data, Message = "OK" });
    }

    [HttpPost("warranty-tickets")]
    [SwaggerOperation(Summary = "Tạo yêu cầu bảo hành (có thể gửi WarrantyTicketId hoặc OrderId để tự tạo phiếu + claim)")]
    public async Task<IActionResult> CreateWarrantyClaim(
        [FromBody] StoreB2BWarrantyClaimCreateDto dto,
        CancellationToken cancellationToken = default)
    {
        var customerId = StoreCustomerPrincipal.GetCustomerId(User);
        var data = await afterSalesService.CreateWarrantyClaimAsync(customerId, dto, cancellationToken);
        return Ok(new ResponseDto { Success = true, Data = data, Message = data.Message });
    }

    // --------------- Return / Exchange ---------------

    [HttpGet("return-requests")]
    [SwaggerOperation(Summary = "Danh sách phiếu đổi/trả của khách (filter: status, type)")]
    public async Task<IActionResult> GetReturnRequests(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? status = null,
        [FromQuery] string? type = null,
        CancellationToken cancellationToken = default)
    {
        var customerId = StoreCustomerPrincipal.GetCustomerId(User);
        var data = await afterSalesService.GetReturnTicketsPagedAsync(customerId, page, pageSize, status, type, cancellationToken);
        return Ok(new ResponseDto { Success = true, Data = data, Message = "OK" });
    }

    [HttpGet("return-requests/{ticketNumber}")]
    [SwaggerOperation(Summary = "Chi tiết phiếu đổi/trả theo mã")]
    public async Task<IActionResult> GetReturnRequestByNumber(string ticketNumber, CancellationToken cancellationToken)
    {
        var customerId = StoreCustomerPrincipal.GetCustomerId(User);
        var data = await afterSalesService.GetReturnTicketByNumberAsync(customerId, ticketNumber, cancellationToken);
        return Ok(new ResponseDto { Success = true, Data = data, Message = "OK" });
    }

    [HttpPost("return-requests")]
    [SwaggerOperation(Summary = "Tạo yêu cầu đổi/trả (Type: Return hoặc Exchange)")]
    public async Task<IActionResult> CreateReturnRequest(
        [FromBody] StoreB2BReturnCreateDto dto,
        CancellationToken cancellationToken = default)
    {
        var customerId = StoreCustomerPrincipal.GetCustomerId(User);
        var data = await afterSalesService.CreateReturnRequestAsync(customerId, dto, cancellationToken);
        return Ok(new ResponseDto { Success = true, Data = data, Message = data.Message });
    }

    [HttpPut("return-requests/{ticketNumber}/cancel")]
    [SwaggerOperation(Summary = "Khách hủy yêu cầu đổi/trả")]
    public async Task<IActionResult> CancelReturnRequest(string ticketNumber, CancellationToken cancellationToken)
    {
        var customerId = StoreCustomerPrincipal.GetCustomerId(User);
        var data = await afterSalesService.CancelReturnRequestAsync(customerId, ticketNumber, cancellationToken);
        return Ok(new ResponseDto { Success = true, Data = data, Message = "Đã hủy yêu cầu đổi/trả" });
    }
}
