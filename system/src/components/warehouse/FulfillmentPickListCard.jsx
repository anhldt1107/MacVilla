import { Package, Truck } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { sumFulfillmentLineQuantity } from "@/lib/fulfillmentOrderUtils";

function formatMoneyVnd(n) {
  if (n == null || Number.isNaN(Number(n))) return "—";
  return `${Number(n).toLocaleString("vi-VN")} đ`;
}

/**
 * Danh sách SKU / số lượng cần lấy cho phiếu xuất.
 * @param {object} props
 * @param {import("@/lib/fulfillmentOrderUtils").FulfillmentOrderLineView[]} props.lines
 * @param {boolean} [props.workerMode] ẩn giá, nhấn SKU + SL
 * @param {string} [props.title]
 */
export function FulfillmentPickListCard({
  lines,
  workerMode = false,
  title = "Hàng cần lấy & gói",
}) {
  const totalQty = sumFulfillmentLineQuantity(lines);

  return (
    <Card className="overflow-hidden border-teal-200/80 shadow-sm dark:border-teal-900/50">
      <CardHeader className="border-b border-teal-100/80 bg-teal-50/60 dark:border-teal-900/40 dark:bg-teal-950/25">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-500/15 text-teal-800 dark:text-teal-300">
            <Package className="h-4 w-4" strokeWidth={2} aria-hidden />
          </span>
          <div>
            <CardTitle className="text-base font-semibold tracking-tight">{title}</CardTitle>
            <CardDescription className="text-xs">
              {lines.length} mặt hàng · tổng {totalQty.toLocaleString("vi-VN")} sản phẩm
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {lines.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-muted-foreground">Không có dòng hàng trong đơn.</p>
        ) : workerMode ? (
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {lines.map((line) => (
              <li key={line.id} className="flex gap-3 px-4 py-4 sm:px-5">
                <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-slate-200/80 bg-slate-100 dark:border-slate-700 dark:bg-slate-800">
                  {line.imageUrl ? (
                    <img src={line.imageUrl} alt="" className="h-full w-full object-cover" loading="lazy" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-slate-400">
                      <Package className="h-6 w-6 opacity-50" aria-hidden />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-slate-900 dark:text-slate-100">{line.productName}</p>
                  {line.variantName ? (
                    <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{line.variantName}</p>
                  ) : null}
                  <p className="mt-1.5 font-mono text-sm font-semibold text-teal-800 dark:text-teal-300">{line.sku}</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">SL</p>
                  <p className="text-2xl font-bold tabular-nums text-slate-900 dark:text-slate-50">
                    {line.quantity.toLocaleString("vi-VN")}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:text-slate-400">
                  <th className="px-5 py-3 pl-6">Sản phẩm / SKU</th>
                  {!workerMode ? <th className="px-5 py-3 text-right tabular-nums">Đơn giá</th> : null}
                  <th className="px-5 py-3 text-right tabular-nums">SL</th>
                  {!workerMode ? <th className="px-5 py-3 pr-6 text-right tabular-nums">Thành tiền</th> : null}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {lines.map((line) => (
                  <tr key={line.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-900/30">
                    <td className="px-5 py-4 pl-6 align-middle">
                      <div className="flex gap-3">
                        <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-slate-200/80 bg-slate-100 dark:border-slate-700 dark:bg-slate-800">
                          {line.imageUrl ? (
                            <img src={line.imageUrl} alt="" className="h-full w-full object-cover" loading="lazy" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-slate-400">
                              <Package className="h-5 w-5 opacity-50" aria-hidden />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-slate-900 dark:text-slate-100">{line.productName}</p>
                          {line.variantName ? (
                            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{line.variantName}</p>
                          ) : null}
                          <p className="mt-1 font-mono text-[11px] text-teal-800 dark:text-teal-300">{line.sku}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-right align-middle font-mono text-sm tabular-nums text-slate-700 dark:text-slate-300">
                      {formatMoneyVnd(line.priceSnapshot)}
                    </td>
                    <td className="px-5 py-4 text-right align-middle font-mono text-sm font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                      {line.quantity}
                    </td>
                    <td className="px-5 py-4 pr-6 text-right align-middle font-mono text-sm tabular-nums text-slate-800 dark:text-slate-200">
                      {formatMoneyVnd(line.subTotal)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * @param {object} props
 * @param {{ receiverName: string; receiverPhone: string; addressLine: string } | null} props.address
 */
export function FulfillmentShippingCard({ address }) {
  if (!address) return null;
  const hasContent =
    address.receiverName.trim() || address.receiverPhone.trim() || address.addressLine.trim();
  if (!hasContent) return null;

  return (
    <Card className="border-slate-200/80 shadow-sm dark:border-slate-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Truck className="h-4 w-4 text-slate-600" aria-hidden />
          Địa chỉ giao hàng
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1 text-sm">
        {address.receiverName.trim() ? (
          <p className="font-medium text-slate-900 dark:text-slate-100">{address.receiverName}</p>
        ) : null}
        {address.receiverPhone.trim() ? (
          <p className="text-slate-600 dark:text-slate-400">{address.receiverPhone}</p>
        ) : null}
        {address.addressLine.trim() ? (
          <p className="whitespace-pre-wrap text-slate-700 dark:text-slate-300">{address.addressLine}</p>
        ) : null}
      </CardContent>
    </Card>
  );
}
