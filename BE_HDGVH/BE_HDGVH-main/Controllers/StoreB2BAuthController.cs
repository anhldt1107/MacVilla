using BE_API.Authorization;
using BE_API.Dto.Common;
using BE_API.Dto.Store;
using BE_API.Service.IService;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Swashbuckle.AspNetCore.Annotations;

namespace BE_API.Controllers;

[ApiController]
[Route("api/store/b2b/auth")]
public class StoreB2BAuthController(IStoreB2BAuthService b2bAuthService) : ControllerBase
{
    [HttpPost("register")]
    [AllowAnonymous]
    [SwaggerOperation(Summary = "Đăng ký khách doanh nghiệp (B2B), nhận JWT")]
    public async Task<IActionResult> Register([FromBody] StoreB2BRegisterDto dto, CancellationToken cancellationToken)
    {
        var data = await b2bAuthService.RegisterAsync(dto, cancellationToken);
        return Ok(new ResponseDto
        {
            Success = true,
            Data = data,
            Message = "Đăng ký khách doanh nghiệp thành công"
        });
    }

    [HttpPost("login")]
    [AllowAnonymous]
    [SwaggerOperation(Summary = "Đăng nhập khách doanh nghiệp (email + mật khẩu), nhận JWT")]
    public async Task<IActionResult> Login([FromBody] StoreB2BLoginDto dto, CancellationToken cancellationToken)
    {
        var data = await b2bAuthService.LoginAsync(dto, cancellationToken);
        return Ok(new ResponseDto
        {
            Success = true,
            Data = data,
            Message = "Đăng nhập thành công"
        });
    }

    /// <remarks>Yêu cầu đã có tài khoản B2B; Google chỉ đăng nhập / liên kết chứ không tạo tài khoản đối tác.</remarks>
    [HttpPost("google")]
    [AllowAnonymous]
    [SwaggerOperation(Summary = "Đăng nhập B2B bằng Google ID JWT")]
    public async Task<IActionResult> GoogleLogin([FromBody] StoreGoogleLoginDto dto, CancellationToken cancellationToken)
    {
        var raw = !string.IsNullOrWhiteSpace(dto.IdToken) ? dto.IdToken : dto.Credential;
        if (string.IsNullOrWhiteSpace(raw))
            return BadRequest(new ResponseDto { Success = false, Message = "Thiếu credential Google.", ErrorCode = "BAD_REQUEST" });

        var data = await b2bAuthService.GoogleSignInAsync(raw.Trim(), cancellationToken);
        return Ok(new ResponseDto
        {
            Success = true,
            Data = data,
            Message = "Đăng nhập Google (đối tác) thành công"
        });
    }

    [HttpGet("me")]
    [Authorize(Policy = Policies.CustomerAuthenticated)]
    [SwaggerOperation(Summary = "Thông tin khách doanh nghiệp đang đăng nhập")]
    public async Task<IActionResult> Me(CancellationToken cancellationToken)
    {
        var customerId = StoreCustomerPrincipal.GetCustomerId(User);
        var data = await b2bAuthService.GetProfileAsync(customerId, cancellationToken);
        return Ok(new ResponseDto
        {
            Success = true,
            Data = data,
            Message = "OK"
        });
    }

    [HttpPut("me")]
    [Authorize(Policy = Policies.CustomerAuthenticated)]
    [SwaggerOperation(Summary = "Cập nhật hồ sơ khách doanh nghiệp")]
    public async Task<IActionResult> UpdateMe([FromBody] StoreB2BUpdateDto dto, CancellationToken cancellationToken)
    {
        var customerId = StoreCustomerPrincipal.GetCustomerId(User);
        var data = await b2bAuthService.UpdateProfileAsync(customerId, dto, cancellationToken);
        return Ok(new ResponseDto
        {
            Success = true,
            Data = data,
            Message = "Cập nhật hồ sơ doanh nghiệp thành công"
        });
    }
}
