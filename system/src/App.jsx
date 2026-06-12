import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { RequireAuth } from "./components/auth/RequireAuth";
import { LoginPage } from "./pages/Login/LoginPage";
import { SalerLayout } from "./layouts/SalerLayout/SalerLayout";
import { ManagerLayout } from "./layouts/ManagerLayout/ManagerLayout";
import { StockManagerLayout } from "./layouts/StockManagerLayout/StockManagerLayout";
import { WorkerLayout } from "./layouts/WorkerLayout/WorkerLayout";
import { SalerDashboardPage } from "./pages/Saler/SalerDashboardPage";
import { SalerPlaceholderPage } from "./pages/Saler/SalerPlaceholderPage";
import { SalerWarehouseLookupPage } from "./pages/Saler/SalerWarehouseLookupPage";
import { SalerRevenuePage } from "./pages/Saler/SalerRevenuePage";
import { SalerProductsPage } from "./pages/Saler/SalerProductsPage";
import { SalerProductDetailPage } from "./pages/Saler/SalerProductDetailPage";
import { ManagerQuotationsPendingPage } from "./pages/Manager/ManagerQuotationsPendingPage";
import { ManagerQuotationsPage } from "./pages/Manager/ManagerQuotationsPage";
import { ManagerQuoteDetailPage } from "./pages/Manager/ManagerQuoteDetailPage";
import { ManagerOrdersPage } from "./pages/Manager/ManagerOrdersPage";
import { ManagerOrderDetailPage } from "./pages/Manager/ManagerOrderDetailPage";
import { ManagerCustomersPage } from "./pages/Manager/ManagerCustomersPage";
import { ManagerCustomerDetailPage } from "./pages/Manager/ManagerCustomerDetailPage";
import { ManagerDashboardHome } from "./pages/Manager/ManagerDashboardHome";
import { ManagerContractsPage } from "./pages/Manager/ManagerContractsPage";
import { ManagerContractDetailPage } from "./pages/Manager/ManagerContractDetailPage";
import { ManagerFulfillmentsPage } from "./pages/Manager/ManagerFulfillmentsPage";
import { ManagerFulfillmentDetailPage } from "./pages/Manager/ManagerFulfillmentDetailPage";
import { ManagerInventoryPage } from "./pages/Manager/ManagerInventoryPage";
import { ManagerInventoryTransactionsPage } from "./pages/Manager/ManagerInventoryTransactionsPage";
import { ManagerReturnsPage } from "./pages/Manager/ManagerReturnsPage";
import { ManagerReturnsPendingPage } from "./pages/Manager/ManagerReturnsPendingPage";
import { ManagerReturnDetailPage } from "./pages/Manager/ManagerReturnDetailPage";
import { ManagerWarrantyTicketsPage } from "./pages/Manager/ManagerWarrantyTicketsPage";
import { ManagerWarrantyPendingPage } from "./pages/Manager/ManagerWarrantyPendingPage";
import { ManagerWarrantyTicketDetailPage } from "./pages/Manager/ManagerWarrantyTicketDetailPage";
import { ManagerWarrantyClaimDetailPage } from "./pages/Manager/ManagerWarrantyClaimDetailPage";
import { ManagerWarrantyClaimsQueuePage } from "./pages/Manager/ManagerWarrantyClaimsQueuePage";
import { AdminLayout } from "./layouts/AdminLayout/Layout";
import { AdminDashboardHome } from "./pages/Admin/AdminDashboardHome";
import { AdminModulePlaceholder } from "./pages/Admin/AdminModulePlaceholder";
import { AdminOrdersPage } from "./pages/Admin/AdminOrdersPage";
import { AdminOrderDetailPage } from "./pages/Admin/AdminOrderDetailPage";
import { AdminCustomersPage } from "./pages/Admin/AdminCustomersPage";
import { AdminCustomerDetailPage } from "./pages/Admin/AdminCustomerDetailPage";
import { AdminEmployeesPage } from "./pages/Admin/AdminEmployeesPage";
import { AdminCampaignsPage } from "./pages/Admin/AdminCampaignsPage";
import { AdminCampaignDetailPage } from "./pages/Admin/AdminCampaignDetailPage";
import { AdminVouchersPage } from "./pages/Admin/AdminVouchersPage";
import { AdminFulfillmentsPage } from "./pages/Admin/AdminFulfillmentsPage";
import { AdminFulfillmentDetailPage } from "./pages/Admin/AdminFulfillmentDetailPage";
import { AdminInvoicesPage } from "./pages/Admin/AdminInvoicesPage";
import { AdminInvoiceDetailPage } from "./pages/Admin/AdminInvoiceDetailPage";
import { AdminPaymentsPage } from "./pages/Admin/AdminPaymentsPage";
import { AdminPaymentDetailPage } from "./pages/Admin/AdminPaymentDetailPage";
import { AdminTransferNotificationsPage } from "./pages/Admin/AdminTransferNotificationsPage";
import { AdminTransferNotificationDetailPage } from "./pages/Admin/AdminTransferNotificationDetailPage";
import { AdminWarrantyTicketsPage } from "./pages/Admin/AdminWarrantyTicketsPage";
import { AdminWarrantyTicketDetailPage } from "./pages/Admin/AdminWarrantyTicketDetailPage";
import { AdminWarrantyClaimDetailPage } from "./pages/Admin/AdminWarrantyClaimDetailPage";
import { AdminWarrantyClaimsQueuePage } from "./pages/Admin/AdminWarrantyClaimsQueuePage";
import { AdminReturnsPage } from "./pages/Admin/AdminReturnsPage";
import { AdminReturnDetailPage } from "./pages/Admin/AdminReturnDetailPage";
import { AdminInventoryTransactionsPage } from "./pages/Admin/AdminInventoryTransactionsPage";
import { AdminProductCategoriesPage } from "./pages/Admin/AdminProductCategoriesPage";
import { AdminProductsPage } from "./pages/Admin/AdminProductsPage";
import { AdminProductDetailPage } from "./pages/Admin/AdminProductDetailPage";
import { AdminVariantsPage } from "./pages/Admin/AdminVariantsPage";
import { AdminVariantDetailPage } from "./pages/Admin/AdminVariantDetailPage";
import { AdminWarehouseInventoryPage } from "./pages/Admin/AdminWarehouseInventoryPage";
import { AdminQuotesPage } from "./pages/Admin/AdminQuotesPage";
import { AdminQuoteDetailPage } from "./pages/Admin/AdminQuoteDetailPage";
import { AdminQuoteCreatePage } from "./pages/Admin/AdminQuoteCreatePage";
import { AdminOrderCreatePage } from "./pages/Admin/AdminOrderCreatePage";
import { AdminContractsPage } from "./pages/Admin/AdminContractsPage";
import { AdminContractDetailPage } from "./pages/Admin/AdminContractDetailPage";
import { StockManagerFulfillmentsPage } from "./pages/StockManager/StockManagerFulfillmentsPage";
import { StockManagerFulfillmentsCreatePage } from "./pages/StockManager/StockManagerFulfillmentsCreatePage";
import { StockManagerFulfillmentDetailPage } from "./pages/StockManager/StockManagerFulfillmentDetailPage";
import { StockManagerInventoryTransactionsPage } from "./pages/StockManager/StockManagerInventoryTransactionsPage";
import {
  StockManagerInventoryHubPage,
  StockManagerInventorySkuLookupRedirect,
} from "./pages/StockManager/StockManagerInventoryHubPage";
import { StockManagerOrdersPage } from "./pages/StockManager/StockManagerOrdersPage";
import { StockManagerOrderDetailPage } from "./pages/StockManager/StockManagerOrderDetailPage";
import { StockManagerReturnsPage } from "./pages/StockManager/StockManagerReturnsPage";
import { StockManagerReturnDetailPage } from "./pages/StockManager/StockManagerReturnDetailPage";
import { WorkerHomePage } from "./pages/Worker/WorkerHomePage";
import { WorkerFulfillmentsPage } from "./pages/Worker/WorkerFulfillmentsPage";
import { WorkerFulfillmentDetailPage } from "./pages/Worker/WorkerFulfillmentDetailPage";
import { StockManagerHomePage } from "./pages/StockManager/StockManagerHomePage";
import { WorkerSkuLookupPage } from "./pages/Worker/WorkerSkuLookupPage";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route
            path="/saler"
            element={
              <RequireAuth>
                <SalerLayout />
              </RequireAuth>
            }
          >
            <Route index element={<SalerDashboardPage />} />
            <Route path="quotations/queue" element={<AdminQuotesPage />} />
            <Route path="quotations/mine" element={<AdminQuotesPage />} />
            <Route path="quotations/create" element={<AdminQuoteCreatePage />} />
            <Route path="quotations" element={<AdminQuotesPage />} />
            <Route path="quotations/:id" element={<AdminQuoteDetailPage />} />
            <Route path="contracts" element={<AdminContractsPage />} />
            <Route path="contracts/:id" element={<AdminContractDetailPage />} />
            <Route path="orders/create" element={<AdminOrderCreatePage />} />
            <Route path="orders" element={<AdminOrdersPage />} />
            <Route path="orders/:id" element={<AdminOrderDetailPage />} />
            <Route path="customers" element={<AdminCustomersPage />} />
            <Route path="customers/:id" element={<AdminCustomerDetailPage />} />
            <Route path="invoices" element={<AdminInvoicesPage />} />
            <Route path="invoices/:id" element={<AdminInvoiceDetailPage />} />
            <Route path="payments" element={<AdminPaymentsPage />} />
            <Route path="payments/:id" element={<AdminPaymentDetailPage />} />
            <Route path="transfer-notifications" element={<AdminTransferNotificationsPage />} />
            <Route path="transfer-notifications/:id" element={<AdminTransferNotificationDetailPage />} />
            <Route path="warranty/claims/:claimId" element={<AdminWarrantyClaimDetailPage />} />
            <Route path="warranty/:ticketId" element={<AdminWarrantyTicketDetailPage />} />
            <Route path="warranty" element={<AdminWarrantyTicketsPage />} />
            <Route path="returns/:id" element={<AdminReturnDetailPage />} />
            <Route path="returns" element={<AdminReturnsPage />} />
            <Route path="revenue" element={<SalerRevenuePage />} />
            <Route path="products" element={<SalerProductsPage />} />
            <Route path="products/:id" element={<SalerProductDetailPage />} />
            <Route path="warehouse" element={<SalerWarehouseLookupPage />} />
          </Route>
          <Route
            path="/manager"
            element={
              <RequireAuth>
                <ManagerLayout />
              </RequireAuth>
            }
          >
            <Route index element={<ManagerDashboardHome />} />
            <Route path="sales/quotations/pending" element={<ManagerQuotationsPendingPage />} />
            <Route path="sales/quotations/:id" element={<ManagerQuoteDetailPage />} />
            <Route path="sales/quotations" element={<ManagerQuotationsPage />} />
            <Route path="sales/contracts/:id" element={<ManagerContractDetailPage />} />
            <Route path="sales/contracts" element={<ManagerContractsPage />} />
            <Route path="sales/orders/:id" element={<ManagerOrderDetailPage />} />
            <Route path="sales/orders" element={<ManagerOrdersPage />} />
            <Route path="sales/customers/:id" element={<ManagerCustomerDetailPage />} />
            <Route path="sales/customers" element={<ManagerCustomersPage />} />
            <Route path="accounting/transfer-notifications/:id" element={<AdminTransferNotificationDetailPage />} />
            <Route path="accounting/transfer-notifications" element={<AdminTransferNotificationsPage />} />
            <Route path="accounting/invoices/:id" element={<AdminInvoiceDetailPage />} />
            <Route path="accounting/invoices" element={<AdminInvoicesPage />} />
            <Route path="accounting/payments/:id" element={<AdminPaymentDetailPage />} />
            <Route path="accounting/payments" element={<AdminPaymentsPage />} />
            <Route path="logistics/fulfillments" element={<ManagerFulfillmentsPage />} />
            <Route path="logistics/fulfillments/:id" element={<ManagerFulfillmentDetailPage />} />
            <Route path="logistics/inventory" element={<ManagerInventoryPage />} />
            <Route path="logistics/stock-movements" element={<ManagerInventoryTransactionsPage />} />
            <Route path="after-sales/returns/pending" element={<ManagerReturnsPendingPage />} />
            <Route path="after-sales/returns/:id" element={<ManagerReturnDetailPage />} />
            <Route path="after-sales/returns" element={<ManagerReturnsPage />} />
            <Route path="after-sales/warranty/claims-queue" element={<ManagerWarrantyClaimsQueuePage />} />
            <Route path="after-sales/warranty/claims/:claimId" element={<ManagerWarrantyClaimDetailPage />} />
            <Route path="after-sales/warranty/pending" element={<ManagerWarrantyPendingPage />} />
            <Route path="after-sales/warranty/:ticketId" element={<ManagerWarrantyTicketDetailPage />} />
            <Route path="after-sales/warranty" element={<ManagerWarrantyTicketsPage />} />
          </Route>
          <Route
            path="/stock-manager"
            element={
              <RequireAuth>
                <StockManagerLayout />
              </RequireAuth>
            }
          >
            <Route index element={<StockManagerHomePage />} />
            <Route path="fulfillments/create" element={<StockManagerFulfillmentsCreatePage />} />
            <Route path="fulfillments/:id" element={<StockManagerFulfillmentDetailPage />} />
            <Route path="fulfillments" element={<StockManagerFulfillmentsPage />} />
            <Route path="inventory/transactions" element={<StockManagerInventoryTransactionsPage />} />
            <Route path="inventory/adjustments" element={<Navigate to="/stock-manager/inventory" replace />} />
            <Route path="inventory/sku-lookup" element={<StockManagerInventorySkuLookupRedirect />} />
            <Route path="inventory/warehouse" element={<Navigate to="/stock-manager/inventory" replace />} />
            <Route path="inventory" element={<StockManagerInventoryHubPage />} />
            <Route path="orders/:id" element={<StockManagerOrderDetailPage />} />
            <Route path="orders" element={<StockManagerOrdersPage />} />
            <Route path="returns" element={<StockManagerReturnsPage />} />
            <Route path="returns/:id" element={<StockManagerReturnDetailPage />} />
          </Route>
          <Route
            path="/worker"
            element={
              <RequireAuth>
                <WorkerLayout />
              </RequireAuth>
            }
          >
            <Route index element={<WorkerHomePage />} />
            <Route path="fulfillments" element={<WorkerFulfillmentsPage />} />
            <Route path="fulfillments/:id" element={<WorkerFulfillmentDetailPage />} />
            <Route path="inventory/sku-lookup" element={<WorkerSkuLookupPage />} />
          </Route>
          <Route
            path="/admin"
            element={
              <RequireAuth>
                <AdminLayout />
              </RequireAuth>
            }
          >
            <Route index element={<AdminDashboardHome />} />
            <Route path="sales/orders" element={<AdminOrdersPage />} />
            <Route path="sales/orders/:id" element={<AdminOrderDetailPage />} />
            <Route path="sales/customers/:id" element={<AdminCustomerDetailPage />} />
            <Route path="sales/customers" element={<AdminCustomersPage />} />
            <Route path="sales/quotations-b2b/create" element={<AdminQuoteCreatePage />} />
            <Route path="sales/quotations-b2b/:id" element={<AdminQuoteDetailPage />} />
            <Route path="sales/quotations-b2b" element={<AdminQuotesPage />} />
            <Route path="sales/contracts/:id" element={<AdminContractDetailPage />} />
            <Route path="sales/contracts" element={<AdminContractsPage />} />
            <Route path="products/:productId/variants/:variantId" element={<AdminVariantDetailPage />} />
            <Route path="products/:id" element={<AdminProductDetailPage />} />
            <Route path="products" element={<AdminProductsPage />} />
            <Route path="product-types" element={<Navigate to="/admin/product-categories" replace />} />
            <Route path="product-categories" element={<AdminProductCategoriesPage />} />
            <Route path="uploads" element={<AdminModulePlaceholder title="Upload media" />} />
            <Route path="variants" element={<AdminVariantsPage />} />
            <Route path="product-units" element={<Navigate to="/admin/variants" replace />} />
            <Route path="logistics/inventory" element={<AdminWarehouseInventoryPage />} />
            <Route path="logistics/stock-movements" element={<AdminInventoryTransactionsPage />} />
            <Route path="logistics/fulfillments" element={<AdminFulfillmentsPage />} />
            <Route path="logistics/fulfillments/:id" element={<AdminFulfillmentDetailPage />} />
            <Route path="accounting/invoices" element={<AdminInvoicesPage />} />
            <Route path="accounting/invoices/:id" element={<AdminInvoiceDetailPage />} />
            <Route path="accounting/payments" element={<AdminPaymentsPage />} />
            <Route path="accounting/payments/:id" element={<AdminPaymentDetailPage />} />
            <Route path="accounting/transfer-notifications/:id" element={<AdminTransferNotificationDetailPage />} />
            <Route path="accounting/transfer-notifications" element={<AdminTransferNotificationsPage />} />
            <Route path="marketing/campaigns/:id" element={<AdminCampaignDetailPage />} />
            <Route path="marketing/campaigns" element={<AdminCampaignsPage />} />
            <Route path="marketing/vouchers" element={<AdminVouchersPage />} />
            <Route path="after-sales/warranty/claims-queue" element={<AdminWarrantyClaimsQueuePage />} />
            <Route path="after-sales/warranty/claims/:claimId" element={<AdminWarrantyClaimDetailPage />} />
            <Route path="after-sales/warranty/:ticketId" element={<AdminWarrantyTicketDetailPage />} />
            <Route path="after-sales/warranty" element={<AdminWarrantyTicketsPage />} />
            <Route path="after-sales/returns/:id" element={<AdminReturnDetailPage />} />
            <Route path="after-sales/returns" element={<AdminReturnsPage />} />
            <Route path="hr/employees" element={<AdminEmployeesPage />} />
            <Route path="system/settings" element={<Navigate to="/admin" replace />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
