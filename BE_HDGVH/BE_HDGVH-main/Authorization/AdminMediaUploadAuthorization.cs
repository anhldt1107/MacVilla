using System.Security.Claims;

namespace BE_API.Authorization;

/// <summary>
/// Phân quyền upload media: Admin mọi folder; staff khác chỉ tài liệu nghiệp vụ (contract, invoice, …).
/// </summary>
public static class AdminMediaUploadAuthorization
{
    private static readonly HashSet<string> StaffDocumentFolders = new(StringComparer.OrdinalIgnoreCase)
    {
        "contract",
        "invoice",
        "quote",
        "order",
        "payment",
        "warranty",
        "return",
    };

    public static bool CanUpload(ClaimsPrincipal user, string? folder)
    {
        if (StaffRoleResolver.IsAdmin(user)) return true;

        var topSegment = GetTopFolderSegment(folder);
        return topSegment != null && StaffDocumentFolders.Contains(topSegment);
    }

    public static string? GetTopFolderSegment(string? folder)
    {
        if (string.IsNullOrWhiteSpace(folder)) return null;

        var seg = folder.Trim()
            .Split(['/', '\\'], StringSplitOptions.RemoveEmptyEntries)
            .FirstOrDefault()
            ?.Trim();

        return string.IsNullOrEmpty(seg) ? null : seg;
    }
}
