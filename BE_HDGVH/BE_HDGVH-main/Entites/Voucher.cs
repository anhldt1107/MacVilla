namespace BE_API.Entities;

public class Voucher : IEntity
{
    public int Id { get; set; }
    public int CampaignId { get; set; }
    public string Code { get; set; } = null!;
    public string? DiscountType { get; set; }
    public decimal DiscountValue { get; set; }
    public decimal MinOrderValue { get; set; }
    public decimal? MaxDiscountAmount { get; set; }
    public int? UsageLimit { get; set; }
    public int UsedCount { get; set; }
    public string Status { get; set; } = "Active";

    public PromotionCampaign Campaign { get; set; } = null!;
    public ICollection<CustomerOrder> Orders { get; set; } = new List<CustomerOrder>();
}
