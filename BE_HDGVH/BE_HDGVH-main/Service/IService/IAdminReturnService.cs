using BE_API.Dto.Admin;
using BE_API.Dto.Common;

namespace BE_API.Service.IService;

public interface IAdminReturnService
{
    Task<PagedResultDto<AdminReturnListItemDto>> GetPagedAsync(
        int page,
        int pageSize,
        string? status = null,
        string? type = null,
        int? customerId = null,
        int? orderId = null,
        DateTime? fromDate = null,
        DateTime? toDate = null,
        string? search = null,
        CancellationToken cancellationToken = default);

    Task<AdminReturnDetailDto> GetByIdAsync(int id, CancellationToken cancellationToken = default);

    Task<AdminReturnDetailDto> GetByTicketNumberAsync(string ticketNumber, CancellationToken cancellationToken = default);

    Task<AdminReturnDetailDto> CreateAsync(
        AdminReturnCreateDto dto,
        CancellationToken cancellationToken = default);

    Task<AdminReturnDetailDto> ApproveAsync(
        int id,
        int managerId,
        AdminReturnApproveDto dto,
        CancellationToken cancellationToken = default);

    Task<AdminReturnDetailDto> RejectAsync(
        int id,
        int managerId,
        AdminReturnRejectDto dto,
        CancellationToken cancellationToken = default);

    Task<AdminReturnDetailDto> StartProcessingAsync(
        int id,
        int staffId,
        AdminReturnTransitionDto dto,
        CancellationToken cancellationToken = default);

    Task<AdminReturnDetailDto> ReceiveItemsAsync(
        int id,
        int staffId,
        AdminReturnTransitionDto dto,
        CancellationToken cancellationToken = default);

    Task<AdminReturnDetailDto> CancelAsync(
        int id,
        AdminReturnTransitionDto dto,
        CancellationToken cancellationToken = default);

    Task<AdminReturnDetailDto> CompleteAsync(
        int id,
        int stockManagerId,
        AdminReturnCompleteDto dto,
        CancellationToken cancellationToken = default);
}
