using BE_API.Database;
using BE_API.Domain;
using BE_API.Entities;
using BE_API.Service.IService;
using Microsoft.EntityFrameworkCore;

namespace BE_API.Service;

public class NotificationService(BeContext db) : INotificationService
{
    private static readonly TimeSpan DedupeWindow = TimeSpan.FromMinutes(5);

    public async Task NotifyStaffByRolesAsync(
        IEnumerable<string> roleNames,
        string eventType,
        string title,
        string? body,
        string? entityType,
        string? entityId,
        Func<string?, string> deepLinkForRole,
        string priority = NotificationPriorities.Normal,
        CancellationToken cancellationToken = default)
    {
        var roles = roleNames
            .Where(r => !string.IsNullOrWhiteSpace(r))
            .Select(r => r.Trim())
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();

        if (roles.Count == 0) return;

        var users = await db.AppUsers
            .AsNoTracking()
            .Include(u => u.Role)
            .Where(u => u.Status == "Active" && u.Role != null && roles.Contains(u.Role.RoleName))
            .Select(u => new { u.Id, RoleName = u.Role!.RoleName })
            .ToListAsync(cancellationToken);

        foreach (var user in users)
        {
            await NotifyStaffUserAsync(
                user.Id,
                eventType,
                title,
                body,
                entityType,
                entityId,
                deepLinkForRole(user.RoleName),
                priority,
                cancellationToken);
        }
    }

    public async Task NotifyStaffUserAsync(
        int staffUserId,
        string eventType,
        string title,
        string? body,
        string? entityType,
        string? entityId,
        string deepLinkPath,
        string priority = NotificationPriorities.Normal,
        CancellationToken cancellationToken = default)
    {
        if (staffUserId <= 0) return;
        if (await IsDuplicateAsync(NotificationRecipientKinds.Staff, staffUserId, eventType, entityType, entityId, cancellationToken))
            return;

        await db.UserNotifications.AddAsync(new UserNotification
        {
            RecipientKind = NotificationRecipientKinds.Staff,
            RecipientId = staffUserId,
            EventType = eventType,
            Title = title.Trim(),
            Body = string.IsNullOrWhiteSpace(body) ? null : body.Trim(),
            EntityType = entityType,
            EntityId = entityId,
            DeepLinkPath = deepLinkPath,
            Priority = priority,
            CreatedAt = DateTime.UtcNow
        }, cancellationToken);

        await db.SaveChangesAsync(cancellationToken);
    }

    public async Task NotifyCustomerAsync(
        int customerId,
        string eventType,
        string title,
        string? body,
        string? entityType,
        string? entityId,
        string deepLinkPath,
        string priority = NotificationPriorities.Normal,
        CancellationToken cancellationToken = default)
    {
        if (customerId <= 0) return;
        if (await IsDuplicateAsync(NotificationRecipientKinds.Customer, customerId, eventType, entityType, entityId, cancellationToken))
            return;

        await db.UserNotifications.AddAsync(new UserNotification
        {
            RecipientKind = NotificationRecipientKinds.Customer,
            RecipientId = customerId,
            EventType = eventType,
            Title = title.Trim(),
            Body = string.IsNullOrWhiteSpace(body) ? null : body.Trim(),
            EntityType = entityType,
            EntityId = entityId,
            DeepLinkPath = deepLinkPath,
            Priority = priority,
            CreatedAt = DateTime.UtcNow
        }, cancellationToken);

        await db.SaveChangesAsync(cancellationToken);
    }

    private async Task<bool> IsDuplicateAsync(
        string recipientKind,
        int recipientId,
        string eventType,
        string? entityType,
        string? entityId,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(entityType) || string.IsNullOrWhiteSpace(entityId))
            return false;

        var since = DateTime.UtcNow - DedupeWindow;
        return await db.UserNotifications.AnyAsync(
            n => n.RecipientKind == recipientKind
                 && n.RecipientId == recipientId
                 && n.EventType == eventType
                 && n.EntityType == entityType
                 && n.EntityId == entityId
                 && n.CreatedAt >= since,
            cancellationToken);
    }
}
