using System.Globalization;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using BE_API.Authorization;
using BE_API.Entities;
using BE_API.Service.IService;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

namespace BE_API.Service;

public class JwtTokenService(IOptions<JwtOptions> options) : IJwtTokenService
{
    private readonly JwtOptions _options = options.Value;

    public (string Token, DateTimeOffset ExpiresAtUtc) CreateAccessToken(AppUser user)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_options.Key));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var expires = DateTime.UtcNow.AddMinutes(_options.ExpireMinutes);
        var expiresOffset = new DateTimeOffset(expires, TimeSpan.Zero);

        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, user.Id.ToString(CultureInfo.InvariantCulture)),
            new(JwtRegisteredClaimNames.UniqueName, user.Username),
            new(JwtClaimTypes.Role, user.Role.RoleName),
            new(JwtClaimTypes.FullName, user.FullName),
            new(JwtClaimTypes.PrincipalKind, PrincipalKinds.Staff)
        };

        var token = new JwtSecurityToken(
            issuer: _options.Issuer,
            audience: _options.Audience,
            claims: claims,
            expires: expires,
            signingCredentials: credentials);

        var tokenString = new JwtSecurityTokenHandler().WriteToken(token);
        return (tokenString, expiresOffset);
    }

    public (string Token, DateTimeOffset ExpiresAtUtc) CreateCustomerAccessToken(Customer customer)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_options.Key));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var expires = DateTime.UtcNow.AddMinutes(_options.ExpireMinutes);
        var expiresOffset = new DateTimeOffset(expires, TimeSpan.Zero);

        var loginName = string.IsNullOrWhiteSpace(customer.Email)
            ? (string.IsNullOrWhiteSpace(customer.Phone)
                ? $"customer-{customer.Id}"
                : customer.Phone.Trim())
            : customer.Email.Trim();

        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, customer.Id.ToString(CultureInfo.InvariantCulture)),
            new(JwtRegisteredClaimNames.UniqueName, loginName),
            new(JwtClaimTypes.FullName, customer.FullName),
            new(JwtClaimTypes.PrincipalKind, PrincipalKinds.Customer)
        };

        var token = new JwtSecurityToken(
            issuer: _options.Issuer,
            audience: _options.Audience,
            claims: claims,
            expires: expires,
            signingCredentials: credentials);

        var tokenString = new JwtSecurityTokenHandler().WriteToken(token);
        return (tokenString, expiresOffset);
    }
}
