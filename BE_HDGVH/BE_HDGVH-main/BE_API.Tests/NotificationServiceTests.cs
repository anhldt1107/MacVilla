using BE_API.Authorization;
using BE_API.Database;
using BE_API.Domain;
using BE_API.Entities;
using BE_API.Service;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Xunit;

namespace BE_API.Tests;

public class NotificationServiceTests : IDisposable
{
    private readonly BeContext _ctx;
    private readonly NotificationService _service;
    private readonly NotificationBusinessEmitter _emitter;

    public NotificationServiceTests()
    {
        var options = new DbContextOptionsBuilder<BeContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .ConfigureWarnings(w => w.Ignore(InMemoryEventId.TransactionIgnoredWarning))
            .Options;
        _ctx = new BeContext(options);
        _ctx.Database.EnsureCreated();
        _service = new NotificationService(_ctx);
        _emitter = new NotificationBusinessEmitter(_ctx, _service);
        SeedData();
    }

    [Fact]
    public async Task NotifyStaffByRolesAsync_fans_out_to_active_users_in_roles()
    {
        await _service.NotifyStaffByRolesAsync(
            [AppRoles.Manager],
            NotificationEventTypes.QuotePendingApproval,
            "Test",
            null,
            "Quote",
            "1",
            _ => "/manager/sales/quotations/1");

        var rows = await _ctx.UserNotifications.AsNoTracking().ToListAsync();
        Assert.Equal(2, rows.Count);
        Assert.All(rows, r =>
        {
            Assert.Equal(NotificationRecipientKinds.Staff, r.RecipientKind);
            Assert.Equal(NotificationEventTypes.QuotePendingApproval, r.EventType);
            Assert.Null(r.ReadAt);
        });
        Assert.Contains(rows, r => r.RecipientId == 10);
        Assert.Contains(rows, r => r.RecipientId == 11);
    }

    [Fact]
    public async Task NotifyStaffUserAsync_dedupes_within_five_minutes()
    {
        await _service.NotifyStaffUserAsync(
            10,
            NotificationEventTypes.QuoteApproved,
            "Dup",
            null,
            "Quote",
            "99",
            "/saler/quotations/99");
        await _service.NotifyStaffUserAsync(
            10,
            NotificationEventTypes.QuoteApproved,
            "Dup again",
            null,
            "Quote",
            "99",
            "/saler/quotations/99");

        var count = await _ctx.UserNotifications.CountAsync();
        Assert.Equal(1, count);
    }

    [Fact]
    public async Task OnQuoteSubmittedForApprovalAsync_creates_manager_notifications_with_deep_link()
    {
        await _emitter.OnQuoteSubmittedForApprovalAsync(100);

        var rows = await _ctx.UserNotifications.AsNoTracking()
            .Where(n => n.EventType == NotificationEventTypes.QuotePendingApproval)
            .ToListAsync();

        Assert.NotEmpty(rows);
        Assert.Contains(rows, n => n.DeepLinkPath == "/manager/sales/quotations/100");
        Assert.Contains(rows, n => n.Title.Contains("BG-100"));
    }

    [Fact]
    public async Task OnQuoteCustomerRejectedAsync_notifies_sales()
    {
        await _emitter.OnQuoteCustomerRejectedAsync(101);

        var row = await _ctx.UserNotifications.AsNoTracking().SingleAsync();
        Assert.Equal(NotificationEventTypes.QuoteCustomerRejected, row.EventType);
        Assert.Equal(40, row.RecipientId);
        Assert.Equal("/saler/quotations/101", row.DeepLinkPath);
    }

    [Fact]
    public async Task OnOrderCreatedAsync_notifies_sales_and_stock_manager()
    {
        await _emitter.OnOrderCreatedAsync(200);

        var rows = await _ctx.UserNotifications.AsNoTracking()
            .Where(n => n.EventType == NotificationEventTypes.OrderCreated)
            .ToListAsync();

        Assert.Equal(3, rows.Count);
        Assert.Contains(rows, r => r.RecipientId == 40 && r.DeepLinkPath == "/saler/orders/200");
        Assert.Contains(rows, r => r.RecipientId == 60);
        Assert.Contains(rows, r => r.RecipientKind == NotificationRecipientKinds.Customer && r.DeepLinkPath == "/partner/orders/ORD-200");
    }

    [Fact]
    public async Task OnOrderStatusChangedAsync_notifies_customer_on_delivered()
    {
        await _emitter.OnOrderStatusChangedAsync(201, OrderStatuses.Shipped, OrderStatuses.Delivered);

        var customerRow = await _ctx.UserNotifications.AsNoTracking().SingleAsync();
        Assert.Equal(NotificationRecipientKinds.Customer, customerRow.RecipientKind);
        Assert.Equal(NotificationEventTypes.OrderStatusChanged, customerRow.EventType);
        Assert.Equal("/account/orders/ORD-201", customerRow.DeepLinkPath);
    }

