using System.ComponentModel.DataAnnotations;

namespace BE_API.Dto.Promotion;

public class CampaignUpdateDto
{
    [Required(ErrorMessage = "Tên chiến dịch là bắt buộc.")]
    [MaxLength(500)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(2000)]
    public string? Description { get; set; }

    public DateTime? StartDate { get; set; }

    public DateTime? EndDate { get; set; }

    /// <summary>Trạng thái: Active, Inactive, Expired.</summary>
    [Required(ErrorMessage = "Trạng thái là bắt buộc.")]
    [MaxLength(50)]
    public string Status { get; set; } = string.Empty;
}
