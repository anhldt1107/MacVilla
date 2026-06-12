using BE_API.Dto.Common;

namespace BE_API.Service.IService;

/// <summary>Kiểm tra Google ID token (Firebase / GIS), audience = <see cref="Configuration.GoogleOAuthOptions.ClientId"/>.</summary>
public interface IGoogleIdTokenVerifier
{
    Task<GoogleIdTokenPayload> VerifyAsync(string idToken, CancellationToken cancellationToken = default);
}
