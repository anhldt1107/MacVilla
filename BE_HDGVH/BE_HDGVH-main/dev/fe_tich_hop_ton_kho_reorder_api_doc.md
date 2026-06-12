# Tích hợp FE — Tồn kho & ReorderPoint / SafetyStock (bản độc lập)

Tài liệu mô tả đầy đủ các API **bị ảnh hưởng** sau khi bổ sung cột `ReorderPoint`, `SafetyStock` trên bảng `Inventories` và logic low-stock; kèm **API mới**. Không phụ thuộc tài liệu khác trong repo.

**Giả định:** `{base}` là gốc API (ví dụ `https://api.example.com`). Mọi path dưới đây nối sau `{base}`.

**JSON:** ASP.NET Core serialize theo **camelCase** (`reorderPoint`, không phải `ReorderPoint`).

---

## 1. Xác thực và envelope

**Header (endpoint có bảo vệ):**

- `Authorization: Bearer <access_token>` — JWT **nhân viên (staff)** dùng cho toàn bộ `api/admin/...` dưới đây.
- `Content-Type: application/json` khi có body.

**Phân quyền (policy backend):**


| Policy           | Ý nghĩa ngắn gọn                                                                         |
| ---------------- | ---------------------------------------------------------------------------------------- |
| `WarehouseStaff` | Tổ kho + một số role quản lý có quyền kho (theo cấu hình server).                        |
| `ManagerOrAdmin` | Chỉ Manager / Admin — **không** dùng chung cho Worker chỉ kho nếu token không đủ policy. |


**Body response thành công (HTTP 200):** object dạng

```json
{
  "success": true,
  "data": {},
  "message": "string",
  "errorCode": null,
  "errors": null
}
```

`data` là payload nghiệp vụ (object hoặc mảng). `message` có thể tiếng Việt.

**Body lỗi (handler nghiệp vụ):** HTTP tương ứng (400, 404, 409, …), cùng họ object với `success: false`, `message`, thường có `errorCode` (ví dụ `NOT_FOUND`, `BAD_REQUEST`, `CONFLICT`, `VALIDATION_ERROR`).

**Lỗi validation model (400):** có thể có `errors` dạng map `tênField → mảng message`.

---

## 2. Công thức “tồn thấp” (áp dụng cho nhiều API)

Với mỗi dòng tồn trong DB:

- `effectiveThreshold = reorderPoint ?? thresholdQuery`
  - `reorderPoint`: từ DB, có thể `null`.
  - `thresholdQuery`: giá trị query `threshold` hoặc `lowStockThreshold` tùy endpoint (mặc định 10 nếu không gửi).

**Điều kiện một SKU thuộc “tồn thấp”:** `quantityAvailable <= effectiveThreshold`.

**Hết hàng (không đổi):** `quantityAvailable <= 0` — dùng cho `outOfStockCount` trên overview.

---

## 3. API mới (route chưa tồn tại trước bản cập nhật)


| STT | Method  | Path đầy đủ                                                                     | Policy         | Body JSON     | Mô tả                                                                                             |
| --- | ------- | ------------------------------------------------------------------------------- | -------------- | ------------- | ------------------------------------------------------------------------------------------------- |
| N1  | **PUT** | `/api/admin/products/{productId}/variants/{variantId}/inventory/reorder-policy` | WarehouseStaff | Xem bảng dưới | Chỉ cập nhật `reorderPoint` / `safetyStock`. **Không** thay `quantityOnHand`, `quantityReserved`. |


**Body `PUT` (N1):**


| Field          | Kiểu            | Ghi chú                                                                                            |
| -------------- | --------------- | -------------------------------------------------------------------------------------------------- |
| `reorderPoint` | `number | null` | `null` = xóa cấu hình ngưỡng đặt hàng lại trên DB.                                                 |
| `safetyStock`  | `number | null` | `null` = xóa. Nếu gửi số: bắt buộc đồng thời có `reorderPoint` (không được chỉ gửi `safetyStock`). |


