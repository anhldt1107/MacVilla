using BE_API.Dto.Common;
using BE_API.Dto.Store;

namespace BE_API.Service.IService;

public interface IStoreB2BOrderService
{
    /// <summary>
    /// Danh sách đơn hàng của khách B2B (có filter theo status, phân trang)
    /// </summary>
    Task<PagedResultDto<StoreB2BOrderListItemDto>> GetPagedAsync(
        int customerId,
        int page,
        int pageSize,
        string? orderStatus = null,
        string? paymentStatus = null,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Chi tiết đơn hàng theo mã (phải thuộc về khách)
    /// </summary>
    Task<StoreB2BOrderDetailDto> GetByOrderCodeAsync(
        int customerId,
        string orderCode,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Timeline đơn hàng - các sự kiện theo thời gian (tạo đơn, xử lý, xuất kho, giao hàng...)
    /// </summary>
    Task<StoreB2BOrderTimelineDto> GetTimelineAsync(
        int customerId,
        string orderCode,
        CancellationToken cancellationToken = default);
}
