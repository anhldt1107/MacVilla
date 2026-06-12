using BE_API.Options;
using BE_API.Service;
using BE_API.Service.IService;

namespace BE_API.Extensions;

public static class CloudinaryExtensions
{
    public static IServiceCollection AddCloudinaryMediaUpload(this IServiceCollection services)
    {
        services.AddOptions<CloudinaryOptions>().BindConfiguration(CloudinaryOptions.SectionName);
        services.AddScoped<IAdminMediaUploadService, AdminMediaUploadService>();
        return services;
    }
}
