import { CustomersListPage } from "@/pages/customers/CustomersListPage";

export function ManagerCustomersPage() {
  return (
    <CustomersListPage customersBase="/manager/sales/customers" formIdPrefix="manager-customer" />
  );
}
