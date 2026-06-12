using BE_API.Dto.Store;

namespace BE_API.Service.IService;

public interface ICustomerAddressService
{
    Task<List<StoreAddressDto>> ListAsync(int customerId, CancellationToken cancellationToken = default);

    Task<StoreAddressDto> CreateAsync(int customerId, StoreAddressCreateDto dto, CancellationToken cancellationToken = default);

    Task<StoreAddressDto> UpdateAsync(int customerId, int addressId, StoreAddressUpdateDto dto, CancellationToken cancellationToken = default);

    Task DeleteAsync(int customerId, int addressId, CancellationToken cancellationToken = default);

    Task<StoreAddressDto> SetDefaultAsync(int customerId, int addressId, CancellationToken cancellationToken = default);
}
