using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using BE_API.Authorization;
using BE_API.Dto.Common;
using BE_API.Dto.InventoryTransaction;
using BE_API.Service.IService;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Swashbuckle.AspNetCore.Annotations;

namespace BE_API.Controllers;

[ApiController]
[Route("api/admin/inventory-transactions")]
[Authorize(Policy = Policies.WarehouseStaff)]
public class AdminInventoryTransactionsController(IAdminInventoryTransactionService transactionService) : ControllerBase
{
    [HttpGet]
    [SwaggerOperation(Summary = "Lịch sử giao dịch kho (filter: variantId, type, dateRange, referenceType, referenceId, workerIdAssigned)")]
    public async Task<IActionResult> GetList(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50,
        [FromQuery] int? variantId = null,
        [FromQuery] string? type = null,
        [FromQuery] DateTime? fromDate = null,
        [FromQuery] DateTime? toDate = null,
        [FromQuery] string? referenceType = null,
        [FromQuery] string? referenceId = null,
        [FromQuery] int? workerIdAssigned = null,
        CancellationToken cancellationToken = default)
    {
        var data = await transactionService.GetTransactionsPagedAsync(
            page, pageSize, variantId, type, fromDate, toDate,
            referenceType, referenceId, workerIdAssigned, cancellationToken);
        return Ok(new ResponseDto
        {
            Success = true,
            Data = data,
            Message = "Lấy danh sách giao dịch kho thành công"
        });
    }

    [HttpGet("{id:int}")]
    [SwaggerOperation(Summary = "Chi tiết giao dịch kho")]
    public async Task<IActionResult> GetById(int id, CancellationToken cancellationToken = default)
    {
        var data = await transactionService.GetTransactionByIdAsync(id, cancellationToken);
        return Ok(new ResponseDto
        {
            Success = true,
            Data = data,
            Message = "Lấy chi tiết giao dịch kho thành công"
        });
    }

    [HttpPost]
    [SwaggerOperation(Summary = "Tạo giao dịch kho (IN/OUT/ADJUST/RESERVE/RELEASE)")]
    public async Task<IActionResult> Create([FromBody] InventoryTransactionCreateDto dto, CancellationToken cancellationToken = default)
    {
        var userId = GetCurrentUserId()
            ?? throw new UnauthorizedAccessException("Không xác định được người dùng hiện tại");

        var data = await transactionService.CreateTransactionAsync(dto, userId, cancellationToken);
        return Ok(new ResponseDto
        {
            Success = true,
            Data = data,
            Message = "Tạo giao dịch kho thành công"
        });
    }

    private int? GetCurrentUserId()
    {
        var sub = User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value
                  ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return int.TryParse(sub, out var id) ? id : null;
    }
}
