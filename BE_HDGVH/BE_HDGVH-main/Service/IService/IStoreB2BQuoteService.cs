using BE_API.Dto.Common;
using BE_API.Dto.Store;

namespace BE_API.Service.IService;

public interface IStoreB2BQuoteService
{
    /// <summary>
    /// Khách B2B tạo yêu cầu báo giá
    /// </summary>
    Task<StoreB2BQuoteDetailDto> CreateRequestAsync(
        int customerId,
        StoreB2BQuoteRequestDto dto,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Danh sách báo giá của khách B2B (chỉ các trạng thái được phép xem)
    /// </summary>
    Task<PagedResultDto<StoreB2BQuoteListItemDto>> GetPagedAsync(
        int customerId,
        int page,
        int pageSize,
        string? status = null,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Chi tiết báo giá theo mã (phải thuộc về khách và ở trạng thái được phép xem)
    /// </summary>
    Task<StoreB2BQuoteDetailDto> GetByCodeAsync(
        int customerId,
        string quoteCode,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Khách chấp nhận báo giá (Approved → CustomerAccepted)
    /// </summary>
    Task<StoreB2BQuoteDetailDto> AcceptAsync(
        int customerId,
        int quoteId,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Khách từ chối báo giá (Approved → CustomerRejected)
    /// </summary>
    Task<StoreB2BQuoteDetailDto> RejectAsync(
        int customerId,
        int quoteId,
        StoreB2BQuoteRejectDto dto,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Khách gửi phản hồi thương lượng (Approved → CounterOffer)
    /// </summary>
    Task<StoreB2BQuoteDetailDto> CounterOfferAsync(
        int customerId,
        int quoteId,
        StoreB2BQuoteCounterOfferDto dto,
        CancellationToken cancellationToken = default);
}
