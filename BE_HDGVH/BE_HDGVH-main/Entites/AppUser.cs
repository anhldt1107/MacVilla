namespace BE_API.Entities;

public class AppUser : IEntity
{
    public int Id { get; set; }
    public string Username { get; set; } = null!;
    public string PasswordHash { get; set; } = null!;
    public string FullName { get; set; } = null!;
    public string? Email { get; set; }
    public string? Phone { get; set; }
    public int RoleId { get; set; }
    public string Status { get; set; } = "Active";
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }

    public Role Role { get; set; } = null!;

    public ICollection<Quote> QuotesAsSales { get; set; } = new List<Quote>();
    public ICollection<Quote> QuotesAsManager { get; set; } = new List<Quote>();
    public ICollection<CustomerOrder> OrdersAsSales { get; set; } = new List<CustomerOrder>();
    public ICollection<InventoryTransaction> InventoryTransactionsAsWorker { get; set; } = new List<InventoryTransaction>();
    public ICollection<InventoryTransaction> InventoryTransactionsAsManager { get; set; } = new List<InventoryTransaction>();
    public ICollection<FulfillmentTicket> FulfillmentTicketsAsWorker { get; set; } = new List<FulfillmentTicket>();
    public ICollection<FulfillmentTicket> FulfillmentTicketsCreated { get; set; } = new List<FulfillmentTicket>();
    public ICollection<ReturnExchangeTicket> ReturnTicketsApproved { get; set; } = new List<ReturnExchangeTicket>();
    public ICollection<ReturnExchangeTicket> ReturnTicketsAsStockManager { get; set; } = new List<ReturnExchangeTicket>();
    public ICollection<TransferNotification> TransferNotificationsProcessed { get; set; } = new List<TransferNotification>();
}
