using BE_API.Entities;
using Microsoft.EntityFrameworkCore;

namespace BE_API.Database
{
    public class BeContext : DbContext
    {
        public BeContext(DbContextOptions<BeContext> options) : base(options) { }

        public DbSet<AppUser> AppUsers => Set<AppUser>();
        public DbSet<Role> Roles => Set<Role>();
        public DbSet<Customer> Customers => Set<Customer>();
        public DbSet<CustomerAddress> CustomerAddresses => Set<CustomerAddress>();
        public DbSet<Category> Categories => Set<Category>();
        public DbSet<Product> Products => Set<Product>();
        public DbSet<ProductAttribute> ProductAttributes => Set<ProductAttribute>();
        public DbSet<ProductAttributeValue> ProductAttributeValues => Set<ProductAttributeValue>();
        public DbSet<ProductVariant> ProductVariants => Set<ProductVariant>();
        public DbSet<Quote> Quotes => Set<Quote>();
        public DbSet<QuoteItem> QuoteItems => Set<QuoteItem>();
        public DbSet<Contract> Contracts => Set<Contract>();
        public DbSet<CustomerOrder> CustomerOrders => Set<CustomerOrder>();
        public DbSet<OrderItem> OrderItems => Set<OrderItem>();
        public DbSet<Inventory> Inventories => Set<Inventory>();
        public DbSet<InventoryTransaction> InventoryTransactions => Set<InventoryTransaction>();
        public DbSet<FulfillmentTicket> FulfillmentTickets => Set<FulfillmentTicket>();
        public DbSet<OrderStatusHistory> OrderStatusHistories => Set<OrderStatusHistory>();
        public DbSet<Invoice> Invoices => Set<Invoice>();
        public DbSet<PaymentTransaction> PaymentTransactions => Set<PaymentTransaction>();
        public DbSet<PromotionCampaign> PromotionCampaigns => Set<PromotionCampaign>();
        public DbSet<Voucher> Vouchers => Set<Voucher>();
        public DbSet<WarrantyTicket> WarrantyTickets => Set<WarrantyTicket>();
        public DbSet<WarrantyTicketLine> WarrantyTicketLines => Set<WarrantyTicketLine>();
        public DbSet<WarrantyClaim> WarrantyClaims => Set<WarrantyClaim>();
        public DbSet<ReturnExchangeTicket> ReturnExchangeTickets => Set<ReturnExchangeTicket>();
        public DbSet<ReturnItem> ReturnItems => Set<ReturnItem>();
        public DbSet<ShoppingCart> ShoppingCarts => Set<ShoppingCart>();
        public DbSet<ShoppingCartItem> ShoppingCartItems => Set<ShoppingCartItem>();
        public DbSet<TransferNotification> TransferNotifications => Set<TransferNotification>();
        public DbSet<AiChatThread> AiChatThreads => Set<AiChatThread>();
        public DbSet<AiChatMessage> AiChatMessages => Set<AiChatMessage>();
        public DbSet<UserNotification> UserNotifications => Set<UserNotification>();

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<CustomerOrder>().ToTable("Order");

            modelBuilder.Entity<AiChatThread>()
                .Property(x => x.OwnerType).HasMaxLength(20);
            modelBuilder.Entity<AiChatThread>()
                .Property(x => x.Role).HasMaxLength(20);
            modelBuilder.Entity<AiChatThread>()
                .Property(x => x.Title).HasMaxLength(255);
            modelBuilder.Entity<AiChatThread>()
                .HasIndex(x => new { x.OwnerType, x.OwnerId, x.CreatedAt });

            modelBuilder.Entity<AiChatMessage>()
                .Property(x => x.MessageRole).HasMaxLength(20);
            modelBuilder.Entity<AiChatMessage>()
                .Property(x => x.ToolName).HasMaxLength(100);
            modelBuilder.Entity<AiChatMessage>()
                .HasOne(x => x.Thread)
                .WithMany(t => t.Messages)
                .HasForeignKey(x => x.ThreadId)
                .OnDelete(DeleteBehavior.Cascade);
            modelBuilder.Entity<AiChatMessage>()
                .HasIndex(x => new { x.ThreadId, x.Id });

