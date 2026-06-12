namespace BE_API.Configuration;

/// <summary>
/// OAuth Web Client ID của Google Cloud / Firebase (dùng làm audience khi kiểm tra Google ID JWT).
/// Phải trùng OAuth 2.0 Client ID kiểu Web trong Firebase Console.
/// </summary>
public sealed class GoogleOAuthOptions
{
    public const string SectionName = "GoogleOAuth";

    public string ClientId { get; set; } = string.Empty;
}
