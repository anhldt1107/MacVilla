using BE_API.Authorization;
using BE_API.Domain;
using BE_API.Entities;
using BE_API.Service;
using Xunit;

namespace BE_API.Tests;

public class OrderFulfillmentOrchestrationTests
{
    [Fact]
    public void TryAdvanceOrderOnCreate_from_Confirmed_sets_Processing()
    {
        var order = new CustomerOrder { OrderStatus = OrderStatuses.Confirmed };
        OrderFulfillmentWorkflow.TryAdvanceOrderOnCreate(order);
        Assert.Equal(OrderStatuses.Processing, order.OrderStatus);
        Assert.NotNull(order.UpdatedAt);
    }

    [Fact]
    public void TryAdvanceOrderOnCreate_from_Processing_unchanged()
    {
        var order = new CustomerOrder { OrderStatus = OrderStatuses.Processing };
        OrderFulfillmentWorkflow.TryAdvanceOrderOnCreate(order);
        Assert.Equal(OrderStatuses.Processing, order.OrderStatus);
    }

    [Fact]
    public void Packed_advances_order_to_ReadyToShip()
    {
        var order = new CustomerOrder { OrderStatus = OrderStatuses.Processing };
        OrderFulfillmentWorkflow.TryAdvanceOrderOnFulfillmentStatus(order, FulfillmentStatuses.Packed);
        Assert.Equal(OrderStatuses.ReadyToShip, order.OrderStatus);
    }

    [Fact]
    public void Shipped_advances_order_to_Shipped_when_ReadyToShip()
    {
        var order = new CustomerOrder { OrderStatus = OrderStatuses.ReadyToShip };
        OrderFulfillmentWorkflow.TryAdvanceOrderOnFulfillmentStatus(order, FulfillmentStatuses.Shipped);
        Assert.Equal(OrderStatuses.Shipped, order.OrderStatus);
    }

    [Fact]
    public void Shipped_with_Pickup_advances_order_to_Delivered()
    {
        var order = new CustomerOrder { OrderStatus = OrderStatuses.ReadyToShip };
        var delivered = OrderFulfillmentWorkflow.TryAdvanceOrderOnFulfillmentStatus(
            order, FulfillmentStatuses.Shipped, ticketType: "Pickup");
        Assert.True(delivered);
        Assert.Equal(OrderStatuses.Delivered, order.OrderStatus);
    }

    [Fact]
    public void Shipped_with_Standard_stays_Shipped()
    {
        var order = new CustomerOrder { OrderStatus = OrderStatuses.ReadyToShip };
        var delivered = OrderFulfillmentWorkflow.TryAdvanceOrderOnFulfillmentStatus(
            order, FulfillmentStatuses.Shipped, ticketType: "Standard");
        Assert.False(delivered);
        Assert.Equal(OrderStatuses.Shipped, order.OrderStatus);
    }

    [Theory]
    [InlineData("pickup")]
    [InlineData("PICKUP")]
    public void IsPickupTicketType_is_case_insensitive(string ticketType)
    {
        Assert.True(OrderFulfillmentWorkflow.IsPickupTicketType(ticketType));
    }

    [Fact]
    public void Shipped_throws_when_order_not_ReadyToShip()
    {
        var order = new CustomerOrder { OrderStatus = OrderStatuses.Processing };
        var ex = Assert.Throws<InvalidOperationException>(() =>
            OrderFulfillmentWorkflow.TryAdvanceOrderOnFulfillmentStatus(order, FulfillmentStatuses.Shipped));
        Assert.Contains("ReadyToShip", ex.Message);
    }

    [Fact]
    public void ValidateOrderAllowsCreate_blocks_Completed()
    {
        var order = new CustomerOrder { OrderStatus = OrderStatuses.Completed };
        var ex = Assert.Throws<InvalidOperationException>(() =>
            OrderFulfillmentWorkflow.ValidateOrderAllowsCreate(order));
        Assert.Contains("hoàn tất", ex.Message, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public void ValidateNoActiveFulfillment_blocks_second_active_ticket()
    {
        var tickets = new[]
        {
            new FulfillmentTicket { Status = FulfillmentStatuses.Pending },
        };
        var ex = Assert.Throws<InvalidOperationException>(() =>
            OrderFulfillmentWorkflow.ValidateNoActiveFulfillment(tickets));
        Assert.Contains("đang xử lý", ex.Message, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public void Picking_requires_assigned_worker()
    {
        var ticket = new FulfillmentTicket { Status = FulfillmentStatuses.Pending, AssignedWorkerId = null };
        var ex = Assert.Throws<InvalidOperationException>(() =>
            OrderFulfillmentWorkflow.ValidateBeforeFulfillmentStatusChange(ticket, FulfillmentStatuses.Picking));
        Assert.Contains("Worker", ex.Message);
    }

    [Fact]
    public void IsWorkerRole_accepts_Worker_only()
    {
        Assert.True(OrderFulfillmentWorkflow.IsWorkerRole(AppRoles.Worker));
        Assert.False(OrderFulfillmentWorkflow.IsWorkerRole(AppRoles.Admin));
        Assert.False(OrderFulfillmentWorkflow.IsWorkerRole(null));
    }

    [Fact]
    public void BuildOrderWarnings_B2B_unpaid()
    {
        var order = new CustomerOrder { PaymentStatus = PaymentStatuses.Unpaid };
        var customer = new Customer { CustomerType = "B2B" };
        var warnings = OrderFulfillmentWorkflow.BuildOrderWarnings(order, customer);
        Assert.Single(warnings);
        Assert.Contains("B2B", warnings[0]);
    }

    [Fact]
    public void FulfillmentInventoryOut_reference_id_is_ticket_id()
    {
        Assert.Equal("42", FulfillmentInventoryOutService.ReferenceIdFor(42));
    }

    [Fact]
    public void GetAllowedOrderTransitions_from_Shipped_includes_Delivered_only()
    {
        var next = OrderFulfillmentWorkflow.GetAllowedOrderTransitions(OrderStatuses.Shipped);
        Assert.Contains(OrderStatuses.Delivered, next);
        Assert.DoesNotContain(OrderStatuses.Completed, next);
    }
}
