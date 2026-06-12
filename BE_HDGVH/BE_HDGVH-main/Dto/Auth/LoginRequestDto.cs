using System.ComponentModel.DataAnnotations;

namespace BE_API.Dto.Auth;

public class LoginRequestDto
{
    [Required(ErrorMessage = "Tên đăng nhập là bắt buộc.")]
    [MaxLength(100)]
    public string Username { get; set; } = string.Empty;

    [Required(ErrorMessage = "Mật khẩu là bắt buộc.")]
    [MinLength(1)]
    public string Password { get; set; } = string.Empty;
}
