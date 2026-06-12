namespace BE_API.Entities;

public class Invoice : IEntity
{
    public int Id { get; set; }
    public string InvoiceNumber { get; set; } = null!;
    public int? OrderId { get; set; }
    public int? ContractId { get; set; }
    public int CustomerId { get; set; }
    public string? TaxCode { get; set; }
    public string? CompanyName { get; set; }
    public string? BillingAddress { get; set; }
    public decimal? SubTotal { get; set; }
    public decimal? TaxAmount { get; set; }
    public decimal? TotalAmount { get; set; }
    public DateTime IssueDate { get; set; }
    public DateTime? DueDate { get; set; }
    public string Status { get; set; } = "Unpaid";
    public string? PdfUrl { get; set; }

    public CustomerOrder? Order { get; set; }
    public Contract? Contract { get; set; }
    public Customer Customer { get; set; } = null!;
    public ICollection<PaymentTransaction> PaymentTransactions { get; set; } = new List<PaymentTransaction>();
    public ICollection<TransferNotification> TransferNotifications { get; set; } = new List<TransferNotification>();
}
