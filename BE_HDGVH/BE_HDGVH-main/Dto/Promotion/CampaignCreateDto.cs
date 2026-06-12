using System.ComponentModel.DataAnnotations;

namespace BE_API.Dto.Promotion;

public class CampaignCreateDto
{
    [Required(ErrorMessage = "Tên chiến dịch là bắt buộc.")]
    [MaxLength(500)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(2000)]
    public string? Description { get; set; }

    public DateTime? StartDate { get; set; }

    public DateTime? EndDate { get; set; }

    /// <summary>Trạng thái: Active, Inactive, Expired. Mặc định: Active.</summary>
    [MaxLength(50)]
    public string? Status { get; set; }
}
