using BE_API.Dto.Admin;

namespace BE_API.Service.IService;

public interface IAdminReportService
{
    Task<AdminSalesOverviewDto> GetSalesOverviewAsync(
        DateTime? fromDate,
        DateTime? toDate,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<AdminLowStockItemDto>> GetLowStockAsync(
        int threshold,
        int take,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<AdminTopSalesItemDto>> GetTopSalesAsync(
        DateTime? fromDate,
        DateTime? toDate,
        int limit,
        CancellationToken cancellationToken = default);
}
