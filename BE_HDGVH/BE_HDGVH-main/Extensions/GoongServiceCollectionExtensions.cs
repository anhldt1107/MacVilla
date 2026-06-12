using BE_API.Configuration;
using BE_API.Service;
using BE_API.Service.IService;

namespace BE_API.Extensions;

public static class GoongServiceCollectionExtensions
{
    public static IServiceCollection AddGoongIntegration(this IServiceCollection services, IConfiguration configuration)
    {
        services.Configure<GoongOptions>(configuration.GetSection(GoongOptions.SectionName));

        services.AddHttpClient(GoongPlaceService.HttpClientName, (sp, client) =>
        {
            var opts = sp.GetRequiredService<Microsoft.Extensions.Options.IOptions<GoongOptions>>().Value;
            client.Timeout = TimeSpan.FromSeconds(Math.Max(5, opts.RequestTimeoutSeconds));
        });

        services.AddScoped<IGoongPlaceService, GoongPlaceService>();

        return services;
    }
}
