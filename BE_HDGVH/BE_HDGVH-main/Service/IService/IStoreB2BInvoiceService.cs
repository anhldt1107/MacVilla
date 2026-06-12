using BE_API.Dto.Common;
using BE_API.Dto.Store;

namespace BE_API.Service.IService;

public interface IStoreB2BInvoiceService
{
    /// <summary>
    /// Tổng quan công nợ của khách B2B (tổng nợ, quá hạn, sắp đến hạn...)
    /// </summary>
    Task<StoreB2BDebtSummaryDto> GetDebtSummaryAsync(
        int customerId,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Danh sách hóa đơn của khách B2B (có filter theo status, phân trang)
    /// </summary>
    Task<PagedResultDto<StoreB2BInvoiceListItemDto>> GetInvoicesPagedAsync(
        int customerId,
        int page,
        int pageSize,
        string? status = null,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Chi tiết hóa đơn theo số hóa đơn (phải thuộc về khách)
    /// </summary>
    Task<StoreB2BInvoiceDetailDto> GetInvoiceByNumberAsync(
        int customerId,
        string invoiceNumber,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Lấy URL PDF của hóa đơn (nếu có)
    /// </summary>
    Task<string?> GetInvoicePdfUrlAsync(
        int customerId,
        string invoiceNumber,
        CancellationToken cancellationToken = default);
}
