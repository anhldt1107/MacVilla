import { Routes, Route, useLocation, Outlet, Navigate } from 'react-router-dom'
import { AnnouncementBar } from './components/layout/AnnouncementBar'
import { Header } from './components/layout/Header'
import { Footer } from './components/layout/Footer'
import { HomePage } from './pages/HomePage'
import { ProductsPage } from './pages/ProductsPage'
import { ProductDetailPage } from './pages/ProductDetailPage'
import { ProductComparePage } from './pages/ProductComparePage'
import { CartPage } from './pages/CartPage'
import { CheckoutPage } from './pages/CheckoutPage'
import { CheckoutProcessPage } from './pages/CheckoutProcessPage'
import { OrderSuccessPage } from './pages/OrderSuccessPage'
import { OrderCancelPage } from './pages/OrderCancelPage'
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'
import { RegisterPartnerPage } from './pages/RegisterPartnerPage'
import { AccountPage } from './pages/AccountPage'
import { AccountOrdersPage } from './pages/AccountOrdersPage'
import { AccountWarrantyPage } from './pages/AccountWarrantyPage'
import { AccountReturnExchangePage } from './pages/AccountReturnExchangePage'
import { ReturnExchangeCreatePage } from './pages/ReturnExchangeCreatePage'
import { ReturnExchangeDetailPage } from './pages/ReturnExchangeDetailPage'
import { WarrantyTicketDetailPage } from './pages/WarrantyTicketDetailPage'
import { AccountAddressesPage } from './pages/AccountAddressesPage'
import { OrderDetailPage } from './pages/OrderDetailPage'
import { AccountPaymentsPage } from './pages/AccountPaymentsPage'
import { AccountPaymentDetailPage } from './pages/AccountPaymentDetailPage'
import { AccountInvoiceDetailPage } from './pages/AccountInvoiceDetailPage'
import { PartnerLayout } from './components/layout/PartnerLayout'
import { PartnerDashboardPage } from './pages/PartnerDashboardPage'
import { PartnerOrdersPage } from './pages/PartnerOrdersPage'
import { PartnerOrderDetailPage } from './pages/PartnerOrderDetailPage'
import { PartnerProjectsPage } from './pages/PartnerProjectsPage'
import { PartnerProjectCreatePage } from './pages/PartnerProjectCreatePage'
import { PartnerQuotationCreatePage } from './pages/PartnerQuotationCreatePage'
import { PartnerQuotationHistoryPage } from './pages/PartnerQuotationHistoryPage'
import { PartnerQuotationDetailPage } from './pages/PartnerQuotationDetailPage'
import { PartnerPaymentsDebtPage } from './pages/PartnerPaymentsDebtPage'
import { PartnerPaymentsHistoryPage } from './pages/PartnerPaymentsHistoryPage'
import { PartnerPaymentsInvoicesPage } from './pages/PartnerPaymentsInvoicesPage'
import { PartnerInvoiceDetailPage } from './pages/PartnerInvoiceDetailPage'
import { PartnerPaymentsPayPage } from './pages/PartnerPaymentsPayPage'
import { PartnerPaymentsUploadPage } from './pages/PartnerPaymentsUploadPage'
import { PartnerCompanyPage } from './pages/PartnerCompanyPage'
import { PartnerCompanyAddressesPage } from './pages/PartnerCompanyAddressesPage'
import { PartnerContractsPage } from './pages/PartnerContractsPage'
import { PartnerContractDetailPage } from './pages/PartnerContractDetailPage'
import { PartnerReturnExchangeListPage } from './pages/PartnerReturnExchangeListPage'
import { PartnerReturnExchangeDetailPage } from './pages/PartnerReturnExchangeDetailPage'
import { PartnerReturnExchangeCreatePage } from './pages/PartnerReturnExchangeCreatePage'
import { PartnerWarrantyListPage } from './pages/PartnerWarrantyListPage'
import { PartnerWarrantyDetailPage } from './pages/PartnerWarrantyDetailPage'
import { PartnerWarrantyCreatePage } from './pages/PartnerWarrantyCreatePage'
import { AuthProvider } from './contexts/AuthContext'
import { CartCountProvider } from './contexts/CartCountContext'
import { CompareProvider } from './contexts/CompareContext'
import { CompareBar } from './components/products/CompareBar'
import { CustomerAssistantFab } from './components/ai/CustomerAssistantFab'
import { RetailAccountLayout } from './components/account/RetailAccountLayout'
import './App.css'

