using BE_API.Dto.Admin;
using BE_API.Dto.Common;

namespace BE_API.Service.IService;

public interface IAdminPaymentService
{
    /// <summary>
    /// Lấy danh sách giao dịch thanh toán phân trang
    /// </summary>
    Task<PagedResultDto<AdminPaymentListItemDto>> GetPagedAsync(
        int page,
        int pageSize,
        int? customerId = null,
        int? invoiceId = null,
        int? orderId = null,
        string? transactionType = null,
        string? paymentMethod = null,
        DateTime? fromDate = null,
        DateTime? toDate = null,
        string? search = null,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Lấy chi tiết giao dịch thanh toán theo ID
    /// </summary>
    Task<AdminPaymentDetailDto> GetByIdAsync(int id, CancellationToken cancellationToken = default);

    /// <summary>
    /// Ghi nhận thanh toán (thu tiền từ sổ phụ ngân hàng)
    /// </summary>
    Task<AdminPaymentDetailDto> CreatePaymentAsync(AdminPaymentCreateDto dto, CancellationToken cancellationToken = default);

    /// <summary>
    /// Ghi nhận hoàn tiền
    /// </summary>
    Task<AdminPaymentDetailDto> CreateRefundAsync(AdminPaymentRefundDto dto, CancellationToken cancellationToken = default);
}
