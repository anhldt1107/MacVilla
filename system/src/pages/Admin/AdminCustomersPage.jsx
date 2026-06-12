import { useStaffShellPaths } from "@/hooks/useStaffShellPaths";
import { CustomersListPage } from "@/pages/customers/CustomersListPage";

export function AdminCustomersPage() {
  const paths = useStaffShellPaths();
  return <CustomersListPage customersBase={paths.customersList} formIdPrefix="admin-customer" />;
}
