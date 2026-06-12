using System.ComponentModel.DataAnnotations;

namespace BE_API.Dto.Store;

public class StoreCustomerChangePasswordDto
{
    [Required(ErrorMessage = "Mật khẩu hiện tại là bắt buộc.")]
    public string OldPassword { get; set; } = string.Empty;

    [Required(ErrorMessage = "Mật khẩu mới là bắt buộc.")]
    [MinLength(6, ErrorMessage = "Mật khẩu mới tối thiểu 6 ký tự.")]
    [MaxLength(200)]
    public string NewPassword { get; set; } = string.Empty;
}
