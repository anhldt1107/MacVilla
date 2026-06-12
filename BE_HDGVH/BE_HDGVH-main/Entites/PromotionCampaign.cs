namespace BE_API.Entities;

public class PromotionCampaign : IEntity
{
    public int Id { get; set; }
    public string Name { get; set; } = null!;
    public string? Description { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public string Status { get; set; } = "Active";

    public ICollection<Voucher> Vouchers { get; set; } = new List<Voucher>();
}