            modelBuilder.Entity<Role>()
                .Property(x => x.RoleName)
                .HasMaxLength(100);

            modelBuilder.Entity<AppUser>()
                .Property(x => x.Username)
                .HasMaxLength(100);

            modelBuilder.Entity<AppUser>()
                .HasIndex(x => x.Username)
                .IsUnique();

            modelBuilder.Entity<AppUser>()
                .Property(x => x.Email)
                .HasMaxLength(255);

            modelBuilder.Entity<Customer>()
                .Property(x => x.Email)
                .HasMaxLength(255);

            modelBuilder.Entity<Customer>()
                .Property(x => x.GoogleSubject)
                .HasMaxLength(255);

            modelBuilder.Entity<Customer>()
                .HasIndex(x => x.GoogleSubject)
                .IsUnique()
                .HasFilter("[GoogleSubject] IS NOT NULL");

            modelBuilder.Entity<Customer>()
                .Property(x => x.DebtBalance)
                .HasPrecision(18, 2);

            modelBuilder.Entity<ShoppingCart>()
                .HasOne(x => x.Customer)
                .WithOne(x => x.ShoppingCart)
                .HasForeignKey<ShoppingCart>(x => x.CustomerId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<ShoppingCart>()
                .HasIndex(x => x.CustomerId)
                .IsUnique();

            modelBuilder.Entity<ShoppingCartItem>()
                .HasOne(x => x.ShoppingCart)
                .WithMany(x => x.Items)
                .HasForeignKey(x => x.ShoppingCartId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<ShoppingCartItem>()
                .HasOne(x => x.Variant)
                .WithMany(x => x.ShoppingCartItems)
                .HasForeignKey(x => x.VariantId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<ShoppingCartItem>()
                .HasIndex(x => new { x.ShoppingCartId, x.VariantId })
                .IsUnique();

            modelBuilder.Entity<Category>()
                .HasIndex(x => x.Slug)
                .IsUnique();

            modelBuilder.Entity<Category>()
                .HasOne(x => x.Parent)
                .WithMany(x => x.Children)
                .HasForeignKey(x => x.ParentId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Product>()
                .HasIndex(x => x.Slug)
                .IsUnique();

            modelBuilder.Entity<Product>()
                .Property(x => x.BasePrice)
                .HasPrecision(18, 2);

            modelBuilder.Entity<ProductVariant>()
                .HasIndex(x => x.Sku)
                .IsUnique();

            modelBuilder.Entity<ProductVariant>()
                .Property(x => x.RetailPrice)
                .HasPrecision(18, 2);

            modelBuilder.Entity<ProductVariant>()
                .Property(x => x.CostPrice)
                .HasPrecision(18, 2);

            modelBuilder.Entity<ProductVariant>()
                .Property(x => x.Weight)
                .HasPrecision(18, 2);

            modelBuilder.Entity<Quote>()
                .HasIndex(x => x.QuoteCode)
                .IsUnique();

            modelBuilder.Entity<Quote>()
                .Property(x => x.TotalAmount)
                .HasPrecision(18, 2);

            modelBuilder.Entity<Quote>()
                .Property(x => x.DiscountValue)
                .HasPrecision(18, 2);

            modelBuilder.Entity<Quote>()
                .Property(x => x.FinalAmount)
                .HasPrecision(18, 2);

            modelBuilder.Entity<Quote>()
                .HasOne(x => x.Customer)
                .WithMany(x => x.Quotes)
                .HasForeignKey(x => x.CustomerId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Quote>()
                .HasOne(x => x.Sales)
                .WithMany(x => x.QuotesAsSales)
                .HasForeignKey(x => x.SalesId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Quote>()
                .HasOne(x => x.Manager)
                .WithMany(x => x.QuotesAsManager)
                .HasForeignKey(x => x.ManagerId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<QuoteItem>()
                .Property(x => x.UnitPrice)
                .HasPrecision(18, 2);

            modelBuilder.Entity<QuoteItem>()
                .Property(x => x.SubTotal)
                .HasPrecision(18, 2);

            modelBuilder.Entity<Contract>()
                .HasIndex(x => x.ContractNumber)
                .IsUnique();

            modelBuilder.Entity<Contract>()
                .HasOne(x => x.Quote)
                .WithMany(x => x.Contracts)
                .HasForeignKey(x => x.QuoteId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Contract>()
                .HasOne(x => x.Customer)
                .WithMany(x => x.Contracts)
                .HasForeignKey(x => x.CustomerId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<CustomerOrder>()
                .Property(x => x.MerchandiseTotal)
                .HasPrecision(18, 2);

            modelBuilder.Entity<CustomerOrder>()
                .Property(x => x.DiscountTotal)
                .HasPrecision(18, 2);

            modelBuilder.Entity<CustomerOrder>()
                .Property(x => x.PayableTotal)
                .HasPrecision(18, 2);

            modelBuilder.Entity<CustomerOrder>()
                .HasIndex(x => x.OrderCode)
                .IsUnique();

            modelBuilder.Entity<CustomerOrder>()
                .HasOne(x => x.Customer)
                .WithMany(x => x.Orders)
                .HasForeignKey(x => x.CustomerId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<CustomerOrder>()
                .HasOne(x => x.Quote)
                .WithMany(x => x.Orders)
                .HasForeignKey(x => x.QuoteId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<CustomerOrder>()
                .HasOne(x => x.Contract)
                .WithMany(x => x.Orders)
                .HasForeignKey(x => x.ContractId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<CustomerOrder>()
                .HasOne(x => x.Sales)
                .WithMany(x => x.OrdersAsSales)
                .HasForeignKey(x => x.SalesId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<CustomerOrder>()
                .HasOne(x => x.Voucher)
                .WithMany(x => x.Orders)
                .HasForeignKey(x => x.VoucherId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<CustomerOrder>()
                .HasOne(x => x.ShippingAddress)
                .WithMany(x => x.OrdersShippedTo)
                .HasForeignKey(x => x.ShippingAddressId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<OrderStatusHistory>()
                .ToTable("OrderStatusHistory");
            modelBuilder.Entity<OrderStatusHistory>()
                .Property(x => x.FromStatus)
                .HasMaxLength(50);
            modelBuilder.Entity<OrderStatusHistory>()
                .Property(x => x.ToStatus)
                .HasMaxLength(50);
            modelBuilder.Entity<OrderStatusHistory>()
                .Property(x => x.Source)
                .HasMaxLength(50);
            modelBuilder.Entity<OrderStatusHistory>()
                .Property(x => x.Note)
                .HasMaxLength(1000);
            modelBuilder.Entity<OrderStatusHistory>()
                .HasOne(x => x.Order)
                .WithMany(x => x.StatusHistory)
                .HasForeignKey(x => x.OrderId)
                .OnDelete(DeleteBehavior.Cascade);
            modelBuilder.Entity<OrderStatusHistory>()
                .HasOne(x => x.ActorUser)
                .WithMany()
                .HasForeignKey(x => x.ActorUserId)
                .OnDelete(DeleteBehavior.SetNull);
            modelBuilder.Entity<OrderStatusHistory>()
                .HasIndex(x => new { x.OrderId, x.CreatedAt });

            modelBuilder.Entity<OrderItem>()
                .Property(x => x.PriceSnapshot)
                .HasPrecision(18, 2);

            modelBuilder.Entity<OrderItem>()
                .Property(x => x.SubTotal)
                .HasPrecision(18, 2);

            modelBuilder.Entity<Inventory>()
                .HasIndex(x => x.VariantId)
                .IsUnique();

            modelBuilder.Entity<FulfillmentTicket>()
                .HasOne(x => x.Order)
                .WithMany(x => x.FulfillmentTickets)
                .HasForeignKey(x => x.OrderId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<FulfillmentTicket>()
                .HasOne(x => x.AssignedWorker)
                .WithMany(x => x.FulfillmentTicketsAsWorker)
                .HasForeignKey(x => x.AssignedWorkerId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<FulfillmentTicket>()
                .HasOne(x => x.CreatedByUser)
                .WithMany(x => x.FulfillmentTicketsCreated)
                .HasForeignKey(x => x.CreatedBy)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<InventoryTransaction>()
                .HasOne(x => x.WorkerAssigned)
                .WithMany(x => x.InventoryTransactionsAsWorker)
                .HasForeignKey(x => x.WorkerIdAssigned)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<InventoryTransaction>()
                .HasOne(x => x.ManagerApproved)
                .WithMany(x => x.InventoryTransactionsAsManager)
                .HasForeignKey(x => x.ManagerIdApproved)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Invoice>()
                .HasIndex(x => x.InvoiceNumber)
                .IsUnique();

            modelBuilder.Entity<Invoice>()
                .HasOne(x => x.Order)
                .WithMany(x => x.Invoices)
                .HasForeignKey(x => x.OrderId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Invoice>()
                .HasOne(x => x.Contract)
                .WithMany(x => x.Invoices)
                .HasForeignKey(x => x.ContractId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Invoice>()
                .HasOne(x => x.Customer)
                .WithMany(x => x.Invoices)
                .HasForeignKey(x => x.CustomerId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Invoice>()
                .Property(x => x.SubTotal)
                .HasPrecision(18, 2);

            modelBuilder.Entity<Invoice>()
                .Property(x => x.TaxAmount)
                .HasPrecision(18, 2);

            modelBuilder.Entity<Invoice>()
                .Property(x => x.TotalAmount)
                .HasPrecision(18, 2);

            modelBuilder.Entity<PaymentTransaction>()
                .HasOne(x => x.Customer)
                .WithMany(x => x.PaymentTransactions)
                .HasForeignKey(x => x.CustomerId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<PaymentTransaction>()
                .HasOne(x => x.Invoice)
                .WithMany(x => x.PaymentTransactions)
                .HasForeignKey(x => x.InvoiceId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<PaymentTransaction>()
                .Property(x => x.Amount)
                .HasPrecision(18, 2);

            modelBuilder.Entity<Voucher>()
                .HasIndex(x => x.Code)
                .IsUnique();

            modelBuilder.Entity<Voucher>()
                .Property(x => x.DiscountValue)
                .HasPrecision(18, 2);

            modelBuilder.Entity<Voucher>()
                .Property(x => x.MinOrderValue)
                .HasPrecision(18, 2);

            modelBuilder.Entity<Voucher>()
                .Property(x => x.MaxDiscountAmount)
                .HasPrecision(18, 2);

            modelBuilder.Entity<WarrantyTicket>()
                .HasIndex(x => x.TicketNumber)
                .IsUnique();

            modelBuilder.Entity<WarrantyTicket>()
                .HasOne(x => x.Order)
                .WithMany(x => x.WarrantyTickets)
                .HasForeignKey(x => x.OrderId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<WarrantyTicket>()
                .HasOne(x => x.Contract)
                .WithMany(x => x.WarrantyTickets)
                .HasForeignKey(x => x.ContractId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<WarrantyTicket>()
                .HasOne(x => x.Customer)
                .WithMany(x => x.WarrantyTickets)
                .HasForeignKey(x => x.CustomerId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<WarrantyClaim>()
                .HasOne(x => x.WarrantyTicket)
                .WithMany(x => x.Claims)
                .HasForeignKey(x => x.WarrantyTicketId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<WarrantyClaim>()
                .HasOne(x => x.Variant)
                .WithMany(x => x.WarrantyClaims)
                .HasForeignKey(x => x.VariantId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<WarrantyClaim>()
                .HasOne(x => x.OrderItem)
                .WithMany(x => x.WarrantyClaims)
                .HasForeignKey(x => x.OrderItemId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<WarrantyClaim>()
                .Property(x => x.EstimatedCost)
                .HasPrecision(18, 2);

            modelBuilder.Entity<WarrantyTicketLine>()
                .HasIndex(x => new { x.WarrantyTicketId, x.OrderItemId })
                .IsUnique();

            modelBuilder.Entity<WarrantyTicketLine>()
                .HasOne(x => x.WarrantyTicket)
                .WithMany(x => x.Lines)
                .HasForeignKey(x => x.WarrantyTicketId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<WarrantyTicketLine>()
                .HasOne(x => x.OrderItem)
                .WithMany(x => x.WarrantyTicketLines)
                .HasForeignKey(x => x.OrderItemId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<WarrantyTicketLine>()
                .HasOne(x => x.Variant)
                .WithMany()
                .HasForeignKey(x => x.VariantId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<ReturnExchangeTicket>()
                .Property(x => x.RefundAmount)
                .HasPrecision(18, 2);

            modelBuilder.Entity<ReturnExchangeTicket>()
                .HasOne(x => x.Order)
                .WithMany(x => x.ReturnExchangeTickets)
                .HasForeignKey(x => x.OrderId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<ReturnExchangeTicket>()
                .HasOne(x => x.Customer)
                .WithMany(x => x.ReturnExchangeTickets)
                .HasForeignKey(x => x.CustomerId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<ReturnExchangeTicket>()
                .HasOne(x => x.ManagerApproved)
                .WithMany(x => x.ReturnTicketsApproved)
                .HasForeignKey(x => x.ManagerIdApproved)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<ReturnItem>()
                .HasOne(x => x.Ticket)
                .WithMany(x => x.Items)
                .HasForeignKey(x => x.TicketId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<ReturnItem>()
                .HasIndex(x => new { x.TicketId, x.OrderItemId });

            modelBuilder.Entity<ReturnItem>()
                .HasOne(x => x.OrderItem)
                .WithMany(x => x.ReturnItems)
                .HasForeignKey(x => x.OrderItemId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<ReturnItem>()
                .HasOne(x => x.VariantReturned)
                .WithMany(x => x.ReturnItemsReturned)
                .HasForeignKey(x => x.VariantIdReturned)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<ReturnItem>()
                .HasOne(x => x.VariantExchanged)
                .WithMany(x => x.ReturnItemsExchanged)
                .HasForeignKey(x => x.VariantIdExchanged)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<ReturnExchangeTicket>()
                .HasIndex(x => x.TicketNumber)
                .IsUnique();

            modelBuilder.Entity<ReturnExchangeTicket>()
                .HasOne(x => x.StockManager)
                .WithMany(x => x.ReturnTicketsAsStockManager)
                .HasForeignKey(x => x.StockManagerId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<TransferNotification>()
                .Property(x => x.Amount)
                .HasPrecision(18, 2);

            modelBuilder.Entity<TransferNotification>()
                .HasOne(x => x.Customer)
                .WithMany(x => x.TransferNotifications)
                .HasForeignKey(x => x.CustomerId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<TransferNotification>()
                .HasOne(x => x.Invoice)
                .WithMany(x => x.TransferNotifications)
                .HasForeignKey(x => x.InvoiceId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<TransferNotification>()
                .HasOne(x => x.ProcessedByUser)
                .WithMany(x => x.TransferNotificationsProcessed)
                .HasForeignKey(x => x.ProcessedBy)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<UserNotification>()
                .Property(x => x.RecipientKind).HasMaxLength(20);
            modelBuilder.Entity<UserNotification>()
                .Property(x => x.EventType).HasMaxLength(80);
            modelBuilder.Entity<UserNotification>()
                .Property(x => x.Title).HasMaxLength(300);
            modelBuilder.Entity<UserNotification>()
                .Property(x => x.EntityType).HasMaxLength(50);
            modelBuilder.Entity<UserNotification>()
                .Property(x => x.EntityId).HasMaxLength(100);
            modelBuilder.Entity<UserNotification>()
                .Property(x => x.DeepLinkPath).HasMaxLength(500);
            modelBuilder.Entity<UserNotification>()
                .Property(x => x.Priority).HasMaxLength(20);
            modelBuilder.Entity<UserNotification>()
                .HasIndex(x => new { x.RecipientKind, x.RecipientId, x.ReadAt, x.CreatedAt });
        }
    }
}
