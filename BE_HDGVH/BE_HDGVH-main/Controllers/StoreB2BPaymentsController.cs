using BE_API.Authorization;
using BE_API.Dto.Common;
using BE_API.Dto.Store;
using BE_API.Service.IService;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Swashbuckle.AspNetCore.Annotations;

namespace BE_API.Controllers;

[ApiController]
[Route("api/store/b2b/payments")]
[Authorize(Policy = Policies.CustomerAuthenticated)]
public class StoreB2BPaymentsController(IStoreB2BPaymentService paymentService) : ControllerBase
{
    [HttpGet]
    [SwaggerOperation(Summary = "Lịch sử thanh toán của doanh nghiệp (filter: invoiceId, transactionType, fromDate, toDate)")]
    public async Task<IActionResult> GetPaymentHistory(
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
        return Ok(new ResponseDto
        {
            Success = true,
            Data = data,
            Message = "Lấy lịch sử thanh toán thành công"
        });
    }

    [HttpGet("{id:int}")]
    [SwaggerOperation(Summary = "Chi tiết giao dịch thanh toán theo ID")]
    public async Task<IActionResult> GetPaymentById(int id, CancellationToken cancellationToken)
    {
        var customerId = StoreCustomerPrincipal.GetCustomerId(User);
        var data = await paymentService.GetPaymentByIdAsync(customerId, id, cancellationToken);
        return Ok(new ResponseDto
        {
            Success = true,
            Data = data,
            Message = "Lấy chi tiết giao dịch thanh toán thành công"
        });
    }

    [HttpPost("notify-transfer")]
    [SwaggerOperation(Summary = "Thông báo đã chuyển khoản (gửi ref code, số tiền, chứng từ)")]
    public async Task<IActionResult> NotifyTransfer(
        [FromBody] StoreB2BNotifyTransferRequestDto dto,
        CancellationToken cancellationToken = default)
    {
        var customerId = StoreCustomerPrincipal.GetCustomerId(User);
        var data = await paymentService.NotifyTransferAsync(customerId, dto, cancellationToken);
        return Ok(new ResponseDto
        {
            Success = true,
            Data = data,
            Message = data.Message
        });
    }

    [HttpGet("transfer-notifications")]
    [SwaggerOperation(Summary = "Danh sách thông báo CK đã gửi (pending/verified/rejected)")]
    public async Task<IActionResult> GetTransferNotifications(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? status = null,
        CancellationToken cancellationToken = default)
    {
        var customerId = StoreCustomerPrincipal.GetCustomerId(User);
        var data = await paymentService.GetTransferNotificationsPagedAsync(
            customerId, page, pageSize, status, cancellationToken);
        return Ok(new ResponseDto
        {
            Success = true,
            Data = data,
            Message = "OK"
        });
    }

    [HttpGet("bank-transfer-info")]
    [SwaggerOperation(Summary = "Thông tin tài khoản nhận CK (đọc appsettings — B2bBankTransfer)")]
    public Task<IActionResult> GetBankTransferInfo()
    {
        var data = paymentService.GetBankTransferInfo();
        return Task.FromResult<IActionResult>(Ok(new ResponseDto
        {
            Success = true,
            Data = data,
            Message = "OK"
        }));
    }
}
