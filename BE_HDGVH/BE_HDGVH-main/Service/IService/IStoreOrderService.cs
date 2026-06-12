using BE_API.Dto.Common;
using BE_API.Dto.Store;

namespace BE_API.Service.IService;

public interface IStoreOrderService
{
    Task<StoreOrderPreviewResponseDto> PreviewAsync(
        int customerId,
        StoreOrderCheckoutDto dto,
        CancellationToken cancellationToken = default);

    Task<StoreOrderDetailDto> CreateAsync(
        int customerId,
        StoreOrderCheckoutDto dto,
        CancellationToken cancellationToken = default);

    Task<PagedResultDto<StoreOrderListItemDto>> ListMyOrdersAsync(
        int customerId,
        int page,
        int pageSize,
        CancellationToken cancellationToken = default);

    Task<StoreOrderDetailDto> GetMyOrderByCodeAsync(
        int customerId,
        string orderCode,
        CancellationToken cancellationToken = default);

    Task<StoreOrderTimelineDto> GetTimelineAsync(
        int customerId,
        string orderCode,
        CancellationToken cancellationToken = default);

    Task<StoreOrderDetailDto> CancelAsync(
        int customerId,
        string orderCode,
        StoreOrderCancelDto? dto,
        CancellationToken cancellationToken = default);

    Task<StoreOrderReorderResponseDto> ReorderAsync(
        int customerId,
        string orderCode,
        CancellationToken cancellationToken = default);
}
