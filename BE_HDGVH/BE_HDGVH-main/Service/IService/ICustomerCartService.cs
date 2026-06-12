using BE_API.Dto.Store;

namespace BE_API.Service.IService;

public interface ICustomerCartService
{
    Task<StoreCartDto> GetCartAsync(int customerId, CancellationToken cancellationToken = default);

    Task<StoreCartDto> AddOrUpdateItemAsync(
        int customerId,
        StoreCartAddItemDto dto,
        CancellationToken cancellationToken = default);

    Task<StoreCartDto> SetQuantityAsync(
        int customerId,
        int variantId,
        StoreCartSetQuantityDto dto,
        CancellationToken cancellationToken = default);

    Task<StoreCartDto> RemoveItemAsync(int customerId, int variantId, CancellationToken cancellationToken = default);

    Task ClearAsync(int customerId, CancellationToken cancellationToken = default);
}
