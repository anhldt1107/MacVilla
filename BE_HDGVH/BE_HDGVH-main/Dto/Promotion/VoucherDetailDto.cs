namespace BE_API.Dto.Promotion;

public class VoucherDetailDto
{
    public int Id { get; set; }
    public int CampaignId { get; set; }
    public string? CampaignName { get; set; }
    public string Code { get; set; } = null!;
    public string? DiscountType { get; set; }
    public decimal DiscountValue { get; set; }
    public decimal MinOrderValue { get; set; }
    public decimal? MaxDiscountAmount { get; set; }
    public int? UsageLimit { get; set; }
    public int UsedCount { get; set; }
    public string Status { get; set; } = null!;
}
