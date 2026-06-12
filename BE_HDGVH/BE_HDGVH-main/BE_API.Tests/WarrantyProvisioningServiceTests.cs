using BE_API.Database;
using BE_API.Domain;
using BE_API.Entities;
using BE_API.Service;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace BE_API.Tests;

public class WarrantyProvisioningServiceTests : IDisposable
{
    private readonly BeContext _ctx;
    private readonly WarrantyProvisioningService _service;

    public WarrantyProvisioningServiceTests()
    {
        var options = new DbContextOptionsBuilder<BeContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        _ctx = new BeContext(options);
        _ctx.Database.EnsureCreated();
        _service = new WarrantyProvisioningService(_ctx);
    }

    [Fact]
    public void ResolveMonthsForOrderItem_uses_product_months()
    {
        var line = new OrderItem
        {
            Variant = new ProductVariant
            {
                Product = new Product { WarrantyPeriodMonths = 18 },
            },
        };
        Assert.Equal(18, WarrantyCoverageRules.ResolveMonthsForOrderItem(line));
    }

    [Fact]
    public async Task EnsureWarrantyTicket_creates_lines_per_order_item()
    {
        SeedMultiLineOrder();
        var before = DateTime.UtcNow;

        await _service.EnsureWarrantyTicketForOrderAsync(orderId: 1);

        var ticket = await _ctx.WarrantyTickets.Include(t => t.Lines).SingleAsync(t => t.OrderId == 1);
        Assert.Equal(2, ticket.Lines.Count);

        var line12 = ticket.Lines.Single(l => l.OrderItemId == 1);
        var line24 = ticket.Lines.Single(l => l.OrderItemId == 2);
        Assert.Equal(12, line12.WarrantyPeriodMonths);
        Assert.Equal(24, line24.WarrantyPeriodMonths);
        Assert.True(line24.ValidUntil > line12.ValidUntil);
        Assert.Equal(line24.ValidUntil, ticket.ValidUntil);
        Assert.True(line12.ValidUntil >= before.AddMonths(11));
        Assert.True(line24.ValidUntil >= before.AddMonths(23));
    }

    [Fact]
    public async Task EnsureWarrantyTicket_is_idempotent()
    {
        SeedMultiLineOrder();

        await _service.EnsureWarrantyTicketForOrderAsync(orderId: 1);
        await _service.EnsureWarrantyTicketForOrderAsync(orderId: 1);

        Assert.Equal(1, await _ctx.WarrantyTickets.CountAsync(t => t.OrderId == 1));
        Assert.Equal(2, await _ctx.WarrantyTicketLines.CountAsync());
    }

    private void SeedMultiLineOrder()
    {
        var cat = new Category { Id = 1, Name = "Cat", Slug = "cat" };
        var product12 = new Product
        {
            Id = 100,
            CategoryId = 1,
            Name = "Short",
            Slug = "short",
            WarrantyPeriodMonths = 12,
            Status = ProductStatus.Active,
        };
        var product24 = new Product
        {
            Id = 101,
            CategoryId = 1,
            Name = "Long",
            Slug = "long",
            WarrantyPeriodMonths = 24,
            Status = ProductStatus.Active,
        };
        var variant12 = new ProductVariant
        {
            Id = 200,
            ProductId = 100,
            Sku = "SKU-12",
            VariantName = "12m",
            RetailPrice = 1000m,
            CostPrice = 500m,
        };
        var variant24 = new ProductVariant
        {
            Id = 201,
            ProductId = 101,
            Sku = "SKU-24",
            VariantName = "24m",
            RetailPrice = 2000m,
            CostPrice = 1000m,
        };
        var customer = new Customer { Id = 10, CustomerType = "B2B", FullName = "Acme" };
        var order = new CustomerOrder
        {
            Id = 1,
            OrderCode = "ORD-WRT",
            CustomerId = 10,
            OrderStatus = OrderStatuses.Delivered,
            CreatedAt = DateTime.UtcNow,
            MerchandiseTotal = 3000m,
            PayableTotal = 3000m,
        };

        _ctx.Categories.Add(cat);
        _ctx.Products.AddRange(product12, product24);
        _ctx.ProductVariants.AddRange(variant12, variant24);
        _ctx.Customers.Add(customer);
        _ctx.CustomerOrders.Add(order);
        _ctx.OrderItems.AddRange(
            new OrderItem
            {
                Id = 1,
                OrderId = 1,
                VariantId = 200,
                SkuSnapshot = "SKU-12",
                Quantity = 1,
                PriceSnapshot = 1000m,
                SubTotal = 1000m,
            },
            new OrderItem
            {
                Id = 2,
                OrderId = 1,
                VariantId = 201,
                SkuSnapshot = "SKU-24",
                Quantity = 1,
                PriceSnapshot = 2000m,
                SubTotal = 2000m,
            });
        _ctx.SaveChanges();
    }

    public void Dispose() => _ctx.Dispose();
}
