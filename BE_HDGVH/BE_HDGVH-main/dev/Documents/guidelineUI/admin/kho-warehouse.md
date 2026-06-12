# Admin — Kho / Warehouse dashboard (`/api/admin/warehouse`)

Auth: **WarehouseStaff** (Admin, Manager, StockManager, Worker). Khác với `/api/admin/reports/`* (ManagerOrAdmin) — endpoint ở đây **mở cho cả tổ kho**.

**Tích hợp FE chi tiết** (tồn theo variant, `PUT reorder-policy`, công thức ngưỡng): [../../../luong-tich-hop/tich_hop_fe_ton_kho_va_reorder_point.md](../../../luong-tich-hop/tich_hop_fe_ton_kho_va_reorder_point.md).

## API


| Method | Path                                                                                                                |
| ------ | ------------------------------------------------------------------------------------------------------------------- |
| GET    | `/api/admin/warehouse/overview?lowStockThreshold`                                                                   |
| GET    | `/api/admin/warehouse/low-stock?threshold&take`                                                                     |
| GET    | `/api/admin/warehouse/inventory?page&pageSize&search&warehouseLocation&onlyOutOfStock&onlyBelowThreshold&threshold` |


**Biến thể / tồn & reorder policy** (cùng policy WarehouseStaff):


| Method | Path                                                                            |
| ------ | ------------------------------------------------------------------------------- |
| GET    | `/api/admin/products/{productId}/variants/{variantId}/inventory`                |
| PUT    | `/api/admin/products/{productId}/variants/{variantId}/inventory`                |
| POST   | `/api/admin/products/{productId}/variants/{variantId}/inventory`                |
| PUT    | `/api/admin/products/{productId}/variants/{variantId}/inventory/reorder-policy` |


### Response `GET /overview` (`AdminWarehouseOverviewDto`)


| Field                                                                          | Kiểu   |
| ------------------------------------------------------------------------------ | ------ |
| `fulfillmentPendingCount`, `fulfillmentPickingCount`, `fulfillmentPackedCount` | number |
| `fulfillmentShippedTodayCount`                                                 | number |
| `fulfillmentTotalActiveCount`                                                  | number |
| `lowStockCount`, `outOfStockCount`, `lowStockThreshold`                        | number |
| `inventoryTransactionsTodayCount`                                              | number |
| `inventoryInTodayCount`, `inventoryOutTodayCount`, `inventoryAdjustTodayCount` | number |
| `returnsAwaitingCompleteCount`                                                 | number |
| `warrantyClaimsActiveCount`                                                    | number |


`lowStockThreshold`: ngưỡng **fallback** từ query. `lowStockCount`: số SKU có `quantityAvailable <= (reorderPoint ?? lowStockThreshold)` (per-row `reorderPoint` từ DB).

### Response `GET /low-stock`

Giống `GET /api/admin/reports/low-stock`. Mỗi item gồm: `variantId`, `sku`, `variantName`, `productId`, `productName`, `warehouseLocation`, `quantityOnHand`, `quantityReserved`, `quantityAvailable`, `reorderPoint`, `safetyStock`, `effectiveLowStockThreshold`.

### Response `GET /inventory` (`PagedResultDto<AdminInventoryListItemDto>`)

`items[]`:


| Field                                                     | Kiểu    |
| --------------------------------------------------------- | ------- |
| `inventoryId`, `variantId`, `productId`                   | number  |
| `sku`, `variantName`, `productName`                       | string  |
| `warehouseLocation`                                       | string  |
| `quantityOnHand`, `quantityReserved`, `quantityAvailable` | number  |
| `reorderPoint`, `safetyStock`                             | number  |
| `effectiveLowStockThreshold`                              | number  |
| `isLowStock`                                              | boolean |


Filter `onlyBelowThreshold=true`: giữ các dòng có `quantityAvailable <= (reorderPoint ?? threshold)` (`threshold` = query).

## So sánh

- **Manager / Admin** nên ưu tiên `reports/`* cho KPI doanh thu.
- **Stock / Worker** dùng `warehouse/`* cho điều phối hằng ngày.
- Endpoint `reports/low-stock` và `warehouse/low-stock` trả **giống nhau** (service share), nhưng policy khác.

---

Tham chiếu chi tiết UX cho Stock Manager: [../stockmanager/dashboard.md](../stockmanager/dashboard.md), [../stockmanager/ton-kho-va-giao-dich.md](../stockmanager/ton-kho-va-giao-dich.md).