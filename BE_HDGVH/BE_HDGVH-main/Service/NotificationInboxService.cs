using BE_API.Database;
using BE_API.Domain;
using BE_API.Entities;
using BE_API.Dto.Admin;
using BE_API.Dto.Common;
using BE_API.Dto.Store;
using BE_API.Service.IService;
using Microsoft.EntityFrameworkCore;

namespace BE_API.Service;

public class NotificationInboxService(BeContext db) : INotificationInboxService
{
    public async Task<PagedResultDto<AdminNotificationListItemDto>> GetStaffPagedAsync(
        int staffUserId,
        int page,
        int pageSize,
        bool unreadOnly,
        CancellationToken cancellationToken = default)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 50);

        var query = db.UserNotifications
            .AsNoTracking()
            .Where(n => n.RecipientKind == NotificationRecipientKinds.Staff && n.RecipientId == staffUserId);

        if (unreadOnly)
            query = query.Where(n => n.ReadAt == null);

        var total = await query.CountAsync(cancellationToken);
        var rows = await query
            .OrderByDescending(n => n.CreatedAt)
            .ThenByDescending(n => n.Id)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        var items = rows.Select(MapStaffItem).ToList();

        return new PagedResultDto<AdminNotificationListItemDto>
        {
            Items = items,
            TotalCount = total,
            Page = page,
            PageSize = pageSize
        };
    }

    public Task<int> GetStaffUnreadCountAsync(int staffUserId, CancellationToken cancellationToken = default)
        => db.UserNotifications.CountAsync(
            n => n.RecipientKind == NotificationRecipientKinds.Staff
                 && n.RecipientId == staffUserId
                 && n.ReadAt == null,
            cancellationToken);

    public async Task MarkStaffReadAsync(int staffUserId, int notificationId, CancellationToken cancellationToken = default)
    {
        var row = await db.UserNotifications.FirstOrDefaultAsync(
            n => n.Id == notificationId
                 && n.RecipientKind == NotificationRecipientKinds.Staff
                 && n.RecipientId == staffUserId,
            cancellationToken)
            ?? throw new KeyNotFoundException("Không tìm thấy thông báo");

        if (row.ReadAt == null)
        {
            row.ReadAt = DateTime.UtcNow;
            await db.SaveChangesAsync(cancellationToken);
        }
    }

    public async Task MarkStaffReadAllAsync(int staffUserId, CancellationToken cancellationToken = default)
    {
        var now = DateTime.UtcNow;
        var unread = await db.UserNotifications
            .Where(n => n.RecipientKind == NotificationRecipientKinds.Staff
                        && n.RecipientId == staffUserId
                        && n.ReadAt == null)
            .ToListAsync(cancellationToken);

        foreach (var n in unread)
            n.ReadAt = now;

        if (unread.Count > 0)
            await db.SaveChangesAsync(cancellationToken);
    }

    public async Task<PagedResultDto<StoreNotificationListItemDto>> GetCustomerPagedAsync(
        int customerId,
        int page,
        int pageSize,
        bool unreadOnly,
        CancellationToken cancellationToken = default)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 50);

        var query = db.UserNotifications
            .AsNoTracking()
            .Where(n => n.RecipientKind == NotificationRecipientKinds.Customer && n.RecipientId == customerId);

        if (unreadOnly)
            query = query.Where(n => n.ReadAt == null);

        var total = await query.CountAsync(cancellationToken);
        var rows = await query
            .OrderByDescending(n => n.CreatedAt)
            .ThenByDescending(n => n.Id)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        var items = rows.Select(MapCustomerItem).ToList();

        return new PagedResultDto<StoreNotificationListItemDto>
        {
            Items = items,
            TotalCount = total,
            Page = page,
            PageSize = pageSize
        };
    }

    public Task<int> GetCustomerUnreadCountAsync(int customerId, CancellationToken cancellationToken = default)
        => db.UserNotifications.CountAsync(
            n => n.RecipientKind == NotificationRecipientKinds.Customer
                 && n.RecipientId == customerId
                 && n.ReadAt == null,
            cancellationToken);

    public async Task MarkCustomerReadAsync(int customerId, int notificationId, CancellationToken cancellationToken = default)
    {
        var row = await db.UserNotifications.FirstOrDefaultAsync(
            n => n.Id == notificationId
                 && n.RecipientKind == NotificationRecipientKinds.Customer
                 && n.RecipientId == customerId,
            cancellationToken)
            ?? throw new KeyNotFoundException("Không tìm thấy thông báo");

        if (row.ReadAt == null)
        {
            row.ReadAt = DateTime.UtcNow;
            await db.SaveChangesAsync(cancellationToken);
        }
    }

    private static AdminNotificationListItemDto MapStaffItem(Entities.UserNotification n) => new()
    {
        Id = n.Id,
        EventType = n.EventType,
        Title = n.Title,
        Body = n.Body,
        EntityType = n.EntityType,
        EntityId = n.EntityId,
        DeepLinkPath = n.DeepLinkPath,
        Priority = n.Priority,
        CreatedAt = VietnamTime.ToOffset(n.CreatedAt),
        ReadAt = VietnamTime.ToOffset(n.ReadAt)
    };

    private static StoreNotificationListItemDto MapCustomerItem(Entities.UserNotification n) => new()
    {
        Id = n.Id,
        EventType = n.EventType,
        Title = n.Title,
        Body = n.Body,
        EntityType = n.EntityType,
        EntityId = n.EntityId,
        DeepLinkPath = n.DeepLinkPath,
        Priority = n.Priority,
        CreatedAt = VietnamTime.ToOffset(n.CreatedAt),
        ReadAt = VietnamTime.ToOffset(n.ReadAt)
    };
}
