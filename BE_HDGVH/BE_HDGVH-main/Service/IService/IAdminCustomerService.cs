using BE_API.Dto.Admin;
using BE_API.Dto.Common;

namespace BE_API.Service.IService;

public interface IAdminCustomerService
{
    /// <summary>
    /// Lấy danh sách khách hàng có phân trang và filter
    /// </summary>
    Task<PagedResultDto<AdminCustomerListItemDto>> GetPagedAsync(
        int page,
        int pageSize,
        string? customerType = null,
        bool? hasDebt = null,
        string? search = null,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Lấy chi tiết khách hàng theo ID
    /// </summary>
    Task<AdminCustomerDetailDto> GetByIdAsync(int id, CancellationToken cancellationToken = default);

    /// <summary>
    /// Tạo khách hàng mới (Sales nhập liệu)
    /// </summary>
    Task<AdminCustomerDetailDto> CreateAsync(
        AdminCustomerCreateDto dto,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Cập nhật thông tin khách hàng
    /// </summary>
    Task<AdminCustomerDetailDto> UpdateAsync(
        int id,
        AdminCustomerUpdateDto dto,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Lấy lịch sử đơn hàng của khách
    /// </summary>
    Task<PagedResultDto<AdminCustomerOrderHistoryDto>> GetOrderHistoryAsync(
        int customerId,
        int page,
        int pageSize,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Lấy thông tin công nợ của khách B2B
    /// </summary>
    Task<AdminCustomerDebtDto> GetDebtInfoAsync(int customerId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Điều chỉnh công nợ khách B2B
    /// </summary>
    Task<AdminCustomerDetailDto> AdjustDebtAsync(
        int customerId,
        AdminCustomerAdjustDebtDto dto,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Lấy danh sách loại khách hàng
    /// </summary>
    string[] GetCustomerTypes();
}
