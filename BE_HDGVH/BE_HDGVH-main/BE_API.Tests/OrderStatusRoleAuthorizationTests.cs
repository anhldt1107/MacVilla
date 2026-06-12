using BE_API.Authorization;
using BE_API.Domain;
using BE_API.Entities;
using Xunit;

namespace BE_API.Tests;

public class OrderStatusRoleAuthorizationTests
{
    private static CustomerOrder OrderWithSales(int salesId, string status = OrderStatuses.Shipped) =>
        new()
        {
            Id = 1,
            OrderCode = "ORD-TEST",
            CustomerId = 10,
            SalesId = salesId,
            OrderStatus = status,
        };

    [Fact]
    public void Sales_from_Shipped_allows_Delivered_only()
    {
        var allowed = OrderStatusAuthorization.GetAllowedOrderTransitionsForRole(
            OrderStatuses.Shipped, AppRoles.Sales);
        Assert.Single(allowed);
        Assert.Equal(OrderStatuses.Delivered, allowed[0]);
    }

    [Fact]
    public void Sales_from_Delivered_allows_nothing()
    {
        var allowed = OrderStatusAuthorization.GetAllowedOrderTransitionsForRole(
            OrderStatuses.Delivered, AppRoles.Sales);
        Assert.Empty(allowed);
    }

    [Fact]
    public void Manager_from_Shipped_allows_Delivered()
    {
        var allowed = OrderStatusAuthorization.GetAllowedOrderTransitionsForRole(
            OrderStatuses.Shipped, AppRoles.Manager);
        Assert.Contains(OrderStatuses.Delivered, allowed);
    }

    [Fact]
    public void Admin_from_Shipped_allows_Delivered()
    {
        var allowed = OrderStatusAuthorization.GetAllowedOrderTransitionsForRole(
            OrderStatuses.Shipped, AppRoles.Admin);
        Assert.Contains(OrderStatuses.Delivered, allowed);
    }

    [Fact]
    public void Manager_from_Delivered_allows_Completed()
    {
        var allowed = OrderStatusAuthorization.GetAllowedOrderTransitionsForRole(
            OrderStatuses.Delivered, AppRoles.Manager);
        Assert.Contains(OrderStatuses.Completed, allowed);
    }

    [Fact]
    public void Admin_from_Delivered_allows_Completed()
    {
        var allowed = OrderStatusAuthorization.GetAllowedOrderTransitionsForRole(
            OrderStatuses.Delivered, AppRoles.Admin);
        Assert.Contains(OrderStatuses.Completed, allowed);
    }

    [Fact]
    public void Worker_and_StockManager_have_no_transitions()
    {
        Assert.Empty(OrderStatusAuthorization.GetAllowedOrderTransitionsForRole(
            OrderStatuses.Shipped, AppRoles.Worker));
        Assert.Empty(OrderStatusAuthorization.GetAllowedOrderTransitionsForRole(
            OrderStatuses.Delivered, AppRoles.StockManager));
    }

    [Fact]
    public void Sales_can_update_own_order_Shipped_to_Delivered()
    {
        var order = OrderWithSales(salesId: 5);
        OrderStatusAuthorization.ValidateOrderStatusUpdate(
            order, OrderStatuses.Delivered, AppRoles.Sales, callerUserId: 5);
    }

    [Fact]
    public void Sales_rejects_other_sales_order()
    {
        var order = OrderWithSales(salesId: 5);
        var ex = Assert.Throws<UnauthorizedAccessException>(() =>
            OrderStatusAuthorization.ValidateOrderStatusUpdate(
                order, OrderStatuses.Delivered, AppRoles.Sales, callerUserId: 99));
        Assert.Contains("phụ trách", ex.Message, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public void Sales_rejects_Completed()
    {
        var order = OrderWithSales(salesId: 5, status: OrderStatuses.Delivered);
        var ex = Assert.Throws<UnauthorizedAccessException>(() =>
            OrderStatusAuthorization.ValidateOrderStatusUpdate(
                order, OrderStatuses.Completed, AppRoles.Sales, callerUserId: 5));
        Assert.Contains("không được phép", ex.Message, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public void Sales_rejects_Cancelled_from_Processing()
    {
        var order = OrderWithSales(salesId: 5, status: OrderStatuses.Processing);
        var ex = Assert.Throws<UnauthorizedAccessException>(() =>
            OrderStatusAuthorization.ValidateOrderStatusUpdate(
                order, OrderStatuses.Cancelled, AppRoles.Sales, callerUserId: 5));
        Assert.Contains("không được phép", ex.Message, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public void Manager_can_update_Delivered_to_Completed()
    {
        var order = OrderWithSales(salesId: 5, status: OrderStatuses.Delivered);
        OrderStatusAuthorization.ValidateOrderStatusUpdate(
            order, OrderStatuses.Completed, AppRoles.Manager, callerUserId: 1);
    }

    [Fact]
    public void Manager_can_update_Shipped_to_Delivered()
    {
        var order = OrderWithSales(salesId: 5);
        OrderStatusAuthorization.ValidateOrderStatusUpdate(
            order, OrderStatuses.Delivered, AppRoles.Manager, callerUserId: 1);
    }

    [Fact]
    public void Admin_can_update_Shipped_to_Delivered()
    {
        var order = OrderWithSales(salesId: 5);
        OrderStatusAuthorization.ValidateOrderStatusUpdate(
            order, OrderStatuses.Delivered, AppRoles.Admin, callerUserId: 1);
    }
}
