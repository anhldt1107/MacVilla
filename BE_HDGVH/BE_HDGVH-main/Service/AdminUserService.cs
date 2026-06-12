using BE_API.Database;
using BE_API.Domain;
using BE_API.Dto.Admin;
using BE_API.Dto.Common;
using BE_API.Entities;
using BE_API.Service.IService;
using Microsoft.EntityFrameworkCore;

namespace BE_API.Service;

public class AdminUserService(BeContext db) : IAdminUserService
{
    private const int MinPasswordLength = 6;

    public async Task<PagedResultDto<AdminUserListItemDto>> GetPagedAsync(
        int page,
        int pageSize,
        int? roleId = null,
        string? status = null,
        string? search = null,
        CancellationToken cancellationToken = default)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 500);

        var query = db.AppUsers
            .AsNoTracking()
            .Include(u => u.Role)
            .AsQueryable();

        if (roleId.HasValue)
        {
            query = query.Where(u => u.RoleId == roleId.Value);
        }

        if (!string.IsNullOrWhiteSpace(status))
        {
            query = query.Where(u => u.Status == status);
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var searchLower = search.ToLower().Trim();
            query = query.Where(u =>
                u.Username.ToLower().Contains(searchLower) ||
                u.FullName.ToLower().Contains(searchLower) ||
                (u.Email != null && u.Email.ToLower().Contains(searchLower)) ||
                (u.Phone != null && u.Phone.Contains(searchLower)));
        }

        var total = await query.CountAsync(cancellationToken);

        var items = await query
            .OrderByDescending(u => u.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(u => new AdminUserListItemDto
            {
                Id = u.Id,
                Username = u.Username,
                FullName = u.FullName,
                Email = u.Email,
                Phone = u.Phone,
                RoleId = u.RoleId,
                RoleName = u.Role.RoleName,
                Status = u.Status,
                CreatedAt = u.CreatedAt,
                UpdatedAt = u.UpdatedAt
            })
            .ToListAsync(cancellationToken);

        return new PagedResultDto<AdminUserListItemDto>
        {
            Items = items,
            TotalCount = total,
            Page = page,
            PageSize = pageSize
        };
    }

    public async Task<AdminUserDetailDto> GetByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        var user = await db.AppUsers
            .AsNoTracking()
            .Include(u => u.Role)
            .Include(u => u.OrdersAsSales)
            .Include(u => u.QuotesAsSales)
            .FirstOrDefaultAsync(u => u.Id == id, cancellationToken)
            ?? throw new KeyNotFoundException($"Không tìm thấy nhân sự với ID {id}");

        return MapToDetailDto(user);
    }

    public async Task<AdminUserDetailDto> CreateAsync(
        AdminUserCreateDto dto,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(dto.Username))
            throw new ArgumentException("Tên đăng nhập không được để trống");

        if (string.IsNullOrWhiteSpace(dto.Password))
            throw new ArgumentException("Mật khẩu không được để trống");

        if (dto.Password.Length < MinPasswordLength)
            throw new ArgumentException($"Mật khẩu phải có ít nhất {MinPasswordLength} ký tự");

        if (string.IsNullOrWhiteSpace(dto.FullName))
            throw new ArgumentException("Họ tên không được để trống");

        var existingUsername = await db.AppUsers
            .AnyAsync(u => u.Username.ToLower() == dto.Username.Trim().ToLower(), cancellationToken);
        if (existingUsername)
            throw new InvalidOperationException($"Tên đăng nhập '{dto.Username}' đã được sử dụng");

        if (!string.IsNullOrWhiteSpace(dto.Email))
        {
            var existingEmail = await db.AppUsers
                .AnyAsync(u => u.Email != null && u.Email.ToLower() == dto.Email.Trim().ToLower(), cancellationToken);
            if (existingEmail)
                throw new InvalidOperationException($"Email '{dto.Email}' đã được sử dụng");
        }

        var roleExists = await db.Roles.AnyAsync(r => r.Id == dto.RoleId, cancellationToken);
        if (!roleExists)
            throw new KeyNotFoundException($"Không tìm thấy vai trò với ID {dto.RoleId}");

        var user = new AppUser
        {
            Username = dto.Username.Trim().ToLower(),
            PasswordHash = dto.Password,
            FullName = dto.FullName.Trim(),
            Email = dto.Email?.Trim(),
            Phone = dto.Phone?.Trim(),
            RoleId = dto.RoleId,
            Status = UserStatuses.Active,
            CreatedAt = DateTime.UtcNow
        };

        await db.AppUsers.AddAsync(user, cancellationToken);
        await db.SaveChangesAsync(cancellationToken);

        return await GetByIdAsync(user.Id, cancellationToken);
    }

    public async Task<AdminUserDetailDto> UpdateAsync(
        int id,
        AdminUserUpdateDto dto,
        CancellationToken cancellationToken = default)
    {
        var user = await db.AppUsers.FindAsync([id], cancellationToken)
            ?? throw new KeyNotFoundException($"Không tìm thấy nhân sự với ID {id}");

        if (dto.FullName != null)
        {
            if (string.IsNullOrWhiteSpace(dto.FullName))
                throw new ArgumentException("Họ tên không được để trống");
            user.FullName = dto.FullName.Trim();
        }

        if (dto.Email != null)
        {
            if (!string.IsNullOrWhiteSpace(dto.Email))
            {
                var existingEmail = await db.AppUsers
                    .AnyAsync(u => u.Id != id && u.Email != null && u.Email.ToLower() == dto.Email.Trim().ToLower(), cancellationToken);
                if (existingEmail)
                    throw new InvalidOperationException($"Email '{dto.Email}' đã được sử dụng");
            }
            user.Email = string.IsNullOrWhiteSpace(dto.Email) ? null : dto.Email.Trim();
        }

        if (dto.Phone != null)
        {
            user.Phone = string.IsNullOrWhiteSpace(dto.Phone) ? null : dto.Phone.Trim();
        }

        if (dto.RoleId.HasValue)
        {
            var roleExists = await db.Roles.AnyAsync(r => r.Id == dto.RoleId.Value, cancellationToken);
            if (!roleExists)
                throw new KeyNotFoundException($"Không tìm thấy vai trò với ID {dto.RoleId}");
            user.RoleId = dto.RoleId.Value;
        }

        user.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync(cancellationToken);

        return await GetByIdAsync(id, cancellationToken);
    }

    public async Task<AdminUserDetailDto> UpdateStatusAsync(
        int id,
        AdminUserUpdateStatusDto dto,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(dto.Status))
            throw new ArgumentException("Trạng thái không được để trống");

        if (!UserStatuses.IsValid(dto.Status))
            throw new ArgumentException($"Trạng thái '{dto.Status}' không hợp lệ. Chỉ chấp nhận: {string.Join(", ", UserStatuses.All)}");

        var user = await db.AppUsers.FindAsync([id], cancellationToken)
            ?? throw new KeyNotFoundException($"Không tìm thấy nhân sự với ID {id}");

        var normalizedStatus = UserStatuses.All.First(s =>
            string.Equals(s, dto.Status, StringComparison.OrdinalIgnoreCase));

        user.Status = normalizedStatus;
        user.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync(cancellationToken);

        return await GetByIdAsync(id, cancellationToken);
    }

    public async Task<AdminUserDetailDto> ResetPasswordAsync(
        int id,
        AdminUserResetPasswordDto dto,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(dto.NewPassword))
            throw new ArgumentException("Mật khẩu mới không được để trống");

        if (dto.NewPassword.Length < MinPasswordLength)
            throw new ArgumentException($"Mật khẩu phải có ít nhất {MinPasswordLength} ký tự");

        var user = await db.AppUsers.FindAsync([id], cancellationToken)
            ?? throw new KeyNotFoundException($"Không tìm thấy nhân sự với ID {id}");

        user.PasswordHash = dto.NewPassword;
        user.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync(cancellationToken);

        return await GetByIdAsync(id, cancellationToken);
    }

    public async Task<List<AdminRoleOptionDto>> GetRoleOptionsAsync(CancellationToken cancellationToken = default)
    {
        return await db.Roles
            .AsNoTracking()
            .OrderBy(r => r.RoleName)
            .Select(r => new AdminRoleOptionDto
            {
                Id = r.Id,
                RoleName = r.RoleName,
                Description = r.Description
            })
            .ToListAsync(cancellationToken);
    }

    public string[] GetUserStatuses() => UserStatuses.All;

    private static AdminUserDetailDto MapToDetailDto(AppUser user)
    {
        return new AdminUserDetailDto
        {
            Id = user.Id,
            Username = user.Username,
            FullName = user.FullName,
            Email = user.Email,
            Phone = user.Phone,
            RoleId = user.RoleId,
            RoleName = user.Role.RoleName,
            RoleDescription = user.Role.Description,
            Status = user.Status,
            CreatedAt = user.CreatedAt,
            UpdatedAt = user.UpdatedAt,
            OrdersHandledCount = user.OrdersAsSales.Count,
            QuotesCreatedCount = user.QuotesAsSales.Count
        };
    }
}
