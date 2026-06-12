using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using BE_API.ExceptionHandling;

namespace BE_API.Authorization;

public static class StoreCustomerPrincipal
{
    public static int GetCustomerId(ClaimsPrincipal user)
    {
        var sub = user.FindFirst(JwtRegisteredClaimNames.Sub)?.Value
                  ?? user.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!int.TryParse(sub, out var id) || id <= 0)
            throw new AuthenticationFailedException();
        return id;
    }
}