    [Fact]
    public async Task OnOrderStatusChangedAsync_skips_processing_to_ready_to_ship()
    {
        await _emitter.OnOrderStatusChangedAsync(201, OrderStatuses.Processing, OrderStatuses.ReadyToShip);

        var count = await _ctx.UserNotifications.CountAsync();
        Assert.Equal(0, count);
    }

    [Fact]
    public async Task OnReturnCompletedAsync_notifies_customer()
    {
        await _emitter.OnReturnCompletedAsync(300);

        var row = await _ctx.UserNotifications.AsNoTracking().SingleAsync();
        Assert.Equal(NotificationEventTypes.ReturnCompleted, row.EventType);
        Assert.Equal(51, row.RecipientId);
        Assert.Equal("/account/returns/300", row.DeepLinkPath);
    }

    [Fact]
    public async Task OnWarrantyClaimUpdatedAsync_uses_b2c_warranty_path()
    {
        await _emitter.OnWarrantyClaimUpdatedAsync(400);

        var row = await _ctx.UserNotifications.AsNoTracking().SingleAsync();
        Assert.Equal(NotificationEventTypes.WarrantyClaimUpdated, row.EventType);
        Assert.Equal("/account/warranty/WT-B2C", row.DeepLinkPath);
    }

    public void Dispose() => _ctx.Dispose();

    private void SeedData()
    {
        var managerRole = new Role { Id = 1, RoleName = AppRoles.Manager };
        var adminRole = new Role { Id = 2, RoleName = AppRoles.Admin };
        var salesRole = new Role { Id = 3, RoleName = AppRoles.Sales };
        var stockRole = new Role { Id = 4, RoleName = AppRoles.StockManager };
        _ctx.Roles.AddRange(managerRole, adminRole, salesRole, stockRole);
        _ctx.AppUsers.AddRange(
            new AppUser { Id = 10, Username = "mgr1", PasswordHash = "x", FullName = "Manager 1", Status = "Active", RoleId = 1 },
            new AppUser { Id = 11, Username = "mgr2", PasswordHash = "x", FullName = "Manager 2", Status = "Active", RoleId = 1 },
            new AppUser { Id = 20, Username = "adm1", PasswordHash = "x", FullName = "Admin 1", Status = "Active", RoleId = 2 },
            new AppUser { Id = 30, Username = "inactive", PasswordHash = "x", FullName = "Inactive", Status = "Inactive", RoleId = 1 },
            new AppUser { Id = 40, Username = "sales1", PasswordHash = "x", FullName = "Sales 1", Status = "Active", RoleId = 3 },
            new AppUser { Id = 60, Username = "stock1", PasswordHash = "x", FullName = "Stock 1", Status = "Active", RoleId = 4 });

        _ctx.Customers.AddRange(
            new Customer { Id = 50, FullName = "B2B Co", Email = "b2b@test.com", CustomerType = CustomerTypes.B2B },
            new Customer { Id = 51, FullName = "B2C User", Email = "b2c@test.com", CustomerType = CustomerTypes.B2C });

        _ctx.Quotes.AddRange(
            new Quote { Id = 100, QuoteCode = "BG-100", CustomerId = 50, Status = QuoteStatuses.PendingApproval },
            new Quote { Id = 101, QuoteCode = "BG-101", CustomerId = 50, SalesId = 40, Status = QuoteStatuses.CustomerRejected, CustomerRejectReason = "Giá cao" });

        _ctx.CustomerOrders.AddRange(
            new CustomerOrder
            {
                Id = 200,
                OrderCode = "ORD-200",
                CustomerId = 50,
                QuoteId = 101,
                SalesId = 40,
                OrderStatus = OrderStatuses.Confirmed,
                PaymentStatus = PaymentStatuses.Unpaid
            },
            new CustomerOrder
            {
                Id = 201,
                OrderCode = "ORD-201",
                CustomerId = 51,
                OrderStatus = OrderStatuses.Shipped,
                PaymentStatus = PaymentStatuses.Paid
            });

        _ctx.ReturnExchangeTickets.Add(new ReturnExchangeTicket
        {
            Id = 300,
            TicketNumber = "RT-300",
            OrderId = 201,
            CustomerId = 51,
            Type = ReturnTypes.Return,
            Reason = "Lỗi",
            Status = ReturnTicketStatuses.Completed
        });

        _ctx.WarrantyTickets.Add(new WarrantyTicket
        {
            Id = 500,
            TicketNumber = "WT-B2C",
            CustomerId = 51,
            Status = WarrantyTicketStatuses.Active,
            IssueDate = DateTime.UtcNow
        });

        _ctx.WarrantyClaims.Add(new WarrantyClaim
        {
            Id = 400,
            WarrantyTicketId = 500,
            VariantId = 1,
            Status = WarrantyClaimStatuses.Completed,
            Resolution = "Đã sửa xong"
        });

        _ctx.SaveChanges();
    }
}
