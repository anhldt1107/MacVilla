using System.ComponentModel.DataAnnotations;

namespace BE_API.Dto.Store;

public class StoreCustomerLoginDto
{
    [Required(ErrorMessage = "Email là bắt buộc.")]
    [MaxLength(255)]
    [EmailAddress(ErrorMessage = "Email không hợp lệ.")]
    public string Email { get; set; } = string.Empty;

    [Required(ErrorMessage = "Mật khẩu là bắt buộc.")]
    [MinLength(1)]
    public string Password { get; set; } = string.Empty;
}
