using BE_API.Dto.Common;
using BE_API.Dto.Store;

namespace BE_API.Service.IService;

public interface IStoreB2BContractService
{
    /// <summary>
    /// Danh sách hợp đồng của khách B2B (chỉ các trạng thái được phép xem)
    /// </summary>
    Task<PagedResultDto<StoreB2BContractListItemDto>> GetPagedAsync(
        int customerId,
        int page,
        int pageSize,
        string? status = null,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Chi tiết hợp đồng theo mã (phải thuộc về khách và ở trạng thái được phép xem)
    /// </summary>
    Task<StoreB2BContractDetailDto> GetByContractNumberAsync(
        int customerId,
        string contractNumber,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Khách xác nhận hợp đồng (PendingConfirmation → Confirmed)
    /// </summary>
    Task<StoreB2BContractDetailDto> ConfirmAsync(
        int customerId,
        int contractId,
        StoreB2BContractConfirmDto? dto = null,
        CancellationToken cancellationToken = default);
}
