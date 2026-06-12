using BE_API.Entities;

namespace BE_API.Service.IService;

public interface IJwtTokenService
{
    (string Token, DateTimeOffset ExpiresAtUtc) CreateAccessToken(AppUser user);

    (string Token, DateTimeOffset ExpiresAtUtc) CreateCustomerAccessToken(Customer customer);
}