**Ràng buộc server (400 `BAD_REQUEST` nếu vi phạm):**

- `reorderPoint` và `safetyStock` (nếu có giá trị) không được âm.
- Có `safetyStock` (khác null) thì phải có `reorderPoint` (khác null).
- Nếu cả hai là số: `safetyStock <= reorderPoint`.

**Response `data` (N1):** cùng shape **InventoryResponse** (mục 4.1).

**404 `NOT_FOUND`:** biến thể không thuộc `productId`, hoặc **chưa có** bản ghi tồn cho variant (phải tạo tồn trước khi gọi policy).

---

## 4. API đã có — FE cần chỉnh (response hoặc logic filter đổi)

Các route sau **không đổi URL**; FE cần cập nhật type / UI vì **thêm field** hoặc **đổi cách lọc/đếm**.

### 4.1 Nhóm tồn theo sản phẩm / biến thể

Prefix: `/api/admin/products/{productId}/variants/{variantId}/inventory`


| STT | Method | Path (suffix)    | Policy         | FE cần làm                                                                                                              |
| --- | ------ | ---------------- | -------------- | ----------------------------------------------------------------------------------------------------------------------- |
| E1  | GET    | *(không suffix)* | WarehouseStaff | Parse `data` thêm `reorderPoint`, `safetyStock` (nullable).                                                             |
| E2  | PUT    | *(không suffix)* | WarehouseStaff | Giống E1 trên response. Body **không** chứa policy (vẫn chỉ `quantityOnHand`, `quantityReserved`, `warehouseLocation`). |
| E3  | POST   | *(không suffix)* | WarehouseStaff | Giống E1 trên response.                                                                                                 |


**Shape `data` — InventoryResponse (E1–E3, và N1):**


| Field               | Kiểu          |
| ------------------- | ------------- |
| `id`                | number        |
| `variantId`         | number        |
| `warehouseLocation` | string | null |
| `quantityOnHand`    | number        |
| `quantityReserved`  | number        |
| `quantityAvailable` | number        |
| `reorderPoint`      | number | null |
| `safetyStock`       | number | null |


**Body PUT/POST (E2, E3) — InventoryUpsert:**


| Field               | Kiểu                   |
| ------------------- | ---------------------- |
| `quantityOnHand`    | number (≥ 0)           |
| `quantityReserved`  | number (≥ 0, ≤ onHand) |
| `warehouseLocation` | string | null          |


**409 `CONFLICT`:** E3 khi đã tồn tại bản ghi tồn cho variant.

---

### 4.2 Warehouse — tổng quan kho


| STT | Method | Path                            | Policy         | Query                                      | FE cần làm                                                                                                                                                                                               |
| --- | ------ | ------------------------------- | -------------- | ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| W1  | GET    | `/api/admin/warehouse/overview` | WarehouseStaff | `lowStockThreshold` (optional, default 10) | Hiểu lại `data.lowStockCount`: đếm SKU với `quantityAvailable <= (reorderPoint ?? lowStockThreshold)`. `data.lowStockThreshold` là giá trị query đã echo. Các field khác của overview không đổi ý nghĩa. |


**Shape `data` — AdminWarehouseOverview (chỉ nêu field liên quan thay đổi ngữ nghĩa):**


| Field               | Kiểu   | Ghi chú                                  |
| ------------------- | ------ | ---------------------------------------- |
| `lowStockCount`     | number | Theo mục 2.                              |
| `lowStockThreshold` | number | Ngưỡng fallback khi `reorderPoint` null. |
| `outOfStockCount`   | number | Không đổi: `quantityAvailable <= 0`.     |


(Các field fulfillment, giao dịch hôm nay, đổi trả, bảo hành… vẫn như trước; FE chỉ cần biết `lowStockCount` không còn “pure threshold” toàn hệ nếu DB có `reorderPoint`.)

---

