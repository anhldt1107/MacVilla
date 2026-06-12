using BE_API.Authorization;
using BE_API.Domain;
using BE_API.Service;
using Xunit;

namespace BE_API.Tests;

public class NotificationDeepLinkBuilderTests
{
    [Theory]
    [InlineData(AppRoles.Admin, "/admin")]
    [InlineData(AppRoles.Manager, "/manager")]
    [InlineData(AppRoles.Sales, "/saler")]
    [InlineData(AppRoles.StockManager, "/stock-manager")]
    [InlineData(AppRoles.Worker, "/worker")]
    [InlineData("unknown", "/admin")]
    public void StaffShellPrefix_maps_role_to_shell(string role, string expected)
    {
        Assert.Equal(expected, NotificationDeepLinkBuilder.StaffShellPrefix(role));
    }

    [Theory]
    [InlineData(CustomerTypes.B2B, "/partner")]
    [InlineData(CustomerTypes.B2C, "/account")]
    [InlineData(null, "/account")]
    public void CustomerPrefix_branches_by_customer_type(string? customerType, string expected)
    {
        Assert.Equal(expected, NotificationDeepLinkBuilder.CustomerPrefix(customerType));
    }

    [Fact]
    public void QuoteForStaff_manager_uses_pending_queue_path()
    {
        Assert.Equal("/manager/sales/quotations/42", NotificationDeepLinkBuilder.QuoteForStaff(AppRoles.Manager, 42));
    }

    [Fact]
    public void QuoteForStaff_sales_uses_saler_quotations()
    {
        Assert.Equal("/saler/quotations/7", NotificationDeepLinkBuilder.QuoteForStaff(AppRoles.Sales, 7));
    }

    [Fact]
    public void ReturnForStaff_stock_manager_uses_returns_path()
    {
        Assert.Equal("/stock-manager/returns/5", NotificationDeepLinkBuilder.ReturnForStaff(AppRoles.StockManager, 5));
    }

    [Fact]
    public void OrderForCustomer_B2B_uses_partner_prefix()
    {
        Assert.Equal("/partner/orders/ORD-001", NotificationDeepLinkBuilder.OrderForCustomer(CustomerTypes.B2B, "ORD-001"));
    }

    [Fact]
    public void OrderForCustomer_B2C_uses_account_prefix()
    {
        Assert.Equal("/account/orders/ORD-002", NotificationDeepLinkBuilder.OrderForCustomer(CustomerTypes.B2C, "ORD-002"));
    }
}
