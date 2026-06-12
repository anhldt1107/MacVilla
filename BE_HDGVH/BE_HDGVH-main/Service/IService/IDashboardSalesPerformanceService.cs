using BE_API.Dto.Admin.Dashboard;

namespace BE_API.Service.IService;

public interface IDashboardSalesPerformanceService
{
    Task<TopSalesDto> GetTopSalesAsync(DateTime? fromDate, DateTime? toDate, int limit, CancellationToken cancellationToken = default);

    Task<PerSalesDetailDto> GetPerSalesDetailAsync(int salesId, DateTime? fromDate, DateTime? toDate, CancellationToken cancellationToken = default);

    Task<QuoteConversionBySalesDto> GetQuoteConversionBySalesAsync(DateTime? fromDate, DateTime? toDate, CancellationToken cancellationToken = default);
}
