using BE_API.Dto.Admin;
using BE_API.Dto.Common;
using BE_API.Dto.Store;

namespace BE_API.Service.IService;

public interface INotificationInboxService
{
    Task<PagedResultDto<AdminNotificationListItemDto>> GetStaffPagedAsync(
        int staffUserId,
        int page,
        int pageSize,
        bool unreadOnly,
        CancellationToken cancellationToken = default);

    Task<int> GetStaffUnreadCountAsync(int staffUserId, CancellationToken cancellationToken = default);

    Task MarkStaffReadAsync(int staffUserId, int notificationId, CancellationToken cancellationToken = default);

    Task MarkStaffReadAllAsync(int staffUserId, CancellationToken cancellationToken = default);

    Task<PagedResultDto<StoreNotificationListItemDto>> GetCustomerPagedAsync(
        int customerId,
        int page,
        int pageSize,
        bool unreadOnly,
        CancellationToken cancellationToken = default);

    Task<int> GetCustomerUnreadCountAsync(int customerId, CancellationToken cancellationToken = default);

    Task MarkCustomerReadAsync(int customerId, int notificationId, CancellationToken cancellationToken = default);
}
