using BE_API.Authorization;
using BE_API.Dto.Common;
using BE_API.Service.IService;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Swashbuckle.AspNetCore.Annotations;

namespace BE_API.Controllers;

[ApiController]
[Route("api/admin/staff-directory")]
[Authorize(Policy = Policies.WarehouseStaff)]
public class AdminStaffDirectoryController(IAdminStaffDirectoryService staffService) : ControllerBase
{
    /// <summary>
    /// Danh sách nhân sự nội bộ (read-only) — Admin / Manager / StockManager / Worker đều xem được để
    /// phân công (gán Sales cho đơn, gán Worker cho phiếu xuất, tra cứu người phụ trách…). Sales không dùng.
    /// </summary>
    [HttpGet]
    [SwaggerOperation(Summary = "Danh sách nhân sự (WarehouseStaff; filter: role=Sales/StockManager/Worker/Manager, status, search)")]
    public async Task<IActionResult> GetList(
        [FromQuery] string? role = null,
        [FromQuery] string? status = null,
        [FromQuery] string? search = null,
        CancellationToken cancellationToken = default)
    {
        var data = await staffService.GetAsync(role, status, search, cancellationToken);
        return Ok(new ResponseDto { Success = true, Data = data, Message = "OK" });
    }
}
