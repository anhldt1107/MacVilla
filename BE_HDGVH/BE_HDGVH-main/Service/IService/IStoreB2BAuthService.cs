using BE_API.Dto.Store;

namespace BE_API.Service.IService;

public interface IStoreB2BAuthService
{
    Task<StoreB2BLoginResponseDto> RegisterAsync(StoreB2BRegisterDto dto, CancellationToken cancellationToken = default);

    Task<StoreB2BLoginResponseDto> LoginAsync(StoreB2BLoginDto dto, CancellationToken cancellationToken = default);

    Task<StoreB2BLoginResponseDto> GoogleSignInAsync(string idToken, CancellationToken cancellationToken = default);

    Task<StoreB2BProfileDto> GetProfileAsync(int customerId, CancellationToken cancellationToken = default);

    Task<StoreB2BProfileDto> UpdateProfileAsync(int customerId, StoreB2BUpdateDto dto, CancellationToken cancellationToken = default);
}
