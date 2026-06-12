using BE_API.Configuration;
using BE_API.Service.Ai;
using BE_API.Service.Ai.Tools;
using BE_API.Service.IService;

namespace BE_API.Extensions;

public static class AiServiceCollectionExtensions
{
    public static IServiceCollection AddAiAssistant(this IServiceCollection services, IConfiguration configuration)
    {
        services.Configure<GeminiOptions>(configuration.GetSection(GeminiOptions.SectionName));

        services.AddHttpClient(GeminiClient.HttpClientName);
        services.AddScoped<IGeminiClient, GeminiClient>();

        services.AddSingleton<IPiiRedactor, PiiRedactor>();
        services.AddScoped<IAiToolRegistry, AiToolRegistry>();
        services.AddScoped<IAiAssistantService, AiAssistantService>();

        // Staff tools
        services.AddScoped<IAiTool, GetRevenueOverviewTool>();
        services.AddScoped<IAiTool, GetRevenueTimeseriesTool>();
        services.AddScoped<IAiTool, GetRevenueByPaymentMethodTool>();
        services.AddScoped<IAiTool, GetRevenueByChannelTool>();
        services.AddScoped<IAiTool, GetArSummaryTool>();
        services.AddScoped<IAiTool, GetArAgingTool>();
        services.AddScoped<IAiTool, GetArTopDebtorsTool>();
        services.AddScoped<IAiTool, GetArTimeseriesTool>();
        services.AddScoped<IAiTool, GetSalesFunnelTool>();
        services.AddScoped<IAiTool, GetQuotesExpiringSoonTool>();
        services.AddScoped<IAiTool, GetInventoryOverviewTool>();
        services.AddScoped<IAiTool, GetInventoryLowStockTool>();
        services.AddScoped<IAiTool, GetInventoryDaysOfCoverTool>();
        services.AddScoped<IAiTool, GetInventoryTopMovingTool>();
        services.AddScoped<IAiTool, GetOrderStatusBreakdownTool>();
        services.AddScoped<IAiTool, GetLateOrdersTool>();
        services.AddScoped<IAiTool, GetOrderByCodeTool>();

        // B2B tools
        services.AddScoped<IAiTool, B2BGetMyOrdersTool>();
        services.AddScoped<IAiTool, B2BGetMyOrderByCodeTool>();
        services.AddScoped<IAiTool, B2BGetMyOrderTimelineTool>();
        services.AddScoped<IAiTool, B2BGetMyDebtSummaryTool>();
        services.AddScoped<IAiTool, B2BGetMyInvoicesTool>();
        services.AddScoped<IAiTool, B2BGetMyInvoiceByNumberTool>();
        services.AddScoped<IAiTool, B2BGetMyQuotesTool>();
        services.AddScoped<IAiTool, B2BGetMyQuoteByCodeTool>();

        // B2C tools (cũng cho B2B dùng search/category)
        services.AddScoped<IAiTool, B2CGetMyOrdersTool>();
        services.AddScoped<IAiTool, B2CGetMyOrderByCodeTool>();
        services.AddScoped<IAiTool, B2CGetMyOrderTimelineTool>();
        services.AddScoped<IAiTool, B2CSearchProductsTool>();
        services.AddScoped<IAiTool, GetProductDetailTool>();
        services.AddScoped<IAiTool, GetStorePolicyTool>();
        services.AddScoped<IAiTool, GetCategoriesTool>();

        return services;
    }
}
