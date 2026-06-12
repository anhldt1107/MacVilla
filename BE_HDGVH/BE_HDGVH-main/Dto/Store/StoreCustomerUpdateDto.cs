using System.ComponentModel.DataAnnotations;

namespace BE_API.Dto.Store;

public class StoreCustomerUpdateDto
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
}
