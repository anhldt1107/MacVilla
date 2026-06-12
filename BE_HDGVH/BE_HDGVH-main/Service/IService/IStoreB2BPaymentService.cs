using BE_API.Dto.Common;
using BE_API.Dto.Store;

namespace BE_API.Service.IService;

public interface IStoreB2BPaymentService
{
    /// <summary>
    /// Lịch sử thanh toán của khách B2B (có filter theo invoiceId, loại giao dịch, phân trang)
    /// </summary>
    Task<PagedResultDto<StoreB2BPaymentListItemDto>> GetPaymentsPagedAsync(
        int customerId,
        int page,
        int pageSize,
        int? invoiceId = null,
        string? transactionType = null,
        DateTime? fromDate = null,
        DateTime? toDate = null,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Chi tiết một giao dịch thanh toán
    /// </summary>
    Task<StoreB2BPaymentDetailDto> GetPaymentByIdAsync(
        int customerId,
        int paymentId,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Khách B2B gửi thông báo đã chuyển khoản
    /// </summary>
    Task<StoreB2BNotifyTransferResponseDto> NotifyTransferAsync(
        int customerId,
        StoreB2BNotifyTransferRequestDto dto,
        CancellationToken cancellationToken = default);

    /// <summary>Danh sách thông báo CK do khách gửi (phân trang)</summary>
    Task<PagedResultDto<StoreB2BTransferNotificationListItemDto>> GetTransferNotificationsPagedAsync(
        int customerId,
        int page,
        int pageSize,
        string? status,
        CancellationToken cancellationToken = default);

    StoreB2BBankTransferInfoDto GetBankTransferInfo();
}
