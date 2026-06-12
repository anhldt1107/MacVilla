using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using BE_API.Authorization;
using BE_API.Dto.Auth;
using BE_API.Dto.Common;
using BE_API.Service.IService;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Swashbuckle.AspNetCore.Annotations;

namespace BE_API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController(IAuthService authService) : ControllerBase
{
    [HttpPost("login")]
    [AllowAnonymous]
    [SwaggerOperation(Summary = "Đăng nhập nhân sự (admin / staff), nhận JWT")]
    public async Task<IActionResult> Login([FromBody] LoginRequestDto dto, CancellationToken cancellationToken)
    {
        var result = await authService.LoginAsync(dto, cancellationToken);
        return Ok(new ResponseDto
        {
            Success = true,
            Data = result,
            Message = "Đăng nhập thành công"
        });
    }

    [HttpGet("me")]
    [Authorize(Policy = Policies.StaffAuthenticated)]
    [SwaggerOperation(Summary = "Thông tin user từ JWT (không truy vấn DB)")]
    public IActionResult Me()
    {
        var sub = User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value
                  ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var username = User.FindFirst(JwtRegisteredClaimNames.UniqueName)?.Value ?? string.Empty;
        var fullName = User.FindFirst(JwtClaimTypes.FullName)?.Value ?? string.Empty;
        var role = User.FindFirst(JwtClaimTypes.Role)?.Value ?? string.Empty;

        var dto = new AuthenticatedUserDto
        {
            Id = int.TryParse(sub, out var id) ? id : 0,
            Username = username ?? string.Empty,
            FullName = fullName ?? string.Empty,
            RoleName = role ?? string.Empty
        };

        return Ok(new ResponseDto
        {
            Success = true,
            Data = dto,
            Message = "OK"
        });
    }
}
