using BE_API.Dto.Admin;
using BE_API.Dto.Common;

namespace BE_API.Service.IService;

public interface IAdminTransferNotificationService
{
    Task<PagedResultDto<AdminTransferNotificationListItemDto>> GetPagedAsync(
        int page,
        int pageSize,
        string? status = null,
        int? customerId = null,
        DateTime? fromDate = null,
        DateTime? toDate = null,
        CancellationToken cancellationToken = default);

    Task<AdminTransferNotificationDetailDto> GetByIdAsync(int id, CancellationToken cancellationToken = default);

    /// <summary>Ghi nhận thanh toán từ thông báo CK và chuyển trạng thái Verified.</summary>
    Task<AdminTransferNotificationDetailDto> VerifyAsync(
        int id,
        int processedByUserId,
        AdminTransferNotificationVerifyDto? dto,
        CancellationToken cancellationToken = default);

    /// <summary>Từ chối thông báo CK (không tạo giao dịch thanh toán).</summary>
    Task<AdminTransferNotificationDetailDto> RejectAsync(
        int id,
        int processedByUserId,
        AdminTransferNotificationRejectDto dto,
        CancellationToken cancellationToken = default);
}
