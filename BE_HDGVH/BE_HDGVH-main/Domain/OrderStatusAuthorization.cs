using BE_API.Authorization;
using BE_API.Entities;

namespace BE_API.Domain;

/// <summary>
/// Phân quyền cập nhật trạng thái đơn theo vai trò staff.
/// </summary>
public static class OrderStatusAuthorization
{
    /// <summary>Các trạng thái đơn do luồng phiếu / orchestration tự set — không bấm tay.</summary>
    private static readonly HashSet<string> AutoSyncedTargets = new(StringComparer.OrdinalIgnoreCase)
    {
        OrderStatuses.Processing,
        OrderStatuses.ReadyToShip,
        OrderStatuses.Shipped,
    };

    public static IReadOnlyList<string> GetAllowedOrderTransitionsForRole(string? orderStatus, string? role)
    {
        if (string.IsNullOrWhiteSpace(orderStatus)) return [];

        var roleNorm = NormalizeRole(role);

        if (IsWarehouseRole(roleNorm))
            return [];

        if (string.Equals(roleNorm, AppRoles.Sales, StringComparison.OrdinalIgnoreCase))
        {
            if (string.Equals(orderStatus, OrderStatuses.Shipped, StringComparison.OrdinalIgnoreCase)
                && OrderStatuses.CanTransition(orderStatus, OrderStatuses.Delivered))
            {
                return [OrderStatuses.Delivered];
            }

            return [];
        }

        if (IsManagerOrAdmin(roleNorm))
        {
            return OrderFulfillmentWorkflow.GetAllowedOrderTransitions(orderStatus)
                .Where(t => !AutoSyncedTargets.Contains(t))
                .ToList();
        }

        return [];
    }

    public static void ValidateOrderStatusUpdate(
        CustomerOrder order,
        string newStatus,
        string? role,
        int? callerUserId)
    {
        var roleNorm = NormalizeRole(role);
        var from = order.OrderStatus;

        if (!OrderStatuses.CanTransition(from, newStatus))
            throw new InvalidOperationException(
                $"Không thể chuyển trạng thái từ '{from}' sang '{newStatus}'");

        var allowed = GetAllowedOrderTransitionsForRole(from, roleNorm);
        if (!allowed.Contains(newStatus, StringComparer.OrdinalIgnoreCase))
            throw new UnauthorizedAccessException(
                $"Vai trò '{roleNorm}' không được phép chuyển đơn từ '{from}' sang '{newStatus}'.");

        if (string.Equals(roleNorm, AppRoles.Sales, StringComparison.OrdinalIgnoreCase))
        {
            if (!callerUserId.HasValue)
                throw new UnauthorizedAccessException("Không xác định được người dùng.");

            if (!order.SalesId.HasValue || order.SalesId.Value != callerUserId.Value)
                throw new UnauthorizedAccessException("Bạn chỉ có thể cập nhật đơn do mình phụ trách.");
        }
    }

    private static bool IsWarehouseRole(string role) =>
        string.Equals(role, AppRoles.StockManager, StringComparison.OrdinalIgnoreCase)
        || string.Equals(role, AppRoles.Worker, StringComparison.OrdinalIgnoreCase);

    private static bool IsManagerOrAdmin(string role) =>
        string.Equals(role, AppRoles.Admin, StringComparison.OrdinalIgnoreCase)
        || string.Equals(role, AppRoles.Manager, StringComparison.OrdinalIgnoreCase);

    private static string NormalizeRole(string? role) =>
        string.IsNullOrWhiteSpace(role) ? string.Empty : role.Trim();
}
