using BE_API.Authorization;
using BE_API.Dto.Common;
using BE_API.Service.IService;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Swashbuckle.AspNetCore.Annotations;

namespace BE_API.Controllers;

/// <summary>
/// Hóa đơn của khách (B2C + B2B lẻ) — tái dụng service <see cref="IStoreB2BInvoiceService"/>
/// nhưng không ràng buộc loại khách. Prefix `/api/store/me/*` dành cho cổng khách chung.
/// </summary>
[ApiController]
[Route("api/store/me")]
[Authorize(Policy = Policies.CustomerAuthenticated)]
public class StoreInvoicesController(IStoreB2BInvoiceService invoiceService) : ControllerBase
{
    [HttpGet("invoices")]
    [SwaggerOperation(Summary = "Danh sách hóa đơn của khách (filter: status)")]
    public async Task<IActionResult> GetList(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? status = null,
        CancellationToken cancellationToken = default)
    {
        var customerId = StoreCustomerPrincipal.GetCustomerId(User);
        var data = await invoiceService.GetInvoicesPagedAsync(customerId, page, pageSize, status, cancellationToken);
        return Ok(new ResponseDto { Success = true, Data = data, Message = "OK" });
    }

    [HttpGet("invoices/{invoiceNumber}")]
    [SwaggerOperation(Summary = "Chi tiết hóa đơn theo số hóa đơn")]
    public async Task<IActionResult> GetByNumber(string invoiceNumber, CancellationToken cancellationToken)
    {
        var customerId = StoreCustomerPrincipal.GetCustomerId(User);
        var data = await invoiceService.GetInvoiceByNumberAsync(customerId, invoiceNumber, cancellationToken);
        return Ok(new ResponseDto { Success = true, Data = data, Message = "OK" });
    }

    [HttpGet("invoices/{invoiceNumber}/pdf")]
    [SwaggerOperation(Summary = "Lấy URL PDF của hóa đơn (nếu có)")]
    public async Task<IActionResult> GetPdf(string invoiceNumber, CancellationToken cancellationToken)
    {
        var customerId = StoreCustomerPrincipal.GetCustomerId(User);
        var pdfUrl = await invoiceService.GetInvoicePdfUrlAsync(customerId, invoiceNumber, cancellationToken);
        if (string.IsNullOrWhiteSpace(pdfUrl))
        {
            return Ok(new ResponseDto
            {
                Success = false,
                Data = null,
                Message = "Hóa đơn chưa có file PDF"
            });
        }
        return Ok(new ResponseDto
        {
            Success = true,
            Data = new { PdfUrl = pdfUrl },
            Message = "OK"
        });
    }
}
