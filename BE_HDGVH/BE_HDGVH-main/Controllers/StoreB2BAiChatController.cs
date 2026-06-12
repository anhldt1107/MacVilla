using BE_API.Authorization;
using BE_API.Database;
using BE_API.Domain;
using BE_API.Dto.Ai;
using BE_API.Dto.Common;
using BE_API.Service.Ai;
using BE_API.Service.IService;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Swashbuckle.AspNetCore.Annotations;

namespace BE_API.Controllers;

[ApiController]
[Route("api/store/b2b/ai")]
[Authorize(Policy = Policies.CustomerAuthenticated)]
public class StoreB2BAiChatController(IAiAssistantService assistant, BeContext db) : ControllerBase
{
    [HttpPost("chat")]
    [SwaggerOperation(Summary = "Trợ lý Gemini cho khách doanh nghiệp B2B (truy vấn đơn / hóa đơn / công nợ của chính khách)")]
    public async Task<IActionResult> Chat([FromBody] AiChatRequestDto dto, CancellationToken cancellationToken = default)
    {
        var caller = await BuildCallerAsync(cancellationToken);
        var data = await assistant.ChatAsync(dto, caller, cancellationToken);
        return Ok(new ResponseDto { Success = true, Data = data, Message = "OK" });
    }

    [HttpGet("threads")]
    public async Task<IActionResult> ListThreads(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        var caller = await BuildCallerAsync(cancellationToken);
        var data = await assistant.ListThreadsAsync(caller, page, pageSize, cancellationToken);
        return Ok(new ResponseDto { Success = true, Data = data, Message = "OK" });
    }

    [HttpGet("threads/{id:int}/messages")]
    public async Task<IActionResult> GetMessages(int id, CancellationToken cancellationToken = default)
    {
        var caller = await BuildCallerAsync(cancellationToken);
        var data = await assistant.GetThreadMessagesAsync(id, caller, cancellationToken);
        return Ok(new ResponseDto { Success = true, Data = data, Message = "OK" });
    }

    [HttpDelete("threads/{id:int}")]
    public async Task<IActionResult> DeleteThread(int id, CancellationToken cancellationToken = default)
    {
        var caller = await BuildCallerAsync(cancellationToken);
        await assistant.DeleteThreadAsync(id, caller, cancellationToken);
        return Ok(new ResponseDto { Success = true, Message = "Đã xóa phiên chat." });
    }

    private async Task<AiCallerContext> BuildCallerAsync(CancellationToken cancellationToken)
    {
        var customerId = StoreCustomerPrincipal.GetCustomerId(User);
        var customer = await db.Customers.AsNoTracking()
            .Where(c => c.Id == customerId)
            .Select(c => new { c.CustomerType, Name = c.CompanyName ?? c.FullName })
            .FirstOrDefaultAsync(cancellationToken)
            ?? throw new UnauthorizedAccessException("Không tìm thấy khách hàng.");

        if (!string.Equals(customer.CustomerType, CustomerTypes.B2B, StringComparison.OrdinalIgnoreCase))
            throw new UnauthorizedAccessException("Endpoint này chỉ dành cho khách doanh nghiệp B2B.");

        return AiCallerContext.ForCustomer(customerId, isB2B: true, customer.Name);
    }
}
