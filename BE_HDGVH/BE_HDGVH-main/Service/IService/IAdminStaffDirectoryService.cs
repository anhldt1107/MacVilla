using BE_API.Dto.Admin;

namespace BE_API.Service.IService;

public interface IAdminStaffDirectoryService
{
    Task<IReadOnlyList<AdminStaffDirectoryItemDto>> GetAsync(
        string? role,
        string? status,
        string? search,
        CancellationToken cancellationToken = default);
}
