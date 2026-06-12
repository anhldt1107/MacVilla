namespace BE_API.Entities;

public class PaymentTransaction : IEntity
{
    public int Id { get; set; }
    public int CustomerId { get; set; }
    public int? InvoiceId { get; set; }
    public decimal Amount { get; set; }
    public string? PaymentMethod { get; set; }
    public string? TransactionType { get; set; }
    public DateTime PaymentDate { get; set; }
    public string? ReferenceCode { get; set; }
    public string? Note { get; set; }

    public Customer Customer { get; set; } = null!;
    public Invoice? Invoice { get; set; }
}