### 4.3 Warehouse — danh sách tồn thấp


| STT | Method | Path                             | Policy         | Query                                                              | FE cần làm                                                          |
| --- | ------ | -------------------------------- | -------------- | ------------------------------------------------------------------ | ------------------------------------------------------------------- |
| W2  | GET    | `/api/admin/warehouse/low-stock` | WarehouseStaff | `threshold` (default 10), `take` (default 100; server clamp 1–500) | Danh sách lọc theo mục 2. Mỗi phần tử **thêm** field; bảng mục 4.5. |


---

### 4.4 Warehouse — danh sách tồn phân trang


| STT | Method | Path                             | Policy         | Query                                                                                                                                                 | FE cần làm                                                                                                            |
| --- | ------ | -------------------------------- | -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| W3  | GET    | `/api/admin/warehouse/inventory` | WarehouseStaff | `page` (default 1), `pageSize` (default 50, max 200), `search`, `warehouseLocation`, `onlyOutOfStock`, `onlyBelowThreshold`, `threshold` (default 10) | Khi `onlyBelowThreshold=true`, filter theo mục 2. Mỗi item **thêm** field; bảng mục 4.6. `data` là object phân trang. |


**Shape `data` — PagedResult (W3):**


| Field        | Kiểu   |
| ------------ | ------ |
| `items`      | mảng   |
| `totalCount` | number |
| `page`       | number |
| `pageSize`   | number |


---

### 4.5 Reports — danh sách tồn thấp (Manager / Admin)


| STT | Method | Path                           | Policy         | Query                                                       | FE cần làm                                                                                                                                                                         |
| --- | ------ | ------------------------------ | -------------- | ----------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R1  | GET    | `/api/admin/reports/low-stock` | ManagerOrAdmin | `threshold` (default 10), `take` (default 100, clamp 1–500) | **Cùng** logic filter và **cùng** shape phần tử như W2. FE màn Manager/Admin phải parse thêm field như bảng 4.5. Token Worker thuần kho có thể **403** nếu không thuộc policy này. |


**Một phần tử trong `data[]` (W2 và R1) — AdminLowStockItem:**


| Field                        | Kiểu                                               |
| ---------------------------- | -------------------------------------------------- |
| `variantId`                  | number                                             |
| `sku`                        | string                                             |
| `variantName`                | string                                             |
| `productId`                  | number                                             |
| `productName`                | string                                             |
| `warehouseLocation`          | string | null                                      |
| `quantityOnHand`             | number                                             |
| `quantityReserved`           | number                                             |
| `quantityAvailable`          | number                                             |
| `reorderPoint`               | number | null                                      |
| `safetyStock`                | number | null                                      |
| `effectiveLowStockThreshold` | number (= `reorderPoint ?? threshold` của request) |


---

### 4.6 Phần tử `items[]` trong W3 — AdminInventoryListItem

Các field cũ (`inventoryId`, `variantId`, `sku`, `variantName`, `productId`, `productName`, `warehouseLocation`, `quantityOnHand`, `quantityReserved`, `quantityAvailable`) giữ nguyên. **Thêm:**


| Field                        | Kiểu          |
| ---------------------------- | ------------- |
| `reorderPoint`               | number | null |
| `safetyStock`                | number | null |
| `effectiveLowStockThreshold` | number        |
| `isLowStock`                 | boolean       |


---

## 5. Bảng tổng hợp checklist FE


| Loại                      | Method + path                      | Hành động FE                                         |
| ------------------------- | ---------------------------------- | ---------------------------------------------------- |
| **Mới**                   | `PUT .../inventory/reorder-policy` | Gọi mới; form policy tách khỏi PUT tồn.              |
| **Đổi response**          | `GET/PUT/POST .../inventory`       | Mở rộng model `data`: `reorderPoint`, `safetyStock`. |
| **Đổi nghĩa số**          | `GET .../warehouse/overview`       | Giải thích `lowStockCount` theo mục 2.               |
| **Đổi response + filter** | `GET .../warehouse/low-stock`      | Parse field mới; danh sách theo mục 2.               |
| **Đổi response + filter** | `GET .../warehouse/inventory`      | `onlyBelowThreshold` + field mỗi dòng (mục 4.6).     |
| **Đổi response + filter** | `GET .../reports/low-stock`        | Giống warehouse low-stock; kiểm tra policy token.    |


