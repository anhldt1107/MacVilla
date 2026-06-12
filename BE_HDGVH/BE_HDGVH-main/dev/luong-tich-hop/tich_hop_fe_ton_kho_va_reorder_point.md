# Tích hợp FE — tồn kho & reorder policy (ReorderPoint / SafetyStock)

Tài liệu chuyên đề cho màn hình **tồn theo biến thể**, **cấu hình đặt hàng lại**, và **cảnh báo tồn thấp** (dashboard kho / báo cáo).

**Chuẩn chung (bắt buộc đọc trước):**

- Envelope `ResponseDto`, header JWT staff, `PagedResultDto`, map HTTP + `errorCode`: [../Documents/guidelineUI/tich_hop_api_fe.md](../Documents/guidelineUI/tich_hop_api_fe.md)
- Chi tiết lỗi toàn cục: [../api_response_va_xu_ly_loi.md](../api_response_va_xu_ly_loi.md)

**Quy ước:** `{base}` = URL API (vd `http://localhost:8080`). JSON **camelCase**. Endpoint admin dùng JWT **staff** (`Authorization: Bearer <token>`).

---

## 1. Mục đích & phạm vi


| Luồng                                              | API                                  | Ghi chú                                                                                            |
| -------------------------------------------------- | ------------------------------------ | -------------------------------------------------------------------------------------------------- |
| Số lượng tồn (on hand, reserved, vị trí kho)       | `GET` / `PUT` / `POST` …`/inventory` | `PUT` upsert; `POST` chỉ tạo lần đầu (409 nếu đã có).                                              |
| Chính sách đặt hàng lại (ngưỡng cảnh báo theo SKU) | `PUT` …`/inventory/reorder-policy`   | **Tách biệt** khỏi upsert tồn: tránh PUT tồn vô tình ghi đè policy khi field bị bỏ qua trong JSON. |
| Danh sách / đếm tồn thấp                           | `GET` warehouse hoặc `GET` reports   | Cùng công thức ngưỡng (mục 4).                                                                     |


FE nên tách **form số lượng** và **form policy** (tab hoặc section riêng).

---

## 2. Auth & policy


| Nhóm path                                                                        | Policy ASP.NET   | Ai gọi được                                                            |
| -------------------------------------------------------------------------------- | ---------------- | ---------------------------------------------------------------------- |
| `/api/admin/products/{productId}/variants/{variantId}/inventory` và mọi sub-path | `WarehouseStaff` | Admin, Manager, StockManager, Worker (theo cấu hình role backend).     |
| `/api/admin/warehouse/`*                                                         | `WarehouseStaff` | Cùng nhóm — ưu tiên cho tổ kho.                                        |
| `/api/admin/reports/low-stock`                                                   | `ManagerOrAdmin` | Manager / Admin; **không** dùng chung token/policy với Worker chỉ kho. |


**Gợi ý phân quyền UI:** dùng `GET /api/me` → field `canAccessWarehouse` trong `[StaffMeDto](../../Dto/Auth/StaffMeDto.cs)` (đồng bộ logic với policy WarehouseStaff).

---

## 3. Bảng API

### 3.1 Tồn kho theo sản phẩm + biến thể

Prefix: `{base}/api/admin/products/{productId}/variants/{variantId}/inventory`


| Method | Path (suffix)    | Body                        | `data` khi thành công  |
| ------ | ---------------- | --------------------------- | ---------------------- |
| GET    | *(empty)*        | —                           | `InventoryResponseDto` |
| PUT    | *(empty)*        | `InventoryUpsertDto`        | `InventoryResponseDto` |
| POST   | *(empty)*        | `InventoryUpsertDto`        | `InventoryResponseDto` |
| PUT    | `reorder-policy` | `InventoryReorderPolicyDto` | `InventoryResponseDto` |


`**InventoryUpsertDto`:** `quantityOnHand`, `quantityReserved`, `warehouseLocation?` — server tính `quantityAvailable = onHand - reserved`.

`**InventoryReorderPolicyDto`:**


| Field          | Kiểu            | Ý nghĩa                                                                                            |
| -------------- | --------------- | -------------------------------------------------------------------------------------------------- |
| `reorderPoint` | `number | null` | Ngưỡng tồn khả dụng để coi là cần bổ sung hàng. `null` = **xóa** cấu hình (dùng ngưỡng query API). |
| `safetyStock`  | `number | null` | Tồn an toàn mong muốn. `null` = xóa.                                                               |


`**InventoryResponseDto` (GET / PUT / POST / reorder-policy):** `id`, `variantId`, `warehouseLocation`, `quantityOnHand`, `quantityReserved`, `quantityAvailable`, `reorderPoint`, `safetyStock`.

### 3.2 Warehouse (tổ kho)


| Method | Path                             | Query                                                                                                               |
| ------ | -------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| GET    | `/api/admin/warehouse/overview`  | `lowStockThreshold` (default 10)                                                                                    |
| GET    | `/api/admin/warehouse/low-stock` | `threshold` (default 10), `take` (default 100, max 500)                                                             |
| GET    | `/api/admin/warehouse/inventory` | `page`, `pageSize`, `search`, `warehouseLocation`, `onlyOutOfStock`, `onlyBelowThreshold`, `threshold` (default 10) |


### 3.3 Reports (Manager / Admin)


| Method | Path                           | Query                                                                   |
| ------ | ------------------------------ | ----------------------------------------------------------------------- |
| GET    | `/api/admin/reports/low-stock` | `threshold`, `take` — **cùng shape** response với `warehouse/low-stock` |


---

## 4. Công thức “tồn thấp” (bắt buộc hiểu đúng cho UI)

Với mỗi dòng tồn (`Inventories`):

