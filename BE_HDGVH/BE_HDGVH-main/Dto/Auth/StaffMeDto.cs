namespace BE_API.Dto.Auth;

/// <summary>
/// Hồ sơ nhân viên đăng nhập — dùng cho FE phân quyền / sidebar (GET /api/me).
/// </summary>
public class StaffMeDto
{
    /// <summary>Luôn "staff" (PrincipalKinds.Staff) — đối chiếu với JWT khách.</summary>
    public string PrincipalKind { get; set; } = string.Empty;

    public int Id { get; set; }
    public string Username { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string? Phone { get; set; }
    public string Status { get; set; } = string.Empty;

    public int RoleId { get; set; }
    public string RoleName { get; set; } = string.Empty;
    public string? RoleDescription { get; set; }

    /// <summary>Chuỗi quyền từ bảng Role (nếu có; có thể là JSON tùy triển khai).</summary>
    public string? Permissions { get; set; }

    /// <summary>true nếu role thuộc nhóm được gọi API kho/fulfillment (cùng logic policy WarehouseStaff).</summary>
    public bool CanAccessWarehouse { get; set; }
}
