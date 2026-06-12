using System.ComponentModel.DataAnnotations;

namespace BE_API.Dto.Promotion;

public class VoucherUpdateDto
{
    [Required(ErrorMessage = "Chiến dịch là bắt buộc.")]
    public int CampaignId { get; set; }

    [Required(ErrorMessage = "Mã voucher là bắt buộc.")]
    [MaxLength(100)]
    public string Code { get; set; } = string.Empty;

    /// <summary>Loại giảm giá: Percentage hoặc FixedAmount.</summary>
    [Required(ErrorMessage = "Loại giảm giá là bắt buộc.")]
    [MaxLength(50)]
    public string DiscountType { get; set; } = string.Empty;

    [Required(ErrorMessage = "Giá trị giảm là bắt buộc.")]
    [Range(0.01, double.MaxValue, ErrorMessage = "Giá trị giảm phải lớn hơn 0.")]
    public decimal DiscountValue { get; set; }

    [Range(0, double.MaxValue)]
    public decimal MinOrderValue { get; set; }

    [Range(0, double.MaxValue)]
    public decimal? MaxDiscountAmount { get; set; }

    [Range(1, int.MaxValue)]
    public int? UsageLimit { get; set; }

    /// <summary>Trạng thái: Active, Inactive, Expired.</summary>
    [Required(ErrorMessage = "Trạng thái là bắt buộc.")]
    [MaxLength(50)]
    public string Status { get; set; } = string.Empty;
}
