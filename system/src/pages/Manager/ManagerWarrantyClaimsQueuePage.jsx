import { WarrantyClaimsQueueShared } from "@/pages/warranty/WarrantyClaimsQueueShared";

export function ManagerWarrantyClaimsQueuePage() {
  return (
    <WarrantyClaimsQueueShared
      warrantyBase="/manager/after-sales/warranty"
      salesOrderBase="/manager/sales/orders"
      salesCustomerBase="/manager/sales/customers"
    />
  );
}
