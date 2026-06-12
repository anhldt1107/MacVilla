using BE_API.Repository;
using BE_API.Service;
using BE_API.Service.Dashboard;
using BE_API.Service.IService;

namespace BE_API.Extensions
{
    public static class ServiceCollectionExtensions
    {
        public static void Register(this IServiceCollection services)
        {
            services.AddScoped(typeof(IRepository<>), typeof(Repository<>));
            services.AddScoped<IRoleService, RoleService>();
            services.AddScoped<ICategoryService, CategoryService>();
            services.AddScoped<IProductService, ProductService>();
            services.AddScoped<IProductAttributeService, ProductAttributeService>();
            services.AddScoped<IProductAttributeValueService, ProductAttributeValueService>();
            services.AddScoped<IProductVariantService, ProductVariantService>();
            services.AddScoped<IInventoryService, InventoryService>();
            services.AddScoped<IStoreCatalogService, StoreCatalogService>();
            services.AddScoped<ICustomerAuthService, CustomerAuthService>();
            services.AddScoped<IStoreB2BAuthService, StoreB2BAuthService>();
            services.AddScoped<IStoreB2BQuoteService, StoreB2BQuoteService>();
            services.AddScoped<IStoreB2BContractService, StoreB2BContractService>();
            services.AddScoped<IStoreB2BOrderService, StoreB2BOrderService>();
            services.AddScoped<IStoreB2BInvoiceService, StoreB2BInvoiceService>();
            services.AddScoped<IStoreB2BPaymentService, StoreB2BPaymentService>();
            services.AddScoped<IStoreB2BAfterSalesService, StoreB2BAfterSalesService>();
            services.AddScoped<ICustomerAddressService, CustomerAddressService>();
            services.AddScoped<IStoreVoucherService, StoreVoucherService>();
            services.AddScoped<ICustomerCartService, CustomerCartService>();
            services.AddScoped<IStoreOrderService, StoreOrderService>();
            services.AddScoped<IAdminOrderService, AdminOrderService>();
            services.AddScoped<IAdminCustomerService, AdminCustomerService>();
            services.AddScoped<IAdminUserService, AdminUserService>();
            services.AddScoped<IAdminPromotionService, AdminPromotionService>();
            services.AddScoped<IAdminInventoryTransactionService, AdminInventoryTransactionService>();
            services.AddScoped<FulfillmentInventoryOutService>();
            services.AddScoped<WarrantyProvisioningService>();
            services.AddScoped<IAdminFulfillmentService, AdminFulfillmentService>();
            services.AddScoped<IAdminQuoteService, AdminQuoteService>();
            services.AddScoped<IAdminContractService, AdminContractService>();
            services.AddScoped<IAdminInvoiceService, AdminInvoiceService>();
            services.AddScoped<IInvoiceAndOrderPaymentSyncService, InvoiceAndOrderPaymentSyncService>();
            services.AddScoped<IAdminPaymentService, AdminPaymentService>();
            services.AddScoped<IAdminTransferNotificationService, AdminTransferNotificationService>();
            services.AddScoped<IAdminReportService, AdminReportService>();
            services.AddScoped<IAdminStaffDirectoryService, AdminStaffDirectoryService>();
            services.AddScoped<IAdminWarehouseService, AdminWarehouseService>();
            services.AddScoped<IAdminWarrantyService, AdminWarrantyService>();
            services.AddScoped<AfterSalesQuantityService>();
            services.AddScoped<IAdminReturnService, AdminReturnService>();
            services.AddScoped<INotificationService, NotificationService>();
            services.AddScoped<INotificationInboxService, NotificationInboxService>();
            services.AddScoped<NotificationBusinessEmitter>();

            services.AddScoped<IDashboardRevenueService, DashboardRevenueService>();
            services.AddScoped<IDashboardArService, DashboardArService>();
            services.AddScoped<IDashboardSalesPipelineService, DashboardSalesPipelineService>();
            services.AddScoped<IDashboardInventoryService, DashboardInventoryService>();
            services.AddScoped<IDashboardOperationsService, DashboardOperationsService>();
            services.AddScoped<IDashboardSalesPerformanceService, DashboardSalesPerformanceService>();
        }
    }
}
