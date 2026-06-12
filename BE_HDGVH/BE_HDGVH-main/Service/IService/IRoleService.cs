using BE_API.Dto.Role;

namespace BE_API.Service.IService
{
    public interface IRoleService
    {
        Task<List<RoleResponseDto>> GetRolesAsync();
        Task<RoleResponseDto> GetRoleByIdAsync(int id);
        Task<RoleResponseDto> CreateRoleAsync(RoleCreateDto dto);
        Task<RoleResponseDto> UpdateRoleAsync(int id, RoleUpdateDto dto);
        Task DeleteRoleAsync(int id);
    }
}
