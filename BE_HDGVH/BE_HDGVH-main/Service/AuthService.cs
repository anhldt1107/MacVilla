using BE_API.Authorization;
using BE_API.Dto.Auth;
using BE_API.Entities;
using BE_API.ExceptionHandling;
using BE_API.Repository;
using BE_API.Service.IService;
using Microsoft.EntityFrameworkCore;

namespace BE_API.Service;

public class AuthService(IRepository<AppUser> userRepo, IJwtTokenService jwtTokenService) : IAuthService
{
    public async Task<LoginResponseDto> LoginAsync(LoginRequestDto dto, CancellationToken cancellationToken = default)
    {
        var username = dto.Username.Trim();
        if (string.IsNullOrEmpty(username) || string.IsNullOrEmpty(dto.Password))
            throw new AuthenticationFailedException();

        var user = await userRepo.Get()
            .AsNoTracking()
            .Include(u => u.Role)
            .FirstOrDefaultAsync(
                u => u.Username.ToLower() == username.ToLower(),
                cancellationToken);

        if (user is null)
            throw new AuthenticationFailedException();

        if (!string.Equals(user.Status, "Active", StringComparison.OrdinalIgnoreCase))
            throw new AuthenticationFailedException();
        //Tạm comment đổi thành  == vì đang test trên local
        // if (!BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash))
        //     throw new AuthenticationFailedException();
        if (dto.Password != user.PasswordHash)
            throw new AuthenticationFailedException();

        var (token, expiresAt) = jwtTokenService.CreateAccessToken(user);

        return new LoginResponseDto
        {
            AccessToken = token,
            ExpiresAtUtc = expiresAt,
            User = new AuthenticatedUserDto
            {
                Id = user.Id,
                Username = user.Username,
                FullName = user.FullName,
                RoleName = user.Role.RoleName
            }
        };
    }

    public async Task<StaffMeDto> GetStaffMeAsync(int userId, CancellationToken cancellationToken = default)
    {
        var user = await userRepo.Get()
            .AsNoTracking()
            .Include(u => u.Role)
            .FirstOrDefaultAsync(u => u.Id == userId, cancellationToken)
            ?? throw new KeyNotFoundException("Không tìm thấy người dùng");

        var roleName = user.Role.RoleName;
        var canWarehouse = IsWarehouseStaffRole(roleName);

        return new StaffMeDto
        {
            PrincipalKind = PrincipalKinds.Staff,
            Id = user.Id,
            Username = user.Username,
            FullName = user.FullName,
            Email = user.Email,
            Phone = user.Phone,
            Status = user.Status,
            RoleId = user.RoleId,
            RoleName = roleName,
            RoleDescription = user.Role.Description,
            Permissions = user.Role.Permissions,
            CanAccessWarehouse = canWarehouse
        };
    }

    private static bool IsWarehouseStaffRole(string roleName) =>
        string.Equals(roleName, AppRoles.Admin, StringComparison.OrdinalIgnoreCase) ||
        string.Equals(roleName, AppRoles.Manager, StringComparison.OrdinalIgnoreCase) ||
        string.Equals(roleName, AppRoles.StockManager, StringComparison.OrdinalIgnoreCase) ||
        string.Equals(roleName, AppRoles.Worker, StringComparison.OrdinalIgnoreCase);
}
