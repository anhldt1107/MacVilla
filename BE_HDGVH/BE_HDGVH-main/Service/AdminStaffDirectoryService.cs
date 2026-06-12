using BE_API.Database;
using BE_API.Dto.Admin;
using BE_API.Service.IService;
using Microsoft.EntityFrameworkCore;

namespace BE_API.Service;

public class AdminStaffDirectoryService(BeContext db) : IAdminStaffDirectoryService
{
    public async Task<IReadOnlyList<AdminStaffDirectoryItemDto>> GetAsync(
        string? role,
        string? status,
        string? search,
        CancellationToken cancellationToken = default)
    {
        var query = db.AppUsers
            .AsNoTracking()
            .Include(u => u.Role)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(role))
        {
            var roleTrim = role.Trim();
            query = query.Where(u => u.Role.RoleName == roleTrim);
        }

        if (!string.IsNullOrWhiteSpace(status))
        {
            var st = status.Trim();
            query = query.Where(u => u.Status == st);
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.Trim().ToLower();
            query = query.Where(u =>
                u.Username.ToLower().Contains(s) ||
                u.FullName.ToLower().Contains(s) ||
                (u.Email != null && u.Email.ToLower().Contains(s)) ||
                (u.Phone != null && u.Phone.Contains(s)));
        }

        return await query
            .OrderBy(u => u.FullName)
            .Select(u => new AdminStaffDirectoryItemDto
            {
                Id = u.Id,
                Username = u.Username,
                FullName = u.FullName,
                Email = u.Email,
                Phone = u.Phone,
                RoleName = u.Role.RoleName,
                Status = u.Status
            })
            .ToListAsync(cancellationToken);
    }
}
