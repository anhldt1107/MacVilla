using BE_API.Database;
using BE_API.Domain;
using BE_API.Dto.Admin;
using BE_API.Entities;
using BE_API.Service;
using BE_API.Service.IService;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Moq;
using Xunit;

namespace BE_API.Tests;

public class AdminReturnServiceTests : IDisposable
{
    private readonly BeContext _ctx;
    private readonly AdminReturnService _service;
    private readonly AfterSalesQuantityService _quantityService;

    public AdminReturnServiceTests()
    {
        var options = new DbContextOptionsBuilder<BeContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .ConfigureWarnings(w => w.Ignore(InMemoryEventId.TransactionIgnoredWarning))
            .Options;
        _ctx = new BeContext(options);
        _ctx.Database.EnsureCreated();
        _quantityService = new AfterSalesQuantityService(_ctx);

        var paymentMock = new Mock<IAdminPaymentService>();
        paymentMock
            .Setup(p => p.CreateRefundAsync(It.IsAny<AdminPaymentRefundDto>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new AdminPaymentDetailDto { Id = 99, Amount = 1000 });

        var notificationService = new NotificationService(_ctx);
        var notificationEmitter = new NotificationBusinessEmitter(_ctx, notificationService);
        _service = new AdminReturnService(_ctx, _quantityService, paymentMock.Object, notificationEmitter);
        SeedReturnScenario();
    }

    [Fact]
    public async Task CompleteAsync_requires_ItemsReceived()
    {
        var ex = await Assert.ThrowsAsync<InvalidOperationException>(() =>
            _service.CompleteAsync(1, 1, new AdminReturnCompleteDto
            {
                Items = [new AdminReturnItemCompleteDto { ReturnItemId = 1, InventoryAction = InventoryActions.Restock }]
            }));
        Assert.Contains("ItemsReceived", ex.Message);
    }

    [Fact]
    public async Task Full_flow_increases_QuantityAvailable_on_restock()
    {
        await _service.StartProcessingAsync(1, 2, new AdminReturnTransitionDto(), CancellationToken.None);
        await _service.ReceiveItemsAsync(1, 2, new AdminReturnTransitionDto(), CancellationToken.None);

        var before = await _ctx.Inventories.AsNoTracking().SingleAsync(i => i.VariantId == 200);

        await _service.CompleteAsync(1, 2, new AdminReturnCompleteDto
        {
            CreateRefund = false,
            Items = [new AdminReturnItemCompleteDto { ReturnItemId = 1, InventoryAction = InventoryActions.Restock }]
        });

        var after = await _ctx.Inventories.AsNoTracking().SingleAsync(i => i.VariantId == 200);
        Assert.Equal(before.QuantityAvailable + 1, after.QuantityAvailable);

        var ticket = await _ctx.ReturnExchangeTickets.AsNoTracking().SingleAsync(t => t.Id == 1);
        Assert.Equal(ReturnTicketStatuses.Completed, ticket.Status);

        var line = await _ctx.WarrantyTicketLines.SingleAsync(l => l.OrderItemId == 1);
        Assert.Equal(1, line.Quantity);
    }

    [Fact]
    public async Task CreateAsync_rejects_when_active_claim_blocks()
    {
        await _ctx.WarrantyClaims.AddAsync(new WarrantyClaim
        {
            WarrantyTicketId = 1,
            OrderItemId = 1,
            VariantId = 200,
            DefectDescription = "Lỗi",
            Status = WarrantyClaimStatuses.PendingCheck,
            CreatedAt = DateTime.UtcNow
        });
        await _ctx.SaveChangesAsync();

        var ex = await Assert.ThrowsAsync<InvalidOperationException>(() =>
            _service.CreateAsync(new AdminReturnCreateDto
            {
                OrderId = 1,
                Type = ReturnTypes.Return,
                Items =
                [
                    new AdminReturnItemCreateDto { OrderItemId = 1, VariantIdReturned = 200, Quantity = 1 }
                ]
            }));
        Assert.Contains("đổi/trả", ex.Message);
    }

    private void SeedReturnScenario()
    {
        var cat = new Category { Id = 1, Name = "Cat", Slug = "cat" };
        var product = new Product
        {
            Id = 1,
            CategoryId = 1,
            Name = "Item",
            Slug = "item",
            WarrantyPeriodMonths = 12,
            Status = ProductStatus.Active
        };
        var variant = new ProductVariant
        {
            Id = 200,
            ProductId = 1,
            Sku = "SKU-1",
            VariantName = "V1",
            RetailPrice = 1000m,
            CostPrice = 500m
        };
        var customer = new Customer { Id = 10, CustomerType = "B2B", FullName = "Acme" };
        var order = new CustomerOrder
        {
            Id = 1,
            OrderCode = "ORD-R1",
            CustomerId = 10,
            OrderStatus = OrderStatuses.Delivered,
            PaymentStatus = "Paid",
            CreatedAt = DateTime.UtcNow,
            MerchandiseTotal = 2000m,
            PayableTotal = 2000m
        };
        var orderItem = new OrderItem
        {
            Id = 1,
            OrderId = 1,
            VariantId = 200,
            Quantity = 2,
            PriceSnapshot = 1000m,
            SubTotal = 2000m
        };
        var manager = new AppUser { Id = 1, Username = "mgr", FullName = "Mgr", Email = "m@test.com", PasswordHash = "x", RoleId = 1 };
        var stock = new AppUser { Id = 2, Username = "stock", FullName = "Stock", Email = "s@test.com", PasswordHash = "x", RoleId = 2 };
        var inventory = new Inventory
        {
            Id = 1,
            VariantId = 200,
            QuantityOnHand = 5,
            QuantityReserved = 0,
            QuantityAvailable = 5
        };
        var ticket = new ReturnExchangeTicket
        {
            Id = 1,
            TicketNumber = "RTN-TEST-1",
            OrderId = 1,
            CustomerId = 10,
            Type = ReturnTypes.Return,
            Status = ReturnTicketStatuses.Approved,
            RefundAmount = 1000m,
            ManagerIdApproved = 1,
            CreatedAt = DateTime.UtcNow,
            ApprovedAt = DateTime.UtcNow
        };
        var returnItem = new ReturnItem
        {
            Id = 1,
            TicketId = 1,
            OrderItemId = 1,
            VariantIdReturned = 200,
            Quantity = 1
        };
        var warrantyTicket = new WarrantyTicket
        {
            Id = 1,
            TicketNumber = "WT-1",
            OrderId = 1,
            CustomerId = 10,
            Status = WarrantyTicketStatuses.Active,
            IssueDate = DateTime.UtcNow,
            ValidUntil = DateTime.UtcNow.AddMonths(12)
        };
        var warrantyLine = new WarrantyTicketLine
        {
            Id = 1,
            WarrantyTicketId = 1,
            OrderItemId = 1,
            VariantId = 200,
            Quantity = 2,
            IssueDate = DateTime.UtcNow,
            ValidUntil = DateTime.UtcNow.AddMonths(12),
            WarrantyPeriodMonths = 12
        };

        _ctx.AddRange(cat, product, variant, customer, order, orderItem, manager, stock, inventory, ticket, returnItem, warrantyTicket, warrantyLine);
        _ctx.SaveChanges();
    }

    public void Dispose() => _ctx.Dispose();
}
