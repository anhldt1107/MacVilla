using BE_API.Dto.Admin.Dashboard;

namespace BE_API.Service.IService;

public interface IDashboardSalesPipelineService
{
    Task<FunnelDto> GetFunnelAsync(DateTime? fromDate, DateTime? toDate, int? salesId, CancellationToken cancellationToken = default);

    Task<SalesConversionDto> GetConversionAsync(DateTime? fromDate, DateTime? toDate, int? salesId, CancellationToken cancellationToken = default);

    Task<TimeInStageListDto> GetTimeInStageAsync(DateTime? fromDate, DateTime? toDate, int? salesId, CancellationToken cancellationToken = default);

    Task<ExpiringQuotesDto> GetExpiringSoonAsync(int days, int? salesId, CancellationToken cancellationToken = default);
}
