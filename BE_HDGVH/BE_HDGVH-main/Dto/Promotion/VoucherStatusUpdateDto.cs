using System.ComponentModel.DataAnnotations;

namespace BE_API.Dto.Promotion;

public class VoucherStatusUpdateDto
{
    /// <summary>Trạng thái mới: Active, Inactive, Expired.</summary>
    [Required(ErrorMessage = "Trạng thái là bắt buộc.")]
    [MaxLength(50)]
    public string Status { get; set; } = string.Empty;
}
