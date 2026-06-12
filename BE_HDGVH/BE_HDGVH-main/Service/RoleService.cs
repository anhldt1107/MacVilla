using BE_API.Dto.Role;
using BE_API.Entities;
using BE_API.Repository;
using BE_API.Service.IService;
using Microsoft.EntityFrameworkCore;

namespace BE_API.Service
{
    public class RoleService : IRoleService
    {
        private readonly IRepository<Role> _roleRepo;

        public RoleService(IRepository<Role> roleRepo)
        {
            _roleRepo = roleRepo;
        }

        public async Task<List<RoleResponseDto>> GetRolesAsync()
        {
            return await _roleRepo.Get()
                .OrderBy(x => x.Id)
                .Select(x => new RoleResponseDto
                {
                    Id = x.Id,
                    RoleName = x.RoleName,
                    Description = x.Description,
                    Permissions = x.Permissions
                })
                .ToListAsync();
        }

        public async Task<RoleResponseDto> GetRoleByIdAsync(int id)
        {
            var role = await _roleRepo.Get()
                .FirstOrDefaultAsync(x => x.Id == id)
                ?? throw new KeyNotFoundException("Không tìm thấy role");

            return new RoleResponseDto
            {
                Id = role.Id,
                RoleName = role.RoleName,
                Description = role.Description,
                Permissions = role.Permissions
            };
        }

        public async Task<RoleResponseDto> CreateRoleAsync(RoleCreateDto dto)
        {
            var roleName = dto.RoleName.Trim();

            var exists = await _roleRepo.Get()
                .AnyAsync(x => x.RoleName == roleName);

            if (exists)
            {
                throw new InvalidOperationException("Tên role đã tồn tại");
            }

            var role = new Role
            {
                RoleName = roleName,
                Description = dto.Description?.Trim(),
                Permissions = dto.Permissions?.Trim()
            };

            await _roleRepo.AddAsync(role);
            await _roleRepo.SaveChangesAsync();

            return new RoleResponseDto
            {
                Id = role.Id,
                RoleName = role.RoleName,
                Description = role.Description,
                Permissions = role.Permissions
            };
        }

        public async Task<RoleResponseDto> UpdateRoleAsync(int id, RoleUpdateDto dto)
        {
            var role = await _roleRepo.Get()
                .FirstOrDefaultAsync(x => x.Id == id)
                ?? throw new KeyNotFoundException("Không tìm thấy role");

            var roleName = dto.RoleName.Trim();

            var exists = await _roleRepo.Get()
                .AnyAsync(x => x.RoleName == roleName && x.Id != id);

            if (exists)
            {
                throw new InvalidOperationException("Tên role đã tồn tại");
            }

            role.RoleName = roleName;
            role.Description = dto.Description?.Trim();
            role.Permissions = dto.Permissions?.Trim();

            _roleRepo.Update(role);
            await _roleRepo.SaveChangesAsync();

            return new RoleResponseDto
            {
                Id = role.Id,
                RoleName = role.RoleName,
                Description = role.Description,
                Permissions = role.Permissions
            };
        }

        public async Task DeleteRoleAsync(int id)
        {
            var role = await _roleRepo.Get()
                .Include(x => x.Users)
                .FirstOrDefaultAsync(x => x.Id == id)
                ?? throw new KeyNotFoundException("Không tìm thấy role");

            if (role.Users.Any())
            {
                throw new InvalidOperationException("Role đang được gán cho người dùng, không thể xóa");
            }

            _roleRepo.Delete(role);
            await _roleRepo.SaveChangesAsync();
        }
    }
}
