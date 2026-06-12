namespace BE_API.Entities;

public class FulfillmentTicket : IEntity
{
    public int Id { get; set; }
    public int OrderId { get; set; }
    public string? TicketType { get; set; }
    public int? AssignedWorkerId { get; set; }
    public string Status { get; set; } = "Pending";
    public int? CreatedBy { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public string? Notes { get; set; }

    public CustomerOrder Order { get; set; } = null!;
    public AppUser? AssignedWorker { get; set; }
    public AppUser? CreatedByUser { get; set; }
}