- **Ngưỡng hiệu dụng (effective):** `effective = reorderPoint ?? threshold`
  - `reorderPoint`: từ DB (có thể `null`).
  - `threshold` / `lowStockThreshold`: từ **query** API (fallback cho SKU chưa cấu hình).
- **Điều kiện low-stock:** `quantityAvailable <= effective`

Áp dụng thống nhất cho:

- `GET .../warehouse/overview` → `lowStockCount` (đếm SKU thỏa điều kiện trên).
- `GET .../warehouse/low-stock` và `GET .../reports/low-stock` → filter danh sách.
- `GET .../warehouse/inventory` với `onlyBelowThreshold=true` → filter danh sách.

`outOfStockCount` trên overview vẫn là `quantityAvailable <= 0` (không đổi).

---

## 5. Shape `data` sau khi parse envelope

### 5.1 Low-stock item (`AdminLowStockItemDto`)

Mỗi phần tử trong `data` (mảng):


| Field                                                     | Kiểu                                               |
| --------------------------------------------------------- | -------------------------------------------------- |
| `variantId`, `productId`                                  | number                                             |
| `sku`, `variantName`, `productName`                       | string                                             |
| `warehouseLocation`                                       | string | null                                      |
| `quantityOnHand`, `quantityReserved`, `quantityAvailable` | number                                             |
| `reorderPoint`, `safetyStock`                             | number | null                                      |
| `effectiveLowStockThreshold`                              | number (= `reorderPoint ?? threshold` của request) |


### 5.2 Danh sách tồn phân trang (`PagedResultDto<AdminInventoryListItemDto>`)

`data.items[]` thêm:


| Field                         | Kiểu                                       |
| ----------------------------- | ------------------------------------------ |
| `reorderPoint`, `safetyStock` | number | null                              |
| `effectiveLowStockThreshold`  | number                                     |
| `isLowStock`                  | boolean (`quantityAvailable <= effective`) |


Các field cũ: `inventoryId`, `variantId`, `sku`, … (xem guideline [kho-warehouse.md](../Documents/guidelineUI/admin/kho-warehouse.md)).

### 5.3 Overview kho (`AdminWarehouseOverviewDto`)


| Field               | Ghi chú                                                                |
| ------------------- | ---------------------------------------------------------------------- |
| `lowStockThreshold` | Ngưỡng **fallback** truyền lên query (echo).                           |
| `lowStockCount`     | Số SKU với `quantityAvailable <= (reorderPoint ?? lowStockThreshold)`. |


---

## 6. Lỗi thường gặp (xử lý FE)


| HTTP | `errorCode`        | Tình huống                                                                                                            |
| ---- | ------------------ | --------------------------------------------------------------------------------------------------------------------- |
| 400  | `BAD_REQUEST`      | Policy: `reorderPoint` / `safetyStock` âm; có `safetyStock` nhưng thiếu `reorderPoint`; `safetyStock > reorderPoint`. |
| 400  | `VALIDATION_ERROR` | Body upsert không hợp lệ (DataAnnotations).                                                                           |
| 404  | `NOT_FOUND`        | Biến thể không thuộc sản phẩm; hoặc **chưa có** bản ghi inventory (GET / PUT policy).                                 |
| 409  | `CONFLICT`         | `POST` inventory khi đã tồn tại dòng tồn.                                                                             |


Upsert tồn: `quantityReserved > quantityOnHand` → 400 `BAD_REQUEST`.

---

## 7. Ví dụ JSON

### 7.1 Cập nhật reorder policy

```http
PUT {base}/api/admin/products/12/variants/34/inventory/reorder-policy
Content-Type: application/json
Authorization: Bearer <staff_access_token>
```

```json
{
  "reorderPoint": 15,
  "safetyStock": 5
}
```

Xóa cấu hình (dùng lại ngưỡng mặc định từ API list):

```json
{
  "reorderPoint": null,
  "safetyStock": null
}
```

Response 200 (rút gọn):

```json
{
  "success": true,
  "message": "Cập nhật chính sách đặt hàng lại thành công",
  "data": {
    "id": 1,
    "variantId": 34,
    "warehouseLocation": "A-01",
    "quantityOnHand": 100,
    "quantityReserved": 10,
    "quantityAvailable": 90,
    "reorderPoint": 15,
    "safetyStock": 5
  }
}
```

### 7.2 Lọc danh sách tồn dưới ngưỡng

```http
GET {base}/api/admin/warehouse/inventory?onlyBelowThreshold=true&threshold=10&page=1&pageSize=50
Authorization: Bearer <staff_access_token>
```

Mỗi item có `effectiveLowStockThreshold` và `isLowStock` để badge / sort mà không cần tính lại sai công thức.

---

## 8. Gợi ý UI

- Hiển thị **effectiveLowStockThreshold** cạnh SLA tồn (đặc biệt khi `reorderPoint` null → hiện “dùng mặc định 10” hoặc số từ query).
- Badge “Low” từ `isLowStock` trên list inventory; trên low-stock list có thể so sánh `quantityAvailable` với `effectiveLowStockThreshold`.
- Màn Admin sản phẩm: sau khi có `productId` + `variantId`, load `GET .../inventory` để bind cả số lượng và policy.

---

## 9. Tham chiếu mã nguồn BE

- Controller: `Controllers/AdminInventoryController.cs`, `AdminWarehouseController.cs`, `AdminReportsController.cs`
- Service policy: `Service/InventoryService.cs` (`UpdateReorderPolicyAsync`, validation)
- DTO: `Dto/Inventory/`, `Dto/Admin/AdminWarehouseDtos.cs`, `Dto/Admin/AdminReportDtos.cs`

