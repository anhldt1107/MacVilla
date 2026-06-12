using BE_API.Dto.Admin;
using BE_API.Dto.Common;

namespace BE_API.Service.IService;

public interface IAdminUserService
{
    /// <summary>
    /// Lấy danh sách nhân sự có phân trang và filter
    /// </summary>
    Task<PagedResultDto<AdminUserListItemDto>> GetPagedAsync(
        int page,
        int pageSize,
        int? roleId = null,
        string? status = null,
        string? search = null,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Lấy chi tiết nhân sự theo ID
    /// </summary>
    Task<AdminUserDetailDto> GetByIdAsync(int id, CancellationToken cancellationToken = default);

    /// <summary>
    /// Tạo tài khoản nhân sự mới
    /// </summary>
    Task<AdminUserDetailDto> CreateAsync(
        AdminUserCreateDto dto,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Cập nhật thông tin nhân sự
    /// </summary>
    Task<AdminUserDetailDto> UpdateAsync(
        int id,
        AdminUserUpdateDto dto,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Cập nhật trạng thái tài khoản (Kích hoạt / Khóa)
    /// </summary>
    Task<AdminUserDetailDto> UpdateStatusAsync(
        int id,
        AdminUserUpdateStatusDto dto,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Reset mật khẩu nhân sự
    /// </summary>
    Task<AdminUserDetailDto> ResetPasswordAsync(
        int id,
        AdminUserResetPasswordDto dto,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Lấy danh sách Role cho dropdown
    /// </summary>
    Task<List<AdminRoleOptionDto>> GetRoleOptionsAsync(CancellationToken cancellationToken = default);

    /// <summary>
    /// Lấy danh sách trạng thái user
    /// </summary>
    string[] GetUserStatuses();
}
