namespace BE_API.Dto.Store;

/// <summary>
/// GIS / Firebase: gửi <c>credential</c> hoặc <c>idToken</c> (Google ID JWT).
/// </summary>
public class StoreGoogleLoginDto
{
    /// <summary>JWT Google OIDC.</summary>
    public string? IdToken { get; set; }

    /// <summary>Alias cho Google Identity Services (field <c>credential</c>).</summary>
    public string? Credential { get; set; }
}
