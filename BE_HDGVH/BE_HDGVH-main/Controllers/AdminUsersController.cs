using BE_API.Authorization;
using BE_API.Dto.Admin;
using BE_API.Dto.Common;
using BE_API.Service.IService;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Swashbuckle.AspNetCore.Annotations;

namespace BE_API.Controllers;

[ApiController]
[Route("api/admin/users")]
public class AdminUsersController(IAdminUserService userService) : ControllerBase
{
    [HttpGet]
    [Authorize(Policy = Policies.ManagerOrAdminOrStockManager)]
    [SwaggerOperation(Summary = "Danh sách nhân sự (filter: roleId, status, search) — Admin, Manager, StockManager")]
    public async Task<IActionResult> GetList(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] int? roleId = null,
        [FromQuery] string? status = null,
        [FromQuery] string? search = null,
        CancellationToken cancellationToken = default)
    {
        var data = await userService.GetPagedAsync(
            page, pageSize, roleId, status, search,
            cancellationToken);

        return Ok(new ResponseDto
        {
            Success = true,
            Data = data,
            Message = "Lấy danh sách nhân sự thành công"
        });
    }

    [HttpGet("{id:int}")]
    [Authorize(Policy = Policies.AdminOnly)]
    [SwaggerOperation(Summary = "Chi tiết nhân sự theo ID")]
    public async Task<IActionResult> GetById(int id, CancellationToken cancellationToken = default)
    {
        var data = await userService.GetByIdAsync(id, cancellationToken);
        return Ok(new ResponseDto
        {
            Success = true,
            Data = data,
            Message = "Lấy chi tiết nhân sự thành công"
        });
    }

    [HttpPost]
    [Authorize(Policy = Policies.AdminOnly)]
    [SwaggerOperation(Summary = "Tạo tài khoản nhân sự mới")]
    public async Task<IActionResult> Create(
        [FromBody] AdminUserCreateDto dto,
        CancellationToken cancellationToken = default)
    {
        var data = await userService.CreateAsync(dto, cancellationToken);
        return Ok(new ResponseDto
        {
            Success = true,
            Data = data,
            Message = "Tạo tài khoản nhân sự thành công"
        });
    }

    [HttpPut("{id:int}")]
    [Authorize(Policy = Policies.AdminOnly)]
    [SwaggerOperation(Summary = "Cập nhật thông tin nhân sự (fullName, email, phone, roleId)")]
    public async Task<IActionResult> Update(
        int id,
        [FromBody] AdminUserUpdateDto dto,
        CancellationToken cancellationToken = default)
    {
        var data = await userService.UpdateAsync(id, dto, cancellationToken);
        return Ok(new ResponseDto
        {
            Success = true,
            Data = data,
            Message = "Cập nhật thông tin nhân sự thành công"
        });
    }

    [HttpPut("{id:int}/status")]
    [Authorize(Policy = Policies.AdminOnly)]
    [SwaggerOperation(Summary = "Kích hoạt / Khóa tài khoản (Active / Inactive)")]
    public async Task<IActionResult> UpdateStatus(
        int id,
        [FromBody] AdminUserUpdateStatusDto dto,
        CancellationToken cancellationToken = default)
    {
        var data = await userService.UpdateStatusAsync(id, dto, cancellationToken);
        return Ok(new ResponseDto
        {
            Success = true,
            Data = data,
            Message = "Cập nhật trạng thái tài khoản thành công"
        });
    }

    [HttpPut("{id:int}/reset-password")]
    [Authorize(Policy = Policies.AdminOnly)]
    [SwaggerOperation(Summary = "Reset mật khẩu nhân sự")]
    public async Task<IActionResult> ResetPassword(
        int id,
        [FromBody] AdminUserResetPasswordDto dto,
        CancellationToken cancellationToken = default)
    {
        var data = await userService.ResetPasswordAsync(id, dto, cancellationToken);
        return Ok(new ResponseDto
        {
            Success = true,
            Data = data,
            Message = "Reset mật khẩu thành công"
        });
    }

    [HttpGet("roles")]
    [Authorize(Policy = Policies.ManagerOrAdminOrStockManager)]
    [SwaggerOperation(Summary = "Danh sách vai trò cho dropdown — Admin, Manager, StockManager")]
    public async Task<IActionResult> GetRoles(CancellationToken cancellationToken = default)
    {
        var data = await userService.GetRoleOptionsAsync(cancellationToken);
        return Ok(new ResponseDto
        {
            Success = true,
            Data = data,
            Message = "OK"
        });
    }

    [HttpGet("statuses")]
    [Authorize(Policy = Policies.AdminOnly)]
    [SwaggerOperation(Summary = "Danh sách trạng thái tài khoản (Active, Inactive)")]
    public IActionResult GetStatuses()
    {
        return Ok(new ResponseDto
        {
            Success = true,
            Data = userService.GetUserStatuses(),
            Message = "OK"
        });
    }
}
