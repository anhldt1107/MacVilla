using BE_API.Dto.Admin;
using BE_API.Dto.Common;

namespace BE_API.Service.IService;

public interface IAdminOrderService
{
    /// <summary>
    /// Lấy danh sách đơn hàng có phân trang và filter
    /// </summary>
    Task<PagedResultDto<AdminOrderListItemDto>> GetPagedAsync(
        int page,
        int pageSize,
        string? orderStatus = null,
        string? paymentStatus = null,
        int? customerId = null,
        int? salesId = null,
        DateTime? fromDate = null,
        DateTime? toDate = null,
        string? search = null,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Lấy chi tiết đơn hàng theo ID
    /// </summary>
    /// <summary>Sales: chỉ đơn gán cho mình.</summary>
    Task EnsureOrderAccessibleBySalesAsync(int orderId, int salesUserId, CancellationToken cancellationToken = default);

    Task<AdminOrderDetailDto> GetByIdAsync(
        int id,
        string? actorRole = null,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Lấy chi tiết đơn hàng theo OrderCode
    /// </summary>
    Task<AdminOrderDetailDto> GetByCodeAsync(
        string orderCode,
        string? actorRole = null,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Tạo đơn hàng (Sales tạo hộ khách tại quầy)
    /// </summary>
    Task<AdminOrderDetailDto> CreateAsync(
        AdminOrderCreateDto dto,
        int? salesId,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Cập nhật trạng thái đơn hàng
    /// </summary>
    Task<AdminOrderDetailDto> UpdateStatusAsync(
        int id,
        AdminOrderUpdateStatusDto dto,
        int? actorUserId = null,
        string? actorRole = null,
        CancellationToken cancellationToken = default);

    Task<AdminOrderWorkflowDto> GetWorkflowAsync(
        int id,
        string? actorRole = null,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Cập nhật trạng thái thanh toán
    /// </summary>
    Task<AdminOrderDetailDto> UpdatePaymentStatusAsync(
        int id,
        AdminOrderUpdatePaymentStatusDto dto,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Hủy đơn hàng
    /// </summary>
    Task<AdminOrderDetailDto> CancelAsync(
        int id,
        AdminOrderCancelDto dto,
        int? actorUserId = null,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Gán Sales cho đơn hàng
    /// </summary>
    Task<AdminOrderDetailDto> AssignSalesAsync(
        int id,
        AdminOrderAssignSalesDto dto,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Timeline đơn hàng phía admin — gom sự kiện thực từ DB (đơn, phiếu xuất, thanh toán, hóa đơn, CK, đổi trả).
    /// </summary>
    Task<AdminOrderTimelineDto> GetTimelineByIdAsync(int id, CancellationToken cancellationToken = default);

    Task<AdminOrderTimelineDto> GetTimelineByCodeAsync(string orderCode, CancellationToken cancellationToken = default);
}
