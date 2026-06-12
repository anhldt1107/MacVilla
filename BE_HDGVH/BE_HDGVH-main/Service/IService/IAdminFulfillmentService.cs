using BE_API.Dto.Common;
using BE_API.Dto.Fulfillment;

namespace BE_API.Service.IService;

public interface IAdminFulfillmentService
{
    /// <summary>
    /// F1: Danh sách phiếu xuất kho (filter: status, orderId)
    /// </summary>
    Task<PagedResultDto<FulfillmentListItemDto>> GetPagedAsync(
        int page,
        int pageSize,
        string? status,
        int? orderId,
        int? assignedWorkerId,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// F2: Chi tiết phiếu xuất kho + đơn hàng
    /// </summary>
    Task<FulfillmentDetailDto> GetByIdAsync(int id, CancellationToken cancellationToken = default);

    /// <summary>
    /// F3: Tạo phiếu xuất kho cho đơn hàng
    /// </summary>
    Task<FulfillmentDetailDto> CreateAsync(
        int orderId,
        FulfillmentCreateDto dto,
        int createdByUserId,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// F4: Gán Worker cho phiếu xuất kho
    /// </summary>
    Task<FulfillmentDetailDto> AssignWorkerAsync(
        int id,
        FulfillmentAssignWorkerDto dto,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// F5: Cập nhật trạng thái phiếu (Pending → Picking → Packed → Shipped)
    /// </summary>
    Task<FulfillmentDetailDto> UpdateStatusAsync(
        int id,
        FulfillmentUpdateStatusDto dto,
        CancellationToken cancellationToken = default);
}
