using System.ComponentModel.DataAnnotations;

namespace BE_API.Dto.Store;

public class StoreCustomerRegisterDto
{
    [Required(ErrorMessage = "Họ tên là bắt buộc.")]
    [MaxLength(500)]
    public string FullName { get; set; } = string.Empty;

    [Required(ErrorMessage = "Email là bắt buộc (dùng để đăng nhập).")]
    [MaxLength(255)]
    [EmailAddress(ErrorMessage = "Email không hợp lệ.")]
    public string Email { get; set; } = string.Empty;

    [Required(ErrorMessage = "Số điện thoại là bắt buộc.")]
    [MaxLength(50)]
    public string Phone { get; set; } = string.Empty;

    [Required(ErrorMessage = "Mật khẩu là bắt buộc.")]
    [MinLength(6, ErrorMessage = "Mật khẩu tối thiểu 6 ký tự.")]
    [MaxLength(200)]
    public string Password { get; set; } = string.Empty;
}
