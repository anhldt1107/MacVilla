import { useParams } from "react-router-dom";
import { useStaffShellPaths } from "@/hooks/useStaffShellPaths";
import { CustomerProfileDetailView } from "@/components/customers/CustomerProfileDetailView";

export function AdminCustomerDetailPage() {
  const { id } = useParams();
  const paths = useStaffShellPaths();
  return (
    <CustomerProfileDetailView
      id={id ?? ""}
      dashboardPath={paths.root}
      customersListPath={paths.customersList}
      orderDetailUrl={(orderId) => `${paths.ordersList}/${orderId}`}
      invoiceDetailUrl={(invoiceId) => `${paths.invoicesList}/${invoiceId}`}
    />
  );
}
