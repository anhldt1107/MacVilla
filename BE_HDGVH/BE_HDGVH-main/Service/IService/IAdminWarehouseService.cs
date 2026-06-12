using BE_API.Dto.Admin;
using BE_API.Dto.Common;

namespace BE_API.Service.IService;

public interface IAdminWarehouseService
{
    Task<AdminWarehouseOverviewDto> GetOverviewAsync(
        int lowStockThreshold,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<AdminLowStockItemDto>> GetLowStockAsync(
        int threshold,
        int take,
        CancellationToken cancellationToken = default);

    Task<PagedResultDto<AdminInventoryListItemDto>> GetInventoryPagedAsync(
        int page,
        int pageSize,
        string? search,
        string? warehouseLocation,
        bool onlyOutOfStock,
        bool onlyBelowThreshold,
        int threshold,
        CancellationToken cancellationToken = default);
}
