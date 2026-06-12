using BE_API.Dto.Auth;

namespace BE_API.Service.IService;

public interface IAuthService
{
    Task<LoginResponseDto> LoginAsync(LoginRequestDto dto, CancellationToken cancellationToken = default);

    /// <summary>Hồ sơ staff từ DB — FE phân role / menu.</summary>
    Task<StaffMeDto> GetStaffMeAsync(int userId, CancellationToken cancellationToken = default);
}
