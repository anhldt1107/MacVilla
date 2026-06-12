namespace BE_API.Entities;

public class WarrantyTicket : IEntity
{
    public int Id { get; set; }
    public string TicketNumber { get; set; } = null!;
    public int? OrderId { get; set; }
    public int? ContractId { get; set; }
    public int CustomerId { get; set; }
    public DateTime IssueDate { get; set; }
    public DateTime? ValidUntil { get; set; }
    public string Status { get; set; } = "Active";

    public CustomerOrder? Order { get; set; }
    public Contract? Contract { get; set; }
    public Customer Customer { get; set; } = null!;
    public ICollection<WarrantyClaim> Claims { get; set; } = new List<WarrantyClaim>();
    public ICollection<WarrantyTicketLine> Lines { get; set; } = new List<WarrantyTicketLine>();
}
