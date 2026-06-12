using BE_API.Dto.Store;

namespace BE_API.Service.IService;

public interface ICustomerAuthService
{
    Task<StoreCustomerLoginResponseDto> RegisterAsync(StoreCustomerRegisterDto dto, CancellationToken cancellationToken = default);

    Task<StoreCustomerLoginResponseDto> LoginAsync(StoreCustomerLoginDto dto, CancellationToken cancellationToken = default);

    Task<StoreCustomerProfileDto> GetProfileAsync(int customerId, CancellationToken cancellationToken = default);

    Task<StoreCustomerProfileDto> UpdateProfileAsync(int customerId, StoreCustomerUpdateDto dto, CancellationToken cancellationToken = default);

    Task ChangePasswordAsync(int customerId, StoreCustomerChangePasswordDto dto, CancellationToken cancellationToken = default);

    Task<StoreCustomerLoginResponseDto> GoogleSignInAsync(string idToken, CancellationToken cancellationToken = default);
}
