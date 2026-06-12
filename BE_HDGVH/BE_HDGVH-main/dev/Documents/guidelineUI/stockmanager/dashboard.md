# Stock Manager — Dashboard kho (`/api/admin/warehouse`)

Auth: **WarehouseStaff** (StockManager / Worker / Manager / Admin).

## API


| Method | Path                                              | Mô tả                  |
| ------ | ------------------------------------------------- | ---------------------- |
| GET    | `/api/admin/warehouse/overview?lowStockThreshold` | Chỉ số tổng quan kho   |
| GET    | `/api/admin/warehouse/low-stock?threshold&take`   | Danh sách SKU tồn thấp |


---

### `GET /overview`


| Param               | Mặc định | Ghi chú                  |
| ------------------- | -------- | ------------------------ |
| `lowStockThreshold` | 10       | Dùng cho `lowStockCount` |


Response `data` — `AdminWarehouseOverviewDto`:


| Field                                                                          | Kiểu   | Ghi chú                                                                   |
| ------------------------------------------------------------------------------ | ------ | ------------------------------------------------------------------------- |
| `fulfillmentPendingCount`                                                      | number | Phiếu `Pending`                                                           |
| `fulfillmentPickingCount`                                                      | number | Phiếu `Picking`                                                           |
| `fulfillmentPackedCount`                                                       | number | Phiếu `Packed`                                                            |
| `fulfillmentShippedTodayCount`                                                 | number | Phiếu chuyển `Shipped` trong hôm nay (UTC)                                |
| `fulfillmentTotalActiveCount`                                                  | number | Pending + Picking + Packed                                                |
| `lowStockCount`                                                                | number | SKU có `quantityAvailable <= lowStockThreshold`                           |
| `outOfStockCount`                                                              | number | SKU `quantityAvailable <= 0`                                              |
| `lowStockThreshold`                                                            | number | Echo lại tham số đã dùng                                                  |
| `inventoryTransactionsTodayCount`                                              | number | Tổng giao dịch kho hôm nay                                                |
| `inventoryInTodayCount`, `inventoryOutTodayCount`, `inventoryAdjustTodayCount` | number | Phân loại nhanh                                                           |
| `returnsAwaitingCompleteCount`                                                 | number | Phiếu đổi/trả `Approved` / `Processing` / `ItemsReceived` (chờ kho xử lý) |
| `warrantyClaimsActiveCount`                                                    | number | Claim BH chưa Completed/Rejected/Cancelled                                |


---

### `GET /low-stock`

Param và response giống [admin/bao-cao.md](../admin/bao-cao.md#get-low-stock) — mirror cho kho. `data[]`:


| Field                                                     | Kiểu   |
| --------------------------------------------------------- | ------ |
| `variantId`, `productId`                                  | number |
| `sku`, `variantName`, `productName`                       | string |
| `warehouseLocation`                                       | string |
| `quantityOnHand`, `quantityReserved`, `quantityAvailable` | number |


---

## Luồng UI

### A) Trang chủ Stock Manager

1. Header card KPI: `fulfillmentPendingCount`, `fulfillmentTotalActiveCount`, `lowStockCount`, `returnsAwaitingCompleteCount`.
2. Section "Tồn thấp": gọi `/low-stock?threshold=10` → list 10–20 SKU đầu tiên có nút **"Nhập kho"** dẫn sang [ton-kho-va-giao-dich.md](./ton-kho-va-giao-dich.md).
3. Section "Phiếu xuất chờ xử lý": link sang [fulfillment.md](./fulfillment.md) với filter mặc định `status=Pending`.
4. Section "Đổi/trả chờ hoàn tất": link sang [doi-tra-hoan-tat.md](./doi-tra-hoan-tat.md).

### B) Theo dõi hôm nay

`inventoryInTodayCount`, `inventoryOutTodayCount`, `inventoryAdjustTodayCount`, `fulfillmentShippedTodayCount` → hiện chip / sparkline.

## UX

- Cache 30s, có nút **Refresh** thủ công.
- Click các counter → điều hướng sang list tương ứng với filter prefilled.
- Không hiển thị KPI doanh thu / công nợ (thuộc Manager).

