namespace BE_API.Dto.Common;

/// <summary>Dữ liệu đã kiểm chữ ký Google ID JWT (sub, email…).</summary>
public sealed class GoogleIdTokenPayload
{
    public string Subject { get; init; } = string.Empty;

    public string? Email { get; init; }

    public bool EmailVerified { get; init; }

    public string? Name { get; init; }

    public string? GivenName { get; init; }

    public string? FamilyName { get; init; }
}
