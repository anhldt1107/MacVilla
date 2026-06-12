namespace BE_API.Service.IService;

public interface INotificationService
{
    Task NotifyStaffByRolesAsync(
        IEnumerable<string> roleNames,
        string eventType,
        string title,
        string? body,
        string? entityType,
        string? entityId,
        Func<string?, string> deepLinkForRole,
        string priority = "Normal",
        CancellationToken cancellationToken = default);

    Task NotifyStaffUserAsync(
        int staffUserId,
        string eventType,
        string title,
        string? body,
        string? entityType,
        string? entityId,
        string deepLinkPath,
        string priority = "Normal",
        CancellationToken cancellationToken = default);

    Task NotifyCustomerAsync(
        int customerId,
        string eventType,
        string title,
        string? body,
        string? entityType,
        string? entityId,
        string deepLinkPath,
        string priority = "Normal",
        CancellationToken cancellationToken = default);
}
