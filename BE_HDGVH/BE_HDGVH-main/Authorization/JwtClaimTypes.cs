namespace BE_API.Authorization;

/// <summary>
/// Claim types phát hành trong JWT. <see cref="Role"/> phải khớp <c>JwtBearerOptions.TokenValidationParameters.RoleClaimType</c> (Program.cs).
/// </summary>
public static class JwtClaimTypes
{
    public const string Role = "Role";

    /// <summary>Họ tên hiển thị (claim tùy chỉnh).</summary>
    public const string FullName = "full_name";

    /// <summary>Phân biệt JWT nhân sự vs khách hàng — giá trị <see cref="PrincipalKinds"/>.</summary>
    public const string PrincipalKind = "principal_kind";
}
