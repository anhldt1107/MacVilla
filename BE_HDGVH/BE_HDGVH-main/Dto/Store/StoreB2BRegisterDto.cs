using System.ComponentModel.DataAnnotations;

namespace BE_API.Dto.Store;

public class StoreB2BRegisterDto
{
    [Required(ErrorMessage = "Họ tên người đại diện là bắt buộc.")]
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

    [Required(ErrorMessage = "Tên công ty là bắt buộc.")]
    [MaxLength(255)]
    public string CompanyName { get; set; } = string.Empty;

    [MaxLength(100)]
    public string? TaxCode { get; set; }

    [MaxLength(500)]
    public string? CompanyAddress { get; set; }
}
