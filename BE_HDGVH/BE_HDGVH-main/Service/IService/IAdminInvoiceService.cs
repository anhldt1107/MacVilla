using BE_API.Dto.Admin;
using BE_API.Dto.Common;

namespace BE_API.Service.IService;

public interface IAdminInvoiceService
{
    /// <summary>
    /// Lấy danh sách hóa đơn phân trang
    /// </summary>
    Task<PagedResultDto<AdminInvoiceListItemDto>> GetPagedAsync(
        int page,
        int pageSize,
        string? status = null,
        int? customerId = null,
        int? orderId = null,
        DateTime? fromDueDate = null,
        DateTime? toDueDate = null,
        DateTime? fromIssueDate = null,
        DateTime? toIssueDate = null,
        string? search = null,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Lấy chi tiết hóa đơn theo ID
    /// </summary>
    Task<AdminInvoiceDetailDto> GetByIdAsync(int id, CancellationToken cancellationToken = default);

    /// <summary>
    /// Lấy chi tiết hóa đơn theo số hóa đơn
    /// </summary>
    Task<AdminInvoiceDetailDto> GetByNumberAsync(string invoiceNumber, CancellationToken cancellationToken = default);

    /// <summary>
    /// Tạo hóa đơn VAT mới
    /// </summary>
    Task<AdminInvoiceDetailDto> CreateAsync(AdminInvoiceCreateDto dto, CancellationToken cancellationToken = default);

    /// <summary>
    /// Cập nhật thông tin xuất VAT
    /// </summary>
    Task<AdminInvoiceDetailDto> UpdateAsync(int id, AdminInvoiceUpdateDto dto, CancellationToken cancellationToken = default);

    /// <summary>
    /// Hủy hóa đơn
    /// </summary>
    Task<AdminInvoiceDetailDto> CancelAsync(int id, string? reason, CancellationToken cancellationToken = default);
}
