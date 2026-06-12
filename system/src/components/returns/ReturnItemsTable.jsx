import { ProductLineCell } from "@/components/catalog/ProductLineCell";
import { extractReturnSideFields } from "@/lib/productLineFields";
import { labelAdminReturnInventoryAction } from "@/services/admin/adminReturnsApi";

/** @param {unknown} row */
function lineItemId(row) {
  const o = row && typeof row === "object" ? /** @type {Record<string, unknown>} */ (row) : {};
  const id = o.returnItemId ?? o.ReturnItemId ?? o.id ?? o.Id;
  return id != null && Number.isFinite(Number(id)) ? Number(id) : null;
}

/**
 * @param {{ items: unknown[]; showOrderItemId?: boolean }} props
 */
export function ReturnItemsTable({ items, showOrderItemId = false }) {
  if (!items.length) {
    return <p className="px-6 py-8 text-center text-sm text-slate-500">Không có dòng.</p>;
  }

  const showInventoryAction = items.some((row) => {
    const o = row && typeof row === "object" ? /** @type {Record<string, unknown>} */ (row) : {};
    const act = o.inventoryAction ?? o.InventoryAction;
    return act != null && String(act).trim() !== "";
  });

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50/90 text-[11px] font-semibold uppercase text-slate-500 dark:border-slate-800 dark:bg-slate-900/50">
            {showOrderItemId ? <th className="px-4 py-2 pl-6">Dòng đơn</th> : null}
            <th className="px-4 py-2 pl-6">Hàng trả</th>
            <th className="px-4 py-2">Đổi sang</th>
            {showInventoryAction ? <th className="px-4 py-2">Xử lý kho</th> : null}
            <th className="px-4 py-2 pr-6 text-right">SL</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
          {items.map((row, idx) => {
            const o = row && typeof row === "object" ? /** @type {Record<string, unknown>} */ (row) : {};
            const rid = lineItemId(row);
            const returned = extractReturnSideFields(o, "returned");
            const exchanged = extractReturnSideFields(o, "exchanged");
            const qty = o.quantity ?? o.Quantity;
            const inventoryAction = o.inventoryAction ?? o.InventoryAction;
            const hasExchange =
              exchanged.productName ||
              exchanged.variantName ||
              exchanged.sku ||
              exchanged.variantId != null;

            return (
              <tr key={rid ?? idx}>
                {showOrderItemId ? (
                  <td className="px-4 py-2.5 pl-6 font-mono text-xs text-slate-500">
                    {o.orderItemId ?? o.OrderItemId ?? "—"}
                  </td>
                ) : null}
                <td className="px-4 py-2.5 pl-6">
                  <ProductLineCell {...returned} size="sm" />
                </td>
                <td className="px-4 py-2.5">
                  {hasExchange ? (
                    <ProductLineCell {...exchanged} size="sm" />
                  ) : (
                    <span className="text-slate-400">—</span>
                  )}
                </td>
                {showInventoryAction ? (
                  <td className="px-4 py-2.5 text-slate-700 dark:text-slate-300">
                    {inventoryAction != null && String(inventoryAction).trim()
                      ? labelAdminReturnInventoryAction(String(inventoryAction), [])
                      : "—"}
                  </td>
                ) : null}
                <td className="px-4 py-2.5 pr-6 text-right tabular-nums">{qty != null ? String(qty) : "—"}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/**
 * @param {{ row: unknown; quantity?: unknown }} props
 */
export function ReturnCompleteLineSummary({ row, quantity }) {
  const o = row && typeof row === "object" ? /** @type {Record<string, unknown>} */ (row) : {};
  const returned = extractReturnSideFields(o, "returned");
  const exchanged = extractReturnSideFields(o, "exchanged");
  const hasExchange =
    exchanged.productName ||
    exchanged.variantName ||
    exchanged.sku ||
    exchanged.variantId != null;

  return (
    <div className="space-y-2">
      <ProductLineCell {...returned} size="sm" />
      {hasExchange ? (
        <div className="rounded-md border border-dashed border-slate-200 px-2 py-1.5 dark:border-slate-700">
          <p className="text-[10px] font-semibold uppercase text-slate-500">Đổi sang</p>
          <ProductLineCell {...exchanged} size="sm" className="mt-1" />
        </div>
      ) : null}
      {quantity != null ? (
        <p className="text-xs text-slate-500">
          Số lượng: <span className="font-semibold tabular-nums text-slate-700 dark:text-slate-300">{String(quantity)}</span>
        </p>
      ) : null}
    </div>
  );
}