---

## 6. API **không** nằm trong phạm vi thay đổi này

Các endpoint admin khác (đơn, báo giá, fulfillment, …) **không** bị sửa chỉ vì migration tồn kho. Chỉ các URL liệt kê mục 3–4 cần rà soát FE.

---

## 7. Gợi ý triển khai UI ngắn

- Màn chi tiết biến thể: sau `GET .../inventory`, hiển thị policy; lưu policy bằng `PUT .../reorder-policy`, lưu số lượng bằng `PUT .../inventory`.
- Dashboard kho: khi hiển thị `lowStockCount`, ghi chú người dùng rằng SKU có `reorderPoint` riêng sẽ dùng ngưỡng đó thay cho `lowStockThreshold` của query.
- Bảng low-stock / inventory: cột “Ngưỡng áp dụng” bind `effectiveLowStockThreshold`; badge dùng `isLowStock` (W3) hoặc so sánh `quantityAvailable` với `effectiveLowStockThreshold` (W2/R1).

---

## 8. Ví dụ JSON đầy đủ (FE copy — request & response)

Dưới đây là **body thật** sau khi parse HTTP (đã bỏ header). Số trong ví dụ chỉ minh họa.

**Quy ước parse:**

- Luôn đọc `success` (boolean). Nếu `false` → xử lý `message`, `errorCode`, `errors`; không giả định `data` có cấu trúc.
- Nếu `success === true` → payload nghiệp vụ nằm trong `data` (object hoặc mảng).
- Một số field có thể **vắng** hoặc `null` tùy cấu hình serializer; FE nên dùng optional chaining (`data?.reorderPoint`).

---

### 8.1 `GET /api/admin/products/12/variants/34/inventory` (E1)

Không body. HTTP 200:

```json
{
  "success": true,
  "message": "Lấy tồn kho thành công",
  "data": {
    "id": 501,
    "variantId": 34,
    "warehouseLocation": "KHO-A-01",
    "quantityOnHand": 120,
    "quantityReserved": 15,
    "quantityAvailable": 105,
    "reorderPoint": 30,
    "safetyStock": 10
  },
  "errorCode": null,
  "errors": null
}
```

Khi chưa cấu hình policy trên DB, `reorderPoint` và `safetyStock` có thể là `null`:

```json
{
  "success": true,
  "message": "Lấy tồn kho thành công",
  "data": {
    "id": 501,
    "variantId": 34,
    "warehouseLocation": null,
    "quantityOnHand": 50,
    "quantityReserved": 0,
    "quantityAvailable": 50,
    "reorderPoint": null,
    "safetyStock": null
  },
  "errorCode": null,
  "errors": null
}
```

---

### 8.2 `PUT /api/admin/products/12/variants/34/inventory` (E2)

**Request body (InventoryUpsert):**

```json
{
  "quantityOnHand": 200,
  "quantityReserved": 20,
  "warehouseLocation": "KHO-B-02"
}
```

`warehouseLocation` có thể bỏ hoặc `null` nếu không dùng vị trí.

**Response 200** (`data` cùng shape 8.1; `quantityAvailable` do server tính = onHand − reserved):

```json
{
  "success": true,
  "message": "Lưu tồn kho thành công",
  "data": {
    "id": 501,
    "variantId": 34,
    "warehouseLocation": "KHO-B-02",
    "quantityOnHand": 200,
    "quantityReserved": 20,
    "quantityAvailable": 180,
    "reorderPoint": 30,
    "safetyStock": 10
  },
  "errorCode": null,
  "errors": null
}
```

