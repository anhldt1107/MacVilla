using BE_API.Dto.Admin.Dashboard;

namespace BE_API.Service.IService;

public interface IDashboardRevenueService
{
    Task<RevenueOverviewDto> GetOverviewAsync(DateTime? fromDate, DateTime? toDate, CancellationToken cancellationToken = default);

    Task<RevenueTimeseriesDto> GetTimeseriesAsync(DateTime? fromDate, DateTime? toDate, string granularity, CancellationToken cancellationToken = default);

    Task<RevenueByPaymentMethodDto> GetByPaymentMethodAsync(DateTime? fromDate, DateTime? toDate, CancellationToken cancellationToken = default);

    Task<RevenueByChannelDto> GetByChannelAsync(DateTime? fromDate, DateTime? toDate, string granularity, CancellationToken cancellationToken = default);
}
