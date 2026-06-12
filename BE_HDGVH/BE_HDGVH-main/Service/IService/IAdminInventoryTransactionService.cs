using BE_API.Dto.Common;
using BE_API.Dto.InventoryTransaction;

namespace BE_API.Service.IService;

public interface IAdminInventoryTransactionService
{
    Task<PagedResultDto<InventoryTransactionListItemDto>> GetTransactionsPagedAsync(
        int page,
        int pageSize,
        int? variantId,
        string? transactionType,
        DateTime? fromDate,
        DateTime? toDate,
        string? referenceType = null,
        string? referenceId = null,
        int? workerIdAssigned = null,
        CancellationToken cancellationToken = default);

    Task<InventoryTransactionDetailDto> GetTransactionByIdAsync(int id, CancellationToken cancellationToken = default);

    Task<InventoryTransactionDetailDto> CreateTransactionAsync(
        InventoryTransactionCreateDto dto,
        int createdByUserId,
        CancellationToken cancellationToken = default);
}
