using BE_API.Authorization;
using BE_API.Dto.Common;
using BE_API.Service.IService;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Swashbuckle.AspNetCore.Annotations;

namespace BE_API.Controllers;

[ApiController]
[Route("api/store/b2b")]
[Authorize(Policy = Policies.CustomerAuthenticated)]
public class StoreB2BInvoicesController(IStoreB2BInvoiceService invoiceService) : ControllerBase
{
    [HttpGet("debt/summary")]
    [SwaggerOperation(Summary = "Tổng quan công nợ - số dư, quá hạn, sắp đến hạn")]
    public async Task<IActionResult> GetDebtSummary(CancellationToken cancellationToken)
    {
        var customerId = StoreCustomerPrincipal.GetCustomerId(User);
        var data = await invoiceService.GetDebtSummaryAsync(customerId, cancellationToken);
        return Ok(new ResponseDto
        {
            Success = true,
            Data = data,
            Message = "Lấy tổng quan công nợ thành công"
        });
    }

    [HttpGet("invoices")]
    [SwaggerOperation(Summary = "Danh sách hóa đơn của doanh nghiệp (filter: status)")]
    public async Task<IActionResult> GetInvoiceList(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? status = null,
        CancellationToken cancellationToken = default)
    {
        var customerId = StoreCustomerPrincipal.GetCustomerId(User);
        var data = await invoiceService.GetInvoicesPagedAsync(customerId, page, pageSize, status, cancellationToken);
        return Ok(new ResponseDto
        {
            Success = true,
            Data = data,
            Message = "Lấy danh sách hóa đơn thành công"
        });
    }

    [HttpGet("invoices/{invoiceNumber}")]
    [SwaggerOperation(Summary = "Chi tiết hóa đơn theo số hóa đơn")]
    public async Task<IActionResult> GetInvoiceByNumber(string invoiceNumber, CancellationToken cancellationToken)
    {
        var customerId = StoreCustomerPrincipal.GetCustomerId(User);
        var data = await invoiceService.GetInvoiceByNumberAsync(customerId, invoiceNumber, cancellationToken);
        return Ok(new ResponseDto
        {
            Success = true,
            Data = data,
            Message = "Lấy chi tiết hóa đơn thành công"
        });
    }

    [HttpGet("invoices/{invoiceNumber}/pdf")]
    [SwaggerOperation(Summary = "Lấy URL PDF của hóa đơn (nếu có)")]
    public async Task<IActionResult> GetInvoicePdfUrl(string invoiceNumber, CancellationToken cancellationToken)
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
            Message = "Lấy URL PDF hóa đơn thành công"
        });
    }
}
