namespace BE_API.Entities;

public class Customer : IEntity
{
    public int Id { get; set; }
    public string CustomerType { get; set; } = null!;
    public string FullName { get; set; } = null!;
    public string? Email { get; set; }

    /// <summary>Nullable for B2C tạo qua Google OAuth (bổ sung sau trong hồ sơ / checkout).</summary>
    public string? Phone { get; set; }

    /// <summary>Claim <c>sub</c> của Google; null nếu chỉ đăng ký email+mật khẩu.</summary>
    public string? GoogleSubject { get; set; }

    public bool? GoogleEmailVerified { get; set; }

    public DateTime? GoogleLinkedAtUtc { get; set; }
    public string? PasswordHash { get; set; }
    public string? CompanyName { get; set; }
    public string? TaxCode { get; set; }
    public string? CompanyAddress { get; set; }
    public decimal DebtBalance { get; set; }
    public DateTime CreatedAt { get; set; }

    public ICollection<CustomerAddress> Addresses { get; set; } = new List<CustomerAddress>();
    public ICollection<Quote> Quotes { get; set; } = new List<Quote>();
    public ICollection<Contract> Contracts { get; set; } = new List<Contract>();
    public ICollection<CustomerOrder> Orders { get; set; } = new List<CustomerOrder>();
    public ICollection<Invoice> Invoices { get; set; } = new List<Invoice>();
    public ICollection<PaymentTransaction> PaymentTransactions { get; set; } = new List<PaymentTransaction>();
    public ICollection<WarrantyTicket> WarrantyTickets { get; set; } = new List<WarrantyTicket>();
    public ICollection<ReturnExchangeTicket> ReturnExchangeTickets { get; set; } = new List<ReturnExchangeTicket>();
    public ICollection<TransferNotification> TransferNotifications { get; set; } = new List<TransferNotification>();

    public ShoppingCart? ShoppingCart { get; set; }
}
