using BE_API.Dto.Admin.Dashboard;

namespace BE_API.Service.IService;

public interface IDashboardOperationsService
{
    Task<StatusBreakdownDto> GetOrderStatusBreakdownAsync(DateTime? fromDate, DateTime? toDate, CancellationToken cancellationToken = default);

    Task<StatusBreakdownDto> GetFulfillmentStatusAsync(DateTime? fromDate, DateTime? toDate, CancellationToken cancellationToken = default);

    Task<SlaConfirmedToShippedDto> GetSlaConfirmedToShippedAsync(DateTime? fromDate, DateTime? toDate, CancellationToken cancellationToken = default);

    Task<LateOrdersDto> GetLateOrdersAsync(int slaHours, CancellationToken cancellationToken = default);
}
