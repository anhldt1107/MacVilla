using BE_API.Options;
using BE_API.Service;
using BE_API.Service.IService;
using Microsoft.Extensions.Options;
using PayOS;

namespace BE_API.Extensions;

public static class PayOsExtensions
{
    public static IServiceCollection AddPayOsIntegration(this IServiceCollection services)
    {
        services.AddOptions<PayOsAppOptions>().BindConfiguration(PayOsAppOptions.SectionName);

        services.AddSingleton<PayOSClient>(sp =>
        {
            var app = sp.GetRequiredService<IOptions<PayOsAppOptions>>().Value;
            if (string.IsNullOrWhiteSpace(app.ClientId)
                && string.IsNullOrWhiteSpace(app.ApiKey)
                && string.IsNullOrWhiteSpace(app.ChecksumKey))
            {
                return new PayOSClient();
            }

            return new PayOSClient(new PayOSOptions
            {
                ClientId = app.ClientId.Trim(),
                ApiKey = app.ApiKey.Trim(),
                ChecksumKey = app.ChecksumKey.Trim(),
                PartnerCode = string.IsNullOrWhiteSpace(app.PartnerCode) ? null : app.PartnerCode.Trim()
            });
        });

        services.AddScoped<IStorePayOsPaymentService, StorePayOsPaymentService>();
        return services;
    }
}
