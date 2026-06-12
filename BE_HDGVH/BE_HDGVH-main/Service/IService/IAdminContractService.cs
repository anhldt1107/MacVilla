using BE_API.Dto.Admin;
using BE_API.Dto.Common;

namespace BE_API.Service.IService;

public interface IAdminContractService
{
    Task<PagedResultDto<AdminContractListItemDto>> GetPagedAsync(
        int page,
        int pageSize,
        string? status = null,
        int? customerId = null,
        int? quoteId = null,
        CancellationToken cancellationToken = default);

    Task<AdminContractDetailDto> GetByIdAsync(int id, CancellationToken cancellationToken = default);

    Task<AdminContractDetailDto> GetByNumberAsync(string contractNumber, CancellationToken cancellationToken = default);

    Task<AdminContractDetailDto> CreateAsync(AdminContractCreateDto dto, CancellationToken cancellationToken = default);

    Task<AdminContractDetailDto> UpdateAsync(int id, AdminContractUpdateDto dto, CancellationToken cancellationToken = default);

    Task<AdminContractDetailDto> SendForCustomerConfirmationAsync(int id, CancellationToken cancellationToken = default);

    Task<AdminContractDetailDto> CancelAsync(int id, AdminContractCancelDto dto, CancellationToken cancellationToken = default);
}
