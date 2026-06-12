namespace BE_API.Dto.Admin;

/// <summary>
/// DTO hiển thị danh sách nhân sự cho Admin
/// </summary>
public class AdminUserListItemDto
{
    public int Id { get; set; }
    public string Username { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string? Phone { get; set; }
    public int RoleId { get; set; }
    public string RoleName { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}

/// <summary>
/// DTO chi tiết nhân sự cho Admin
/// </summary>
public class AdminUserDetailDto
{
    public int Id { get; set; }
    public string Username { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string? Phone { get; set; }
    public int RoleId { get; set; }
    public string RoleName { get; set; } = string.Empty;
    public string? RoleDescription { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }

    // Statistics
    public int OrdersHandledCount { get; set; }
    public int QuotesCreatedCount { get; set; }
}

/// <summary>
/// DTO tạo tài khoản nhân sự mới
/// </summary>
public class AdminUserCreateDto
{
    public string Username { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string? Phone { get; set; }
    public int RoleId { get; set; }
}

/// <summary>
/// DTO cập nhật thông tin nhân sự
/// </summary>
public class AdminUserUpdateDto
{
    public string? FullName { get; set; }
    public string? Email { get; set; }
    public string? Phone { get; set; }
    public int? RoleId { get; set; }
}

/// <summary>
/// DTO cập nhật trạng thái tài khoản
/// </summary>
public class AdminUserUpdateStatusDto
{
    public string Status { get; set; } = string.Empty;
}

/// <summary>
/// DTO reset mật khẩu
/// </summary>
public class AdminUserResetPasswordDto
{
    public string NewPassword { get; set; } = string.Empty;
}

/// <summary>
/// DTO thông tin Role cho dropdown
/// </summary>
public class AdminRoleOptionDto
{
    public int Id { get; set; }
    public string RoleName { get; set; } = string.Empty;
    public string? Description { get; set; }
}