**Lưu ý:** `PUT` tồn **không** nhận `reorderPoint` / `safetyStock` trong body; policy chỉ đổi qua mục 8.4.

---

### 8.3 `POST /api/admin/products/12/variants/99/inventory` (E3) — tạo lần đầu

**Request body:**

```json
{
  "quantityOnHand": 10,
  "quantityReserved": 0,
  "warehouseLocation": null
}
```

**Response 200:**

```json
{
  "success": true,
  "message": "Tạo tồn kho thành công",
  "data": {
    "id": 600,
    "variantId": 99,
    "warehouseLocation": null,
    "quantityOnHand": 10,
    "quantityReserved": 0,
    "quantityAvailable": 10,
    "reorderPoint": null,
    "safetyStock": null
  },
  "errorCode": null,
  "errors": null
}
```

**Response 409** (đã có tồn):

```json
{
  "success": false,
  "message": "Biến thể đã có bản ghi tồn kho; dùng PUT để cập nhật.",
  "data": null,
  "errorCode": "CONFLICT"
}
```

---

### 8.4 `PUT /api/admin/products/12/variants/34/inventory/reorder-policy` (N1)

**Request — đặt policy:**

```json
{
  "reorderPoint": 25,
  "safetyStock": 8
}
```

**Request — chỉ đặt reorder (không dùng safety):**

```json
{
  "reorderPoint": 40,
  "safetyStock": null
}
```

**Request — xóa toàn bộ policy (dùng lại ngưỡng mặc định từ query API low-stock):**

```json
{
  "reorderPoint": null,
  "safetyStock": null
}
```

**Response 200:**

```json
{
  "success": true,
  "message": "Cập nhật chính sách đặt hàng lại thành công",
  "data": {
    "id": 501,
    "variantId": 34,
    "warehouseLocation": "KHO-B-02",
    "quantityOnHand": 200,
    "quantityReserved": 20,
    "quantityAvailable": 180,
    "reorderPoint": 25,
    "safetyStock": 8
  },
  "errorCode": null,
  "errors": null
}
```

**Response 400** (ví dụ `safetyStock > reorderPoint`):

```json
{
  "success": false,
  "message": "SafetyStock không được lớn hơn ReorderPoint.",
  "data": null,
  "errorCode": "BAD_REQUEST"
}
```

**Response 404** (chưa có bản ghi tồn):

```json
{
  "success": false,
  "message": "Chưa có bản ghi tồn kho cho biến thể này",
  "data": null,
  "errorCode": "NOT_FOUND"
}
```

---

### 8.5 `GET /api/admin/warehouse/overview?lowStockThreshold=10` (W1)

Không body. HTTP 200 — `**data` là một object** (đủ field theo DTO server; ví dụ minh họa):

```json
{
  "success": true,
  "message": "OK",
  "data": {
    "fulfillmentPendingCount": 3,
    "fulfillmentPickingCount": 2,
    "fulfillmentPackedCount": 1,
    "fulfillmentShippedTodayCount": 5,
    "fulfillmentTotalActiveCount": 6,
    "lowStockCount": 12,
    "outOfStockCount": 2,
    "lowStockThreshold": 10,
    "inventoryTransactionsTodayCount": 40,
    "inventoryInTodayCount": 15,
    "inventoryOutTodayCount": 20,
    "inventoryAdjustTodayCount": 5,
    "returnsAwaitingCompleteCount": 1,
    "warrantyClaimsActiveCount": 0
  },
  "errorCode": null,
  "errors": null
}
```

`lowStockCount` phụ thuộc từng SKU: `quantityAvailable <= (reorderPoint ?? 10)` với `10` là `lowStockThreshold` trong URL.

---

### 8.6 `GET /api/admin/warehouse/low-stock?threshold=10&take=50` (W2)

Không body. HTTP 200 — `**data` là mảng** các object (cùng shape `GET .../reports/low-stock`):

