using BE_API.Dto.Admin;
using BE_API.Dto.Common;

namespace BE_API.Service.IService;

public interface IAdminQuoteService
{
    Task<PagedResultDto<AdminQuoteListItemDto>> GetPagedAsync(
        int page,
        int pageSize,
        string? status = null,
        int? customerId = null,
        int? salesId = null,
        DateTime? fromDate = null,
        DateTime? toDate = null,
        string? search = null,
        string? salesListView = null,
        int? salesScopeUserId = null,
        CancellationToken cancellationToken = default);

    /// <summary>Sales: chỉ báo giá của mình hoặc chưa gán (tiếp nhận).</summary>
    Task EnsureQuoteAccessibleBySalesAsync(int quoteId, int salesUserId, CancellationToken cancellationToken = default);

    Task<AdminQuoteDetailDto> GetByIdAsync(int id, CancellationToken cancellationToken = default);

    Task<AdminQuoteDetailDto> GetByCodeAsync(string quoteCode, CancellationToken cancellationToken = default);

    Task<AdminQuoteDetailDto> CreateAsync(AdminQuoteCreateDto dto, int salesId, CancellationToken cancellationToken = default);

    Task<AdminQuoteDetailDto> UpdateAsync(int id, AdminQuoteUpdateDto dto, CancellationToken cancellationToken = default);

    Task<AdminQuoteDetailDto> AssignToSalesAsync(int id, int salesId, CancellationToken cancellationToken = default);

    /// <summary>Đưa báo giá về nháp khi chuyển trạng thái hợp lệ (vd. CounterOffer → Draft). Gán Sales chỉ khi chưa có.</summary>
    Task<AdminQuoteDetailDto> ReturnToDraftAsync(int id, int staffId, CancellationToken cancellationToken = default);

    Task<AdminQuoteDetailDto> SubmitAsync(int id, CancellationToken cancellationToken = default);

    Task<AdminQuoteDetailDto> ApproveAsync(int id, int managerId, CancellationToken cancellationToken = default);

    Task<AdminQuoteDetailDto> RejectAsync(int id, int managerId, AdminQuoteRejectDto dto, CancellationToken cancellationToken = default);

    Task<AdminOrderDetailDto> ConvertToOrderAsync(int id, int salesId, AdminQuoteConvertToOrderDto dto, CancellationToken cancellationToken = default);

    /// <summary>Giữ tồn theo dòng báo giá (RESERVE); chỉ khi báo giá CustomerAccepted.</summary>
    Task<AdminQuoteDetailDto> ReserveInventoryAsync(int quoteId, int staffId, CancellationToken cancellationToken = default);

    /// <summary>Trả giữ tồn đã gắn với báo giá (RELEASE).</summary>
    Task<AdminQuoteDetailDto> ReleaseInventoryReservationAsync(int quoteId, int staffId, CancellationToken cancellationToken = default);
}
