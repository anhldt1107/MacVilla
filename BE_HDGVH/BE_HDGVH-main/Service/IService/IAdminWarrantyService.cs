using BE_API.Dto.Admin;
using BE_API.Dto.Common;

namespace BE_API.Service.IService;

public interface IAdminWarrantyService
{
    /// <summary>
    /// Lấy danh sách phiếu bảo hành có phân trang và filter
    /// </summary>
    Task<PagedResultDto<AdminWarrantyTicketListItemDto>> GetPagedAsync(
        int page,
        int pageSize,
        string? status = null,
        int? customerId = null,
        int? orderId = null,
        DateTime? fromDate = null,
        DateTime? toDate = null,
        string? search = null,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Lấy chi tiết phiếu bảo hành theo ID
    /// </summary>
    Task<AdminWarrantyTicketDetailDto> GetByIdAsync(int id, CancellationToken cancellationToken = default);

    /// <summary>
    /// Lấy chi tiết phiếu bảo hành theo mã phiếu
    /// </summary>
    Task<AdminWarrantyTicketDetailDto> GetByTicketNumberAsync(string ticketNumber, CancellationToken cancellationToken = default);

    /// <summary>
    /// Tạo phiếu bảo hành (thường khi giao hàng thành công)
    /// </summary>
    Task<AdminWarrantyTicketDetailDto> CreateAsync(
        AdminWarrantyTicketCreateDto dto,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Tạo yêu cầu bảo hành cho phiếu
    /// </summary>
    Task<AdminWarrantyClaimDto> CreateClaimAsync(
        int ticketId,
        AdminWarrantyClaimCreateDto dto,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Cập nhật trạng thái yêu cầu bảo hành
    /// </summary>
    Task<AdminWarrantyClaimDto> UpdateClaimStatusAsync(
        int claimId,
        AdminWarrantyClaimUpdateStatusDto dto,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Lấy chi tiết yêu cầu bảo hành theo ID
    /// </summary>
    Task<AdminWarrantyClaimDto> GetClaimByIdAsync(int claimId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Danh sách claim phân trang (hàng đợi xử lý: dùng <paramref name="onlyOpen"/>).
    /// </summary>
    Task<PagedResultDto<AdminWarrantyClaimListItemDto>> GetClaimsPagedAsync(
        int page,
        int pageSize,
        string? status = null,
        bool onlyOpen = false,
        int? customerId = null,
        int? warrantyTicketId = null,
        int? orderId = null,
        DateTime? fromDate = null,
        DateTime? toDate = null,
        string? search = null,
        CancellationToken cancellationToken = default);
}
