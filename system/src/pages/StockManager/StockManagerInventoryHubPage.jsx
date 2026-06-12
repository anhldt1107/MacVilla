import { Navigate, useLocation, useSearchParams } from "react-router-dom";
import { AdminWarehouseInventoryPage } from "@/pages/Admin/AdminWarehouseInventoryPage";
import { ManagerInventoryPage } from "@/pages/Manager/ManagerInventoryPage";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const TX = "/stock-manager/inventory/transactions";
const INV = "/stock-manager/inventory";

/**
 * Stock Manager — một màn tồn kho: tổng quan / danh sách (W1–W3); cập nhật SKU mở popup (query productId + variantId, ví dụ từ Chi tiết).
 */
export function StockManagerInventoryHubPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const productId = searchParams.get("productId")?.trim() ?? "";
  const variantId = searchParams.get("variantId")?.trim() ?? "";
  const skuDialogOpen = Boolean(productId && variantId);

  const closeSkuDialog = () => {
    const next = new URLSearchParams(searchParams);
    next.delete("productId");
    next.delete("variantId");
    setSearchParams(next, { replace: true });
  };

  return (
    <div className="space-y-6">
      <AdminWarehouseInventoryPage variantDetailLinkMode="stock-manager" stockMovementsTo={TX} />

      <Dialog open={skuDialogOpen} onOpenChange={(open) => !open && closeSkuDialog()}>
        <DialogContent className="max-h-[90vh] max-w-3xl gap-0 overflow-y-auto p-0 sm:max-w-3xl">
          <div className="border-b border-slate-100 px-6 pb-4 pt-6 dark:border-slate-800">
            <DialogHeader>
              <DialogTitle>Cập nhật tồn theo biến thể (SKU)</DialogTitle>
              <DialogDescription>Cập nhật số lượng tồn và ngưỡng đặt hàng lại cho biến thể đã chọn.</DialogDescription>
            </DialogHeader>
          </div>
          <div className="px-6 pb-6 pt-4">
            {skuDialogOpen ? (
              <ManagerInventoryPage
                key={`${productId}-${variantId}`}
                stockMovementsBase={TX}
                variantPickerIdPrefix="stock-manager-inventory-sku-dialog"
                skuFormOnly
                initialProductId={productId}
                initialVariantId={variantId}
              />
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/** Giữ query (productId / variantId) khi đổi URL cũ `/inventory/sku-lookup`. */
export function StockManagerInventorySkuLookupRedirect() {
  const { search } = useLocation();
  return <Navigate to={{ pathname: INV, search }} replace />;
}
