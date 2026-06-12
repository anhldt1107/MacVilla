namespace BE_API.Entities;

/// <summary>
/// Lịch sử chuyển trạng thái đơn hàng.
/// </summary>
public class OrderStatusHistory : IEntity
{
    public int Id { get; set; }
    public int OrderId { get; set; }
    public string FromStatus { get; set; } = string.Empty;
    public string ToStatus { get; set; } = string.Empty;
    public string? Note { get; set; }
    /// <summary>OrderManual | FulfillmentSync | PaymentSync | Cancel</summary>
    public string Source { get; set; } = "OrderManual";
    public int? ActorUserId { get; set; }
    public DateTime CreatedAt { get; set; }

    public CustomerOrder Order { get; set; } = null!;
    public AppUser? ActorUser { get; set; }
}
