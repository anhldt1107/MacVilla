using BE_API.Authorization;
using BE_API.Dto.Common;
using BE_API.Service.IService;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Swashbuckle.AspNetCore.Annotations;

namespace BE_API.Controllers;

/// <summary>
/// Lịch sử thanh toán của khách (B2C + B2B lẻ).
/// Khác với `/api/store/payments/payos/*` (tạo link PayOS) — route này dành cho tra cứu `PaymentTransaction`.
/// </summary>
[ApiController]
[Route("api/store/me/payments")]
[Authorize(Policy = Policies.CustomerAuthenticated)]
public class StoreMyPaymentsController(IStoreB2BPaymentService paymentService) : ControllerBase
{
    [HttpGet]
    [SwaggerOperation(Summary = "Lịch sử thanh toán của khách (filter: invoiceId, transactionType, fromDate, toDate)")]
    public async Task<IActionResult> GetList(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] int? invoiceId = null,
        [FromQuery] string? transactionType = null,
        [FromQuery] DateTime? fromDate = null,
        [FromQuery] DateTime? toDate = null,
        CancellationToken cancellationToken = default)
    {
        var customerId = StoreCustomerPrincipal.GetCustomerId(User);
        var data = await paymentService.GetPaymentsPagedAsync(
            customerId, page, pageSize, invoiceId, transactionType, fromDate, toDate, cancellationToken);
        return Ok(new ResponseDto { Success = true, Data = data, Message = "OK" });
    }

    [HttpGet("{id:int}")]
    [SwaggerOperation(Summary = "Chi tiết giao dịch thanh toán theo ID (chỉ của khách đang đăng nhập)")]
    public async Task<IActionResult> GetById(int id, CancellationToken cancellationToken)
    {
        var customerId = StoreCustomerPrincipal.GetCustomerId(User);
        var data = await paymentService.GetPaymentByIdAsync(customerId, id, cancellationToken);
        return Ok(new ResponseDto { Success = true, Data = data, Message = "OK" });
    }
}
