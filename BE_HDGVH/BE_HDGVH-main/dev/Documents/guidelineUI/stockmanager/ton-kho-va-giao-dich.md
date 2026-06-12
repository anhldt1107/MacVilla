# Stock Manager — Tồn kho & giao dịch

Auth: **WarehouseStaff**.

Field DTO chi tiết: [../admin/giao-dich-kho.md](../admin/giao-dich-kho.md), [../admin/bien-the-va-ton-kho.md](../admin/bien-the-va-ton-kho.md).

## API

### Tồn — list cắt ngang & theo SKU


| Method | Path                                                                                                                | Mô tả                            |
| ------ | ------------------------------------------------------------------------------------------------------------------- | -------------------------------- |
| GET    | `/api/admin/warehouse/inventory?page&pageSize&search&warehouseLocation&onlyOutOfStock&onlyBelowThreshold&threshold` | List toàn bộ `Inventory`         |
| GET    | `/api/admin/products/{productId}/variants/{variantId}/inventory`                                                    | Tồn 1 SKU                        |
| PUT    | `/api/admin/products/{productId}/variants/{variantId}/inventory`                                                    | Upsert (`InventoryUpsertDto`)    |
| POST   | `/api/admin/products/{productId}/variants/{variantId}/inventory`                                                    | Tạo lần đầu (409 nếu đã tồn tại) |


#### Query — `GET /warehouse/inventory`


| Param                | Mặc định | Ghi chú                                                             |
| -------------------- | -------- | ------------------------------------------------------------------- |
| `page` / `pageSize`  | 1 / 50   | Clamp 1..200                                                        |
| `search`             | —        | Tìm theo `sku`, `variantName`, `productName`                        |
| `warehouseLocation`  | —        | Lọc đúng giá trị `WarehouseLocation`                                |
| `onlyOutOfStock`     | `false`  | `quantityAvailable <= 0`                                            |
| `onlyBelowThreshold` | `false`  | `quantityAvailable <= threshold` (bỏ qua nếu `onlyOutOfStock=true`) |
| `threshold`          | 10       |                                                                     |


#### Response `data` (`PagedResultDto<AdminInventoryListItemDto>`)

`items[]`:


| Field                                                     | Kiểu   |
| --------------------------------------------------------- | ------ |
| `inventoryId`, `variantId`, `productId`                   | number |
| `sku`, `variantName`, `productName`                       | string |
| `warehouseLocation`                                       | string |
| `quantityOnHand`, `quantityReserved`, `quantityAvailable` | number |


Sắp xếp mặc định: `quantityAvailable` tăng dần → SKU sắp hết hiển thị trước.

#### Body — `InventoryUpsertDto`


| Field               | Kiểu   | Ghi chú                                                                                                |
| ------------------- | ------ | ------------------------------------------------------------------------------------------------------ |
| `quantityOnHand`    | number | Số lượng thực tế trên kệ                                                                               |
| `quantityReserved`  | number | Số đang giữ cho đơn (thường BE tự quản qua RESERVE/RELEASE — Stock chỉ override nếu cần đối chiếu tay) |
| `warehouseLocation` | string | null                                                                                                   |


`quantityAvailable` = `quantityOnHand − quantityReserved` (BE tính).

---

### Giao dịch kho — `/api/admin/inventory-transactions`


| Method | Path                                                                                                                        | Mô tả                                     |
| ------ | --------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------- |
| GET    | `/api/admin/inventory-transactions?page&pageSize&variantId&type&fromDate&toDate&referenceType&referenceId&workerIdAssigned` | Lịch sử (mới có 3 filter cuối)            |
| GET    | `/api/admin/inventory-transactions/{id}`                                                                                    | Chi tiết                                  |
| POST   | `/api/admin/inventory-transactions`                                                                                         | Tạo IN / OUT / ADJUST / RESERVE / RELEASE |


#### Body — `InventoryTransactionCreateDto`

(Chi tiết field xem [admin/giao-dich-kho.md](../admin/giao-dich-kho.md).) Field tiêu biểu:


| Field             | Kiểu   | Bắt buộc | Ghi chú                                                                                       |
| ----------------- | ------ | -------- | --------------------------------------------------------------------------------------------- |
| `variantId`       | number | Có       |                                                                                               |
| `transactionType` | string | Có       | `IN` / `OUT` / `ADJUST` / `RESERVE` / `RELEASE`                                               |
| `quantity`        | number | Có       | Đơn vị nguyên; BE quy ước dương cho IN/RESERVE, có thể âm/dương cho ADJUST tuỳ implementation |
| `referenceType`   | string | Không    | VD `Order`, `Return`, `Warranty`, `PO`                                                        |
| `referenceId`     | string | Không    | ID liên quan                                                                                  |
| `notes`           | string | Không    | Lý do                                                                                         |


#### Filter mới (mở rộng query)


| Param              | Ý nghĩa                                                      |
| ------------------ | ------------------------------------------------------------ |
| `referenceType`    | Tham chiếu nguồn (VD `Order` để xem giao dịch xuất theo đơn) |
| `referenceId`      | Cụ thể                                                       |
| `workerIdAssigned` | Worker phụ trách (nếu BE gắn lúc tạo)                        |


---

## Luồng UI

### A) Quản lý tồn

1. Mặc định mở [dashboard.md](./dashboard.md) → click "Tồn thấp" → `GET /warehouse/inventory?onlyBelowThreshold=true&threshold=10`.
2. Click 1 SKU → mở `GET /products/{pid}/variants/{vid}/inventory` để xem chi tiết / sửa `warehouseLocation`.
3. Cập nhật bằng `PUT` (set thủ công) hoặc tạo `POST /inventory-transactions` type `IN` (giữ audit lịch sử).

### B) Nhập kho từ chứng từ

1. `POST /inventory-transactions` type `IN`, kèm `referenceType="PO"` (nếu có), `referenceId` (mã chứng từ thủ công), `notes`.
2. Refetch tồn từ `GET /products/{pid}/variants/{vid}/inventory`.

### C) Kiểm kê (ADJUST)

1. Mở `GET /warehouse/inventory` → so sánh `quantityOnHand` với thực tế.
2. Tạo `POST /inventory-transactions` type `ADJUST` với `quantity` là delta (+/−), `notes` bắt buộc lý do.

### D) Tra cứu giao dịch

- Theo SKU: `?variantId=...`
- Theo đơn: `?referenceType=Order&referenceId=<orderId>`
- Theo worker: `?workerIdAssigned=<userId>` — phối hợp Worker phân công.
- Theo ngày: `fromDate / toDate`.

## UX

- Cảnh báo khi ADJUST làm `quantityAvailable` âm (chặn submit).
- Validate `quantity > 0` cho IN/OUT/RESERVE/RELEASE.
- Hiển thị `referenceType` + `referenceId` dạng badge, click chuyển sang đơn / phiếu liên quan.