export default function App() {
  const location = useLocation()
  const path = location.pathname

  if (path === '/login') return <AuthProvider><LoginPage /></AuthProvider>
  if (path === '/register') return <AuthProvider><RegisterPage /></AuthProvider>
  if (path === '/register/partner') return <AuthProvider><RegisterPartnerPage /></AuthProvider>
  if (path.startsWith('/partner')) {
    return (
      <AuthProvider>
        <CartCountProvider>
        <Routes>
          <Route path="/partner" element={<PartnerLayout />}>
            <Route index element={<PartnerDashboardPage />} />
            <Route path="dashboard" element={<PartnerDashboardPage />} />
            <Route path="orders" element={<PartnerOrdersPage />} />
            <Route path="orders/:orderCode" element={<PartnerOrderDetailPage />} />
            <Route path="projects" element={<PartnerProjectsPage />} />
            <Route path="projects/create" element={<PartnerProjectCreatePage />} />
            <Route path="quotation/create" element={<PartnerQuotationCreatePage />} />
            <Route path="quotation/history" element={<PartnerQuotationHistoryPage />} />
            <Route path="quotation/:quotationId" element={<PartnerQuotationDetailPage />} />
            <Route path="contracts" element={<PartnerContractsPage />} />
            <Route path="contracts/:contractNumber" element={<PartnerContractDetailPage />} />
            <Route
              path="after-sales"
              element={<Navigate to="/partner/after-sales/returns" replace />}
            />
            <Route path="after-sales/returns/create" element={<PartnerReturnExchangeCreatePage />} />
            <Route
              path="after-sales/returns/:ticketNumber"
              element={<PartnerReturnExchangeDetailPage />}
            />
            <Route path="after-sales/returns" element={<PartnerReturnExchangeListPage />} />
            <Route path="after-sales/warranty/create" element={<PartnerWarrantyCreatePage />} />
            <Route
              path="after-sales/warranty/:ticketNumber"
              element={<PartnerWarrantyDetailPage />}
            />
            <Route path="after-sales/warranty" element={<PartnerWarrantyListPage />} />
            <Route path="payments" element={<Navigate to="/partner/payments/debt" replace />} />
            <Route path="payments/debt" element={<PartnerPaymentsDebtPage />} />
            <Route path="payments/history" element={<PartnerPaymentsHistoryPage />} />
            <Route path="payments/invoices/:invoiceNumber" element={<PartnerInvoiceDetailPage />} />
            <Route path="payments/invoices" element={<PartnerPaymentsInvoicesPage />} />
            <Route path="payments/pay" element={<PartnerPaymentsPayPage />} />
            <Route path="payments/upload" element={<PartnerPaymentsUploadPage />} />
            <Route path="company/addresses" element={<PartnerCompanyAddressesPage />} />
            <Route path="company" element={<PartnerCompanyPage />} />
          </Route>
        </Routes>
        </CartCountProvider>
      </AuthProvider>
    )
  }

  return (
    <AuthProvider>
    <CartCountProvider>
    <CompareProvider>
    <div className="min-h-screen bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 flex flex-col">
      <AnnouncementBar />
      <Header />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/compare" element={<ProductComparePage />} />
        <Route path="/products/:id" element={<ProductDetailPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/checkout" element={<Outlet />}>
          <Route index element={<CheckoutPage />} />
          <Route path="process" element={<CheckoutProcessPage />} />
          <Route path="success" element={<OrderSuccessPage />} />
          <Route path="cancel" element={<OrderCancelPage />} />
        </Route>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/register/partner" element={<RegisterPartnerPage />} />
        <Route path="/account" element={<RetailAccountLayout />}>
          <Route index element={<AccountPage />} />
          <Route path="addresses" element={<AccountAddressesPage />} />
          <Route path="orders" element={<AccountOrdersPage />} />
          <Route path="orders/:orderCode" element={<OrderDetailPage />} />
          <Route path="payments" element={<AccountPaymentsPage />} />
          <Route path="payments/:id" element={<AccountPaymentDetailPage />} />
          <Route path="invoices/:invoiceNumber" element={<AccountInvoiceDetailPage />} />
          <Route path="warranty" element={<AccountWarrantyPage />} />
          <Route path="warranty/:ticketNumber" element={<WarrantyTicketDetailPage />} />
          <Route path="returns" element={<AccountReturnExchangePage />} />
          <Route path="returns/create" element={<ReturnExchangeCreatePage />} />
          <Route path="returns/:ticketNumber" element={<ReturnExchangeDetailPage />} />
        </Route>
      </Routes>
      <Footer />
      <CompareBar />
      <CustomerAssistantFab namespace="b2c" />
    </div>
    </CompareProvider>
    </CartCountProvider>
    </AuthProvider>
  )
}
