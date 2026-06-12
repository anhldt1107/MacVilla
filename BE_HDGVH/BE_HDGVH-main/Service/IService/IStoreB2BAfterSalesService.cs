using BE_API.Dto.Common;
using BE_API.Dto.Store;

namespace BE_API.Service.IService;

public interface IStoreB2BAfterSalesService
{
    #region Warranty Tickets

    /// <summary>
    /// Danh sách phiếu bảo hành của khách B2B (có filter theo status, phân trang)
    /// </summary>
    Task<PagedResultDto<StoreB2BWarrantyTicketListItemDto>> GetWarrantyTicketsPagedAsync(
        int customerId,
        int page,
        int pageSize,
        string? status = null,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Chi tiết phiếu bảo hành theo mã phiếu
    /// </summary>
    Task<StoreB2BWarrantyTicketDetailDto> GetWarrantyTicketByNumberAsync(
        int customerId,
        string ticketNumber,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Khách B2B tạo yêu cầu bảo hành
    /// </summary>
    Task<StoreB2BWarrantyClaimResponseDto> CreateWarrantyClaimAsync(
        int customerId,
        StoreB2BWarrantyClaimCreateDto dto,
        CancellationToken cancellationToken = default);

    #endregion

    #region Return/Exchange Tickets

    /// <summary>
    /// Danh sách phiếu đổi/trả của khách B2B (có filter theo status/type, phân trang)
    /// </summary>
    Task<PagedResultDto<StoreB2BReturnTicketListItemDto>> GetReturnTicketsPagedAsync(
        int customerId,
        int page,
        int pageSize,
        string? status = null,
        string? type = null,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Chi tiết phiếu đổi/trả theo mã phiếu
    /// </summary>
    Task<StoreB2BReturnTicketDetailDto> GetReturnTicketByNumberAsync(
        int customerId,
        string ticketNumber,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Khách B2B tạo yêu cầu đổi/trả hàng
    /// </summary>
    Task<StoreB2BReturnCreateResponseDto> CreateReturnRequestAsync(
        int customerId,
        StoreB2BReturnCreateDto dto,
        CancellationToken cancellationToken = default);

    Task<StoreB2BReturnTicketDetailDto> CancelReturnRequestAsync(
        int customerId,
        string ticketNumber,
        CancellationToken cancellationToken = default);

    #endregion
}
