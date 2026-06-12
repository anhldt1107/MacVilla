using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

namespace BE_API.Authorization;

/// <summary>Đọc role / user id từ JWT staff — dùng thống nhất trên controllers.</summary>
public static class StaffRoleResolver
{
    public static int? GetCurrentUserId(ClaimsPrincipal user)
    {
        var sub = user.FindFirst(JwtRegisteredClaimNames.Sub)?.Value
                  ?? user.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return int.TryParse(sub, out var id) ? id : null;
    }

    public static string GetRole(ClaimsPrincipal user) =>
        user.FindFirst(JwtClaimTypes.Role)?.Value ?? string.Empty;

    public static bool IsManagerOrAdmin(ClaimsPrincipal user)
    {
        var role = GetRole(user);
        return IsManagerOrAdmin(role);
    }

    public static bool IsManagerOrAdmin(string role) =>
        string.Equals(role, AppRoles.Admin, StringComparison.OrdinalIgnoreCase)
        || string.Equals(role, AppRoles.Manager, StringComparison.OrdinalIgnoreCase);

    public static bool IsAdmin(ClaimsPrincipal user) =>
        string.Equals(GetRole(user), AppRoles.Admin, StringComparison.OrdinalIgnoreCase);

    public static bool IsSales(ClaimsPrincipal user) =>
        string.Equals(GetRole(user), AppRoles.Sales, StringComparison.OrdinalIgnoreCase);

    public static bool IsSales(string role) =>
        string.Equals(role, AppRoles.Sales, StringComparison.OrdinalIgnoreCase);
}
