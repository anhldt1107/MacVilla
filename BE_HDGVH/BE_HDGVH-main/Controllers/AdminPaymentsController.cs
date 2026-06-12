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
[Route("api/admin/payments")]
[Authorize(Policy = Policies.StaffAuthenticated)]
public class AdminPaymentsController(IAdminPaymentService paymentService) : ControllerBase
{
    [HttpGet]
    [SwaggerOperation(Summary = "Danh sách giao dịch thanh toán (filter: customerId, invoiceId, orderId, transactionType, paymentMethod, date, search)")]
    public async Task<IActionResult> GetList(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] int? customerId = null,
        [FromQuery] int? invoiceId = null,
        [FromQuery] int? orderId = null,
        [FromQuery] string? transactionType = null,
        [FromQuery] string? paymentMethod = null,
        [FromQuery] DateTime? fromDate = null,
        [FromQuery] DateTime? toDate = null,
        [FromQuery] string? search = null,
        CancellationToken cancellationToken = default)
    {
        var data = await paymentService.GetPagedAsync(
            page, pageSize, customerId, invoiceId, orderId,
            transactionType, paymentMethod, fromDate, toDate,
            search, cancellationToken);

        return Ok(new ResponseDto
        {
            Success = true,
            Data = data,
            Message = "Lấy danh sách giao dịch thanh toán thành công"
        });
    }

    [HttpGet("{id:int}")]
    [SwaggerOperation(Summary = "Chi tiết giao dịch thanh toán theo ID")]
    public async Task<IActionResult> GetById(int id, CancellationToken cancellationToken = default)
    {
        var data = await paymentService.GetByIdAsync(id, cancellationToken);
        return Ok(new ResponseDto
        {
            Success = true,
            Data = data,
            Message = "Lấy chi tiết giao dịch thanh toán thành công"
        });
    }

    [HttpPost]
    [SwaggerOperation(Summary = "Ghi nhận thanh toán (thu tiền từ sổ phụ ngân hàng)")]
    public async Task<IActionResult> CreatePayment(
        [FromBody] AdminPaymentCreateDto dto,
        CancellationToken cancellationToken = default)
    {
        var data = await paymentService.CreatePaymentAsync(dto, cancellationToken);
        return Ok(new ResponseDto
        {
            Success = true,
            Data = data,
            Message = "Ghi nhận thanh toán thành công"
        });
    }

    [HttpPost("refund")]
    [Authorize(Policy = Policies.ManagerOrAdmin)]
    [SwaggerOperation(Summary = "Ghi nhận hoàn tiền (Manager/Admin)")]
    public async Task<IActionResult> CreateRefund(
        [FromBody] AdminPaymentRefundDto dto,
        CancellationToken cancellationToken = default)
    {
        var data = await paymentService.CreateRefundAsync(dto, cancellationToken);
        return Ok(new ResponseDto
        {
            Success = true,
            Data = data,
            Message = "Ghi nhận hoàn tiền thành công"
        });
    }

    [HttpGet("transaction-types")]
    [SwaggerOperation(Summary = "Danh sách các loại giao dịch thanh toán")]
    public IActionResult GetTransactionTypes()
    {
        return Ok(new ResponseDto
        {
            Success = true,
            Data = new
            {
                TransactionTypes = PaymentTransactionTypes.All
            },
            Message = "OK"
        });
    }
}
