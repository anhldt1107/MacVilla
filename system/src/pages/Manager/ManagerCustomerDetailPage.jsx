import { useParams } from "react-router-dom";
import { CustomerProfileDetailView } from "@/components/customers/CustomerProfileDetailView";

export function ManagerCustomerDetailPage() {
  const { id } = useParams();
  return (
    <CustomerProfileDetailView
      id={id ?? ""}
      dashboardPath="/manager"
      customersListPath="/manager/sales/customers"
      orderDetailUrl={(orderId) => `/manager/sales/orders/${orderId}`}
      invoiceDetailUrl={(invoiceId) => `/manager/accounting/invoices/${invoiceId}`}
    />
  );
}
