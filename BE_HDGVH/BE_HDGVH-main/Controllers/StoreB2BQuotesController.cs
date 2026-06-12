using BE_API.Authorization;
using BE_API.Dto.Common;
using BE_API.Dto.Store;
using BE_API.Service.IService;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Swashbuckle.AspNetCore.Annotations;

namespace BE_API.Controllers;

[ApiController]
[Route("api/store/b2b/quotes")]
[Authorize(Policy = Policies.CustomerAuthenticated)]
public class StoreB2BQuotesController(IStoreB2BQuoteService quoteService) : ControllerBase
{
    [HttpPost("requests")]
    [SwaggerOperation(Summary = "Khách B2B gửi yêu cầu báo giá số lượng lớn")]
    public async Task<IActionResult> CreateRequest(
        [FromBody] StoreB2BQuoteRequestDto dto,
        CancellationToken cancellationToken)
    {
        var customerId = StoreCustomerPrincipal.GetCustomerId(User);
        var data = await quoteService.CreateRequestAsync(customerId, dto, cancellationToken);
        return Ok(new ResponseDto
        {
            Success = true,
            Data = data,
            Message = "Gửi yêu cầu báo giá thành công"
        });
    }

    [HttpGet]
    [SwaggerOperation(Summary = "Danh sách báo giá của doanh nghiệp (filter: status)")]
    public async Task<IActionResult> GetList(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? status = null,
        CancellationToken cancellationToken = default)
    {
        var customerId = StoreCustomerPrincipal.GetCustomerId(User);
        var data = await quoteService.GetPagedAsync(customerId, page, pageSize, status, cancellationToken);
        return Ok(new ResponseDto
        {
            Success = true,
            Data = data,
            Message = "Lấy danh sách báo giá thành công"
        });
    }

    [HttpGet("{quoteCode}")]
    [SwaggerOperation(Summary = "Chi tiết báo giá theo mã")]
    public async Task<IActionResult> GetByCode(string quoteCode, CancellationToken cancellationToken)
    {
        var customerId = StoreCustomerPrincipal.GetCustomerId(User);
        var data = await quoteService.GetByCodeAsync(customerId, quoteCode, cancellationToken);
        return Ok(new ResponseDto
        {
            Success = true,
            Data = data,
            Message = "Lấy chi tiết báo giá thành công"
        });
    }

    [HttpPost("{id:int}/accept")]
    [SwaggerOperation(Summary = "Khách chấp nhận báo giá (Approved → CustomerAccepted)")]
    public async Task<IActionResult> Accept(int id, CancellationToken cancellationToken)
    {
        var customerId = StoreCustomerPrincipal.GetCustomerId(User);
        var data = await quoteService.AcceptAsync(customerId, id, cancellationToken);
        return Ok(new ResponseDto
        {
            Success = true,
            Data = data,
            Message = "Chấp nhận báo giá thành công"
        });
    }

    [HttpPost("{id:int}/reject")]
    [SwaggerOperation(Summary = "Khách từ chối báo giá (Approved → CustomerRejected)")]
    public async Task<IActionResult> Reject(
        int id,
        [FromBody] StoreB2BQuoteRejectDto dto,
        CancellationToken cancellationToken)
    {
        var customerId = StoreCustomerPrincipal.GetCustomerId(User);
        var data = await quoteService.RejectAsync(customerId, id, dto, cancellationToken);
        return Ok(new ResponseDto
        {
            Success = true,
            Data = data,
            Message = "Từ chối báo giá thành công"
        });
    }

    [HttpPost("{id:int}/counter-offer")]
    [SwaggerOperation(Summary = "Khách gửi phản hồi thương lượng (Approved → CounterOffer)")]
    public async Task<IActionResult> CounterOffer(
        int id,
        [FromBody] StoreB2BQuoteCounterOfferDto dto,
        CancellationToken cancellationToken)
    {
        var customerId = StoreCustomerPrincipal.GetCustomerId(User);
        var data = await quoteService.CounterOfferAsync(customerId, id, dto, cancellationToken);
        return Ok(new ResponseDto
        {
            Success = true,
            Data = data,
            Message = "Gửi phản hồi thương lượng thành công"
        });
    }
}
