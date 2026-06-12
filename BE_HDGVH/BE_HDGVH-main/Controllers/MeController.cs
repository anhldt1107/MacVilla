using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using BE_API.Authorization;
using BE_API.Dto.Common;
using BE_API.Service.IService;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Swashbuckle.AspNetCore.Annotations;

namespace BE_API.Controllers;

[ApiController]
[Route("api/me")]
[Authorize(Policy = Policies.StaffAuthenticated)]
public class MeController(IAuthService authService) : ControllerBase
{
    /// <summary>
    /// Hồ sơ nhân viên đang đăng nhập (từ DB + role). Dùng FE phân quyền / sidebar.
    /// </summary>
    [HttpGet]
    [SwaggerOperation(Summary = "Hồ sơ staff /me — id, role, quyền kho (canAccessWarehouse)")]
    public async Task<IActionResult> GetStaffMe(CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId()
            ?? throw new UnauthorizedAccessException("Không xác định được người dùng");

        var data = await authService.GetStaffMeAsync(userId, cancellationToken);
        return Ok(new ResponseDto
        {
            Success = true,
            Data = data,
            Message = "OK"
        });
    }

    private int? GetCurrentUserId()
    {
        var sub = User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value
                  ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return int.TryParse(sub, out var id) ? id : null;
    }
}
