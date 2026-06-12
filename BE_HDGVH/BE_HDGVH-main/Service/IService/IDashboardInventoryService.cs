using BE_API.Dto.Admin.Dashboard;

namespace BE_API.Service.IService;

public interface IDashboardInventoryService
{
    Task<InventoryOverviewDto> GetOverviewAsync(int defaultThreshold, CancellationToken cancellationToken = default);

    Task<InventoryLowStockDto> GetLowStockAsync(int threshold, int take, int windowDays, CancellationToken cancellationToken = default);

    Task<InventoryDaysOfCoverDto> GetDaysOfCoverAsync(int windowDays, int take, CancellationToken cancellationToken = default);

    Task<InventoryReserveRatioDto> GetReserveRatioAsync(int take, CancellationToken cancellationToken = default);

    Task<InventoryTransactionsTrendDto> GetTransactionsTrendAsync(DateTime? fromDate, DateTime? toDate, string granularity, CancellationToken cancellationToken = default);

    Task<InventoryTopMovingDto> GetTopMovingAsync(DateTime? fromDate, DateTime? toDate, int limit, CancellationToken cancellationToken = default);
}
