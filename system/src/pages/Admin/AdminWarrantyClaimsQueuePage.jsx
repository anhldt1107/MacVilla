import { WarrantyClaimsQueueShared } from "@/pages/warranty/WarrantyClaimsQueueShared";

export function AdminWarrantyClaimsQueuePage() {
  return (
    <WarrantyClaimsQueueShared
      warrantyBase="/admin/after-sales/warranty"
      salesOrderBase="/admin/sales/orders"
      salesCustomerBase="/admin/sales/customers"
    />
  );
}