```json
{
  "success": true,
  "message": "OK",
  "data": [
    {
      "variantId": 34,
      "sku": "SKU-001-RED",
      "variantName": "Đỏ / M",
      "productId": 12,
      "productName": "Áo thun A",
      "warehouseLocation": "KHO-A-01",
      "quantityOnHand": 8,
      "quantityReserved": 0,
      "quantityAvailable": 8,
      "reorderPoint": 20,
      "safetyStock": 5,
      "effectiveLowStockThreshold": 20
    },
    {
      "variantId": 88,
      "sku": "SKU-002-BLUE",
      "variantName": "Xanh / L",
      "productId": 15,
      "productName": "Quần B",
      "warehouseLocation": null,
      "quantityOnHand": 5,
      "quantityReserved": 1,
      "quantityAvailable": 4,
      "reorderPoint": null,
      "safetyStock": null,
      "effectiveLowStockThreshold": 10
    }
  ],
  "errorCode": null,
  "errors": null
}
```

Ở dòng thứ hai: `reorderPoint` null → `effectiveLowStockThreshold` bằng `threshold` query (ở đây 10).

---

### 8.7 `GET /api/admin/warehouse/inventory?page=1&pageSize=20&onlyBelowThreshold=true&threshold=10` (W3)

Không body. HTTP 200 — `**data` là object phân trang**, `items` là mảng:

```json
{
  "success": true,
  "message": "OK",
  "data": {
    "items": [
      {
        "inventoryId": 501,
        "variantId": 34,
        "sku": "SKU-001-RED",
        "variantName": "Đỏ / M",
        "productId": 12,
        "productName": "Áo thun A",
        "warehouseLocation": "KHO-A-01",
        "quantityOnHand": 100,
        "quantityReserved": 95,
        "quantityAvailable": 5,
        "reorderPoint": 15,
        "safetyStock": 5,
        "effectiveLowStockThreshold": 15,
        "isLowStock": true
      }
    ],
    "totalCount": 1,
    "page": 1,
    "pageSize": 20
  },
  "errorCode": null,
  "errors": null
}
```

- `isLowStock === true` khi `quantityAvailable <= (reorderPoint ?? threshold)` với `threshold` từ query (ví dụ 10).
- Khi `onlyBelowThreshold=false`, response vẫn có các field `reorderPoint`, `safetyStock`, `effectiveLowStockThreshold`, `isLowStock` trên mỗi dòng (để hiển thị badge); chỉ **bộ lọc** danh sách là khác.

---

### 8.8 `GET /api/admin/reports/low-stock?threshold=10&take=100` (R1)

Cùng shape `**data` như mục 8.6** (mảng object). Chỉ khác **policy** (Manager/Admin) và URL prefix `reports` thay vì `warehouse`.

---

### 8.9 Lỗi validation body (E2 / E3) — HTTP 400

Khi body không pass validation (ví dụ `quantityReserved` âm), server trả **HTTP 400** với `message` cố định trong code hiện tại:

```json
{
  "success": false,
  "message": "Dữ liệu không hợp lệ.",
  "data": null,
  "errorCode": "VALIDATION_ERROR",
  "errors": {
    "quantityReserved": ["Tồn giữ chỗ không được âm."]
  }
}
```

**Khóa trong `errors`:** do `ModelState` của ASP.NET Core — có thể là `quantityReserved`, `QuantityReserved`, hoặc dạng có tiền tố (vd. tham số action). FE nên: (1) gọi một request lỗi cố ý và log `JSON.stringify` body; hoặc (2) xem schema / thử trên Swagger tại `{base}/swagger`.

---

### 8.10 Lỗi nghiệp vụ upsert (E2) — HTTP 400

```json
{
  "success": false,
  "message": "Số lượng giữ chỗ không được lớn hơn tồn thực tế.",
  "data": null,
  "errorCode": "BAD_REQUEST"
}
```

