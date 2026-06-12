using BE_API.Service;
using BE_API.Service.IService;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;

namespace BE_API.Authorization;

public static class AuthorizationExtensions
{
    /// <summary>
    /// Đăng ký JWT validation, policy phân quyền, và dịch vụ token.
    /// </summary>
    public static IServiceCollection AddAppAuthenticationAndAuthorization(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        services.AddOptions<JwtOptions>()
            .BindConfiguration(JwtOptions.SectionName)
            .Validate(o => !string.IsNullOrWhiteSpace(o.Key) && o.Key.Length >= 32, "Jwt:Key phải có ít nhất 32 ký tự.")
            .ValidateOnStart();

        var jwtSection = configuration.GetSection(JwtOptions.SectionName);
        var keyBytes = Encoding.UTF8.GetBytes(jwtSection["Key"]!);

        services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
            .AddJwtBearer(options =>
            {
                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidateAudience = true,
                    ValidateLifetime = true,
                    ValidateIssuerSigningKey = true,
                    ValidIssuer = jwtSection["Issuer"],
                    ValidAudience = jwtSection["Audience"],
                    IssuerSigningKey = new SymmetricSecurityKey(keyBytes),
                    RoleClaimType = JwtClaimTypes.Role
                };
            });

        services.AddAuthorization(options =>
        {
            options.AddPolicy(Policies.AdminOnly, p => p.RequireRole(AppRoles.Admin));

            options.AddPolicy(
                Policies.ManagerOrAdmin,
                p => p.RequireAuthenticatedUser()
                    .RequireClaim(JwtClaimTypes.PrincipalKind, PrincipalKinds.Staff)
                    .RequireRole(AppRoles.Admin, AppRoles.Manager));

            options.AddPolicy(
                Policies.ManagerOrAdminOrStockManager,
                p => p.RequireAuthenticatedUser()
                    .RequireClaim(JwtClaimTypes.PrincipalKind, PrincipalKinds.Staff)
                    .RequireRole(AppRoles.Admin, AppRoles.Manager, AppRoles.StockManager));

            options.AddPolicy(
                Policies.WarehouseStaff,
                p => p.RequireAuthenticatedUser()
                    .RequireClaim(JwtClaimTypes.PrincipalKind, PrincipalKinds.Staff)
                    .RequireRole(
                        AppRoles.Admin,
                        AppRoles.Manager,
                        AppRoles.StockManager,
                        AppRoles.Worker));

            options.AddPolicy(
                Policies.StaffAuthenticated,
                p => p.RequireAuthenticatedUser()
                    .RequireClaim(JwtClaimTypes.PrincipalKind, PrincipalKinds.Staff));

            options.AddPolicy(
                Policies.CustomerAuthenticated,
                p => p.RequireAuthenticatedUser()
                    .RequireClaim(JwtClaimTypes.PrincipalKind, PrincipalKinds.Customer));
        });

        services.AddSingleton<IJwtTokenService, JwtTokenService>();
        services.AddScoped<IAuthService, AuthService>();

        return services;
    }
}
