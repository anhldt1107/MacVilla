using BE_API.Authorization;
using BE_API.Dto.Common;
using BE_API.Dto.Store;
using BE_API.Service.IService;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PayOS.Models.Webhooks;
using Swashbuckle.AspNetCore.Annotations;

namespace BE_API.Controllers;

[ApiController]
[Route("api/store/payments/payos")]
public class StorePayOsPaymentsController(IStorePayOsPaymentService payOsPaymentService) : ControllerBase
{
    [HttpPost("create")]
    [Authorize(Policy = Policies.CustomerAuthenticated)]
    [SwaggerOperation(Summary = "P1: Tạo link thanh toán payOS cho đơn Unpaid (paymentMethod = PayOS). Idempotent khi link còn hạn.")]
    public async Task<IActionResult> CreatePaymentLink(
        [FromBody] StorePayOsCreatePaymentDto dto,
        CancellationToken cancellationToken = default)
    {
        var customerId = StoreCustomerPrincipal.GetCustomerId(User);
        var data = await payOsPaymentService.CreatePaymentLinkAsync(customerId, dto, cancellationToken);
        return Ok(new ResponseDto
        {
            Success = true,
            Data = data,
            Message = "Đã tạo link thanh toán payOS"
        });
    }

    [HttpPost("webhook")]
    [AllowAnonymous]
    [SwaggerOperation(Summary = "P2: Webhook IPN payOS — xác minh chữ ký SDK, cập nhật PaymentStatus khi thành công")]
    public async Task<IActionResult> Webhook(
        [FromBody] Webhook body,
        CancellationToken cancellationToken = default)
    {
        await payOsPaymentService.ProcessPayOsWebhookAsync(body, cancellationToken);
        return Ok(new ResponseDto { Success = true, Message = "OK" });
    }
}
