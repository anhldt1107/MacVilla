using BE_API.Authorization;
using BE_API.Entities;

namespace BE_API.Domain;

/// <summary>
/// Quy tắc đồng bộ đơn hàng ↔ phiếu công việc (fulfillment).
/// </summary>
public static class OrderFulfillmentWorkflow
{
    public const string InventoryReferenceType = "Fulfillment";

    public static bool IsActiveFulfillmentStatus(string? status)
    {
        if (string.IsNullOrWhiteSpace(status)) return false;
        return string.Equals(status, FulfillmentStatuses.Pending, StringComparison.OrdinalIgnoreCase)
               || string.Equals(status, FulfillmentStatuses.Picking, StringComparison.OrdinalIgnoreCase)
               || string.Equals(status, FulfillmentStatuses.Packed, StringComparison.OrdinalIgnoreCase);
    }

    public static void ValidateOrderAllowsCreate(CustomerOrder order)
    {
        if (string.Equals(order.OrderStatus, OrderStatuses.Cancelled, StringComparison.OrdinalIgnoreCase))
            throw new InvalidOperationException("Không thể tạo phiếu xuất kho cho đơn hàng đã hủy");

        if (string.Equals(order.OrderStatus, OrderStatuses.New, StringComparison.OrdinalIgnoreCase)
            || string.Equals(order.OrderStatus, OrderStatuses.AwaitingPayment, StringComparison.OrdinalIgnoreCase))
            throw new InvalidOperationException("Đơn hàng chưa được xác nhận, không thể tạo phiếu xuất kho");

        if (string.Equals(order.OrderStatus, OrderStatuses.Delivered, StringComparison.OrdinalIgnoreCase)
            || string.Equals(order.OrderStatus, OrderStatuses.Completed, StringComparison.OrdinalIgnoreCase))
            throw new InvalidOperationException("Đơn hàng đã hoàn tất, không thể tạo phiếu xuất kho");
    }

    public static void ValidateNoActiveFulfillment(IEnumerable<FulfillmentTicket> tickets)
    {
        if (tickets.Any(t => IsActiveFulfillmentStatus(t.Status)))
            throw new InvalidOperationException("Đơn đã có phiếu công việc đang xử lý. Hoàn tất hoặc hủy phiếu hiện tại trước khi tạo mới.");
    }

    public static void TryAdvanceOrderOnCreate(CustomerOrder order)
    {
        if (string.Equals(order.OrderStatus, OrderStatuses.Confirmed, StringComparison.OrdinalIgnoreCase)
            && OrderStatuses.CanTransition(order.OrderStatus, OrderStatuses.Processing))
        {
            order.OrderStatus = OrderStatuses.Processing;
            order.UpdatedAt = DateTime.UtcNow;
        }
    }

    public static void ValidateBeforeFulfillmentStatusChange(FulfillmentTicket ticket, string newStatus)
    {
        if (string.Equals(newStatus, FulfillmentStatuses.Picking, StringComparison.OrdinalIgnoreCase)
            && ticket.AssignedWorkerId == null)
        {
            throw new InvalidOperationException("Phải gán Worker trước khi chuyển phiếu sang trạng thái Picking.");
        }
    }

    /// <returns>true nếu đơn kết thúc ở Delivered sau bước sync (Pickup).</returns>
    public static bool TryAdvanceOrderOnFulfillmentStatus(
        CustomerOrder order,
        string newFulfillmentStatus,
        string? ticketType = null)
    {
        if (string.Equals(newFulfillmentStatus, FulfillmentStatuses.Packed, StringComparison.OrdinalIgnoreCase)
            && string.Equals(order.OrderStatus, OrderStatuses.Processing, StringComparison.OrdinalIgnoreCase)
            && OrderStatuses.CanTransition(order.OrderStatus, OrderStatuses.ReadyToShip))
        {
            order.OrderStatus = OrderStatuses.ReadyToShip;
            order.UpdatedAt = DateTime.UtcNow;
        }

        if (string.Equals(newFulfillmentStatus, FulfillmentStatuses.Shipped, StringComparison.OrdinalIgnoreCase))
        {
            if (!string.Equals(order.OrderStatus, OrderStatuses.ReadyToShip, StringComparison.OrdinalIgnoreCase))
                throw new InvalidOperationException("Đơn hàng phải ở trạng thái ReadyToShip trước khi phiếu chuyển Shipped.");

            if (OrderStatuses.CanTransition(order.OrderStatus, OrderStatuses.Shipped))
            {
                order.OrderStatus = OrderStatuses.Shipped;
                order.UpdatedAt = DateTime.UtcNow;
            }

            if (IsPickupTicketType(ticketType)
                && string.Equals(order.OrderStatus, OrderStatuses.Shipped, StringComparison.OrdinalIgnoreCase)
                && OrderStatuses.CanTransition(order.OrderStatus, OrderStatuses.Delivered))
            {
                order.OrderStatus = OrderStatuses.Delivered;
                order.UpdatedAt = DateTime.UtcNow;
                return true;
            }
        }

        return string.Equals(order.OrderStatus, OrderStatuses.Delivered, StringComparison.OrdinalIgnoreCase);
    }

    public static bool IsPickupTicketType(string? ticketType) =>
        string.Equals(ticketType?.Trim(), "Pickup", StringComparison.OrdinalIgnoreCase);

    public static IReadOnlyList<string> GetAllowedOrderTransitions(string? current)
    {
        if (string.IsNullOrWhiteSpace(current)) return [];
        var next = new List<string>();
        foreach (var target in OrderStatuses.All)
        {
            if (OrderStatuses.CanTransition(current, target))
                next.Add(target);
        }
        return next;
    }

    public static IReadOnlyList<string> GetAllowedFulfillmentTransitions(string? current)
    {
        if (string.IsNullOrWhiteSpace(current)) return [];
        var next = new List<string>();
        foreach (var target in FulfillmentStatuses.All)
        {
            if (FulfillmentStatuses.CanTransition(current, target))
                next.Add(target);
        }
        return next;
    }

    public static List<string> BuildOrderWarnings(CustomerOrder order, Customer? customer)
    {
        var warnings = new List<string>();
        if (customer != null
            && string.Equals(customer.CustomerType, "B2B", StringComparison.OrdinalIgnoreCase)
            && (string.Equals(order.PaymentStatus, PaymentStatuses.Unpaid, StringComparison.OrdinalIgnoreCase)
                || string.Equals(order.PaymentStatus, PaymentStatuses.PartiallyPaid, StringComparison.OrdinalIgnoreCase)))
        {
            warnings.Add("Đơn B2B chưa thanh toán đủ — vẫn có thể xuất kho theo chính sách giao trước, thu sau.");
        }
        return warnings;
    }

    public static bool IsWorkerRole(string? roleName) =>
        string.Equals(roleName, AppRoles.Worker, StringComparison.OrdinalIgnoreCase);
}
