namespace BE_API.Dto.Promotion;

public class CampaignDetailDto
{
    public int Id { get; set; }
    public string Name { get; set; } = null!;
    public string? Description { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public string Status { get; set; } = null!;
    public List<VoucherListItemDto> Vouchers { get; set; } = [];
}
