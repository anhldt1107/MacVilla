using BE_API.Authorization;
using BE_API.Dto.Common;
using BE_API.Dto.Store;
using BE_API.Service.IService;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Swashbuckle.AspNetCore.Annotations;

namespace BE_API.Controllers;

[ApiController]
[Route("api/store/auth")]
public class StoreAuthController(ICustomerAuthService customerAuth) : ControllerBase
{
    [HttpPost("register")]
    [AllowAnonymous]
    [SwaggerOperation(Summary = "Đăng ký khách lẻ (B2C), nhận JWT")]
    public async Task<IActionResult> Register([FromBody] StoreCustomerRegisterDto dto, CancellationToken cancellationToken)
    {
        var data = await customerAuth.RegisterAsync(dto, cancellationToken);
        return Ok(new ResponseDto
        {
            Success = true,
            Data = data,
            Message = "Đăng ký thành công"
        });
    }

    [HttpPost("login")]
    [AllowAnonymous]
    [SwaggerOperation(Summary = "Đăng nhập cửa hàng (email + mật khẩu), nhận JWT")]
    public async Task<IActionResult> Login([FromBody] StoreCustomerLoginDto dto, CancellationToken cancellationToken)
    {
        var data = await customerAuth.LoginAsync(dto, cancellationToken);
        return Ok(new ResponseDto
        {
            Success = true,
            Data = data,
            Message = "Đăng nhập thành công"
        });
    }

    /// <remarks>GIS gửi <c>credential</c> (JWT) — body có <c>credential</c> hoặc <c>idToken</c>.</remarks>
    [HttpPost("google")]
    [AllowAnonymous]
    [SwaggerOperation(Summary = "Đăng nhập B2C bằng Google ID JWT từ Google Identity Services")]
    public async Task<IActionResult> GoogleLogin([FromBody] StoreGoogleLoginDto dto, CancellationToken cancellationToken)
    {
        var raw = !string.IsNullOrWhiteSpace(dto.IdToken) ? dto.IdToken : dto.Credential;
        if (string.IsNullOrWhiteSpace(raw))
            return BadRequest(new ResponseDto { Success = false, Message = "Thiếu credential Google.", ErrorCode = "BAD_REQUEST" });

        var data = await customerAuth.GoogleSignInAsync(raw.Trim(), cancellationToken);
        return Ok(new ResponseDto
        {
            Success = true,
            Data = data,
            Message = "Đăng nhập Google thành công"
        });
    }

    [HttpGet("me")]
    [Authorize(Policy = Policies.CustomerAuthenticated)]
    [SwaggerOperation(Summary = "Thông tin khách đang đăng nhập (truy vấn DB)")]
    public async Task<IActionResult> Me(CancellationToken cancellationToken)
    {
        var id = StoreCustomerPrincipal.GetCustomerId(User);
        var data = await customerAuth.GetProfileAsync(id, cancellationToken);
        return Ok(new ResponseDto
        {
            Success = true,
            Data = data,
            Message = "OK"
        });
    }

    [HttpPut("me")]
    [Authorize(Policy = Policies.CustomerAuthenticated)]
    [SwaggerOperation(Summary = "Cập nhật họ tên, email, số điện thoại")]
    public async Task<IActionResult> UpdateMe([FromBody] StoreCustomerUpdateDto dto, CancellationToken cancellationToken)
    {
        var id = StoreCustomerPrincipal.GetCustomerId(User);
        var data = await customerAuth.UpdateProfileAsync(id, dto, cancellationToken);
        return Ok(new ResponseDto
        {
            Success = true,
            Data = data,
            Message = "Cập nhật thành công"
        });
    }

    [HttpPost("change-password")]
    [Authorize(Policy = Policies.CustomerAuthenticated)]
    [SwaggerOperation(Summary = "Đổi mật khẩu (khách đã đăng nhập)")]
    public async Task<IActionResult> ChangePassword(
        [FromBody] StoreCustomerChangePasswordDto dto,
        CancellationToken cancellationToken)
    {
        var id = StoreCustomerPrincipal.GetCustomerId(User);
        await customerAuth.ChangePasswordAsync(id, dto, cancellationToken);
        return Ok(new ResponseDto
        {
            Success = true,
            Data = null,
            Message = "Đổi mật khẩu thành công"
        });
    }
}
