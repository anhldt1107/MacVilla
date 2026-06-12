using BE_API.Dto.Admin.Dashboard;

namespace BE_API.Service.IService;

public interface IDashboardArService
{
    Task<ArSummaryDto> GetSummaryAsync(int dueSoonDays, CancellationToken cancellationToken = default);

    Task<ArAgingDto> GetAgingAsync(CancellationToken cancellationToken = default);

    Task<ArTopDebtorsDto> GetTopDebtorsAsync(int limit, CancellationToken cancellationToken = default);

    Task<ArTimeseriesDto> GetTimeseriesAsync(DateTime? fromDate, DateTime? toDate, string granularity, CancellationToken cancellationToken = default);
}
