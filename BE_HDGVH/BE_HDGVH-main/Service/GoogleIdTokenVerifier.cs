using BE_API.Configuration;
using BE_API.Dto.Common;
using BE_API.Service.IService;
using Google.Apis.Auth;
using Microsoft.Extensions.Options;

namespace BE_API.Service;

/// <inheritdoc />
public sealed class GoogleIdTokenVerifier(IOptions<GoogleOAuthOptions> options) : IGoogleIdTokenVerifier
{
    /// <inheritdoc />
    public Task<GoogleIdTokenPayload> VerifyAsync(string idToken, CancellationToken cancellationToken = default)
    {
        var clientId = options.Value.ClientId?.Trim();
        if (string.IsNullOrEmpty(clientId))
            throw new InvalidOperationException(
                "Chưa cấu hình GoogleOAuth:ClientId — dùng Web client ID của Firebase/Google Cloud (JWT aud phải khớp).");

        var validation = new GoogleJsonWebSignature.ValidationSettings
        {
            Audience = new[] { clientId },
        };

        cancellationToken.ThrowIfCancellationRequested();

        return VerifyCoreAsync(idToken, validation);
    }

    private static async Task<GoogleIdTokenPayload> VerifyCoreAsync(
        string idToken,
        GoogleJsonWebSignature.ValidationSettings validation)
    {
        GoogleJsonWebSignature.Payload payload =
            await GoogleJsonWebSignature.ValidateAsync(idToken, validation).ConfigureAwait(false);

        return new GoogleIdTokenPayload
        {
            Subject = payload.Subject ?? string.Empty,
            Email = payload.Email,
            EmailVerified = payload.EmailVerified,
            Name = payload.Name,
            GivenName = payload.GivenName,
            FamilyName = payload.FamilyName,
        };
    }
}
