using System.ComponentModel.DataAnnotations;

namespace BE_API.Dto.Store;

public class StoreAddressCreateDto
{
    [Required(ErrorMessage = "Tên người nhận là bắt buộc.")]
    [MaxLength(500)]
    public string ReceiverName { get; set; } = string.Empty;

    [Required(ErrorMessage = "Số điện thoại người nhận là bắt buộc.")]
    [MaxLength(50)]
    public string ReceiverPhone { get; set; } = string.Empty;

    [Required(ErrorMessage = "Địa chỉ là bắt buộc.")]
    [MaxLength(2000)]
    public string AddressLine { get; set; } = string.Empty;

    /// <summary>Đặt làm mặc định; nếu đây là địa chỉ đầu tiên thì luôn thành mặc định.</summary>
    public bool IsDefault { get; set; }
}
