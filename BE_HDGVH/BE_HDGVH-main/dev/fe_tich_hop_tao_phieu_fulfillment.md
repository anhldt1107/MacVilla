# Tích hợp FE — Tạo phiếu xuất kho (Fulfillment)

Tài liệu mô tả API **tạo phiếu xuất kho** gắn với một đơn hàng nội bộ (`CustomerOrder`), chuẩn envelope `ResponseDto`, JSON **camelCase**.

**Giả định:** `{base}` là gốc API. Header `Authorization: Bearer <access_token>` với JWT **staff** (nhân viên).

---

## 1. Policy và luồng tổng quan


| Nội dung                                       | Giá trị                                                                                                                                                              |
| ---------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Policy (đọc danh sách / chi tiết / statuses)   | `**StaffAuthenticated`** — gồm **Sales**; dùng `GET /api/admin/fulfillments`, `GET .../{id}`, `GET .../statuses`.                                                    |
| Policy (tạo phiếu, đổi trạng thái, gán worker) | `**WarehouseStaff`** — `admin`, `Manager`, `StockManager`, `Worker`: `POST .../orders/{orderId}/fulfillments`, `PUT .../fulfillments/{id}/status`, `PUT .../assign`. |
| Tạo phiếu                                      | `**POST {base}/api/admin/orders/{orderId}/fulfillments`**                                                                                                            |
| Quản lý phiếu sau khi tạo                      | **GET** (staff) / **PUT** (WarehouseStaff) dưới prefix `**{base}/api/admin/fulfillments`**                                                                           |


**Lưu ý nghiệp vụ:** Tạo phiếu **không** tự trừ tồn kho trong BE hiện tại; chỉ tạo bản ghi `FulfillmentTicket` trạng thái `**Pending`** và trả chi tiết phiếu kèm snapshot đơn. Trừ kho (nếu có) là luồng `**InventoryTransaction`** riêng.

---

## 2. Điều kiện đơn hàng mới được tạo phiếu

Server kiểm tra trong `AdminFulfillmentService.CreateAsync`:


| Trạng thái đơn (`orderStatus`)                                       | Cho phép tạo phiếu?                                                     |
| -------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `Cancelled`                                                          | **Không** → 409 `CONFLICT` (message: không thể tạo cho đơn đã hủy).     |
| `New`, `AwaitingPayment`                                             | **Không** → 409 (đơn chưa xác nhận / chưa thanh toán đủ theo rule đơn). |
| Các trạng thái khác (vd `Confirmed`, `Processing`, `ReadyToShip`, …) | **Được** (miễn không rơi hai nhóm trên).                                |


FE nên: trước khi bật nút “Tạo phiếu xuất”, lấy chi tiết đơn (`GET /api/admin/orders/{id}`) và **disable** nếu `orderStatus` thuộc nhóm cấm.

---

## 3. Tạo phiếu — request

**HTTP**

```http
POST {base}/api/admin/orders/42/fulfillments
Content-Type: application/json
Authorization: Bearer <staff_access_token>
```

**Body (`FulfillmentCreateDto`) — tất cả optional**


| Field JSON   | Kiểu     | Ràng buộc | Ý nghĩa       |
| ------------ | -------- | --------- | ------------- |
| `ticketType` | `string` | bỏ qua    | max 100 ký tự |
| `notes`      | `string` | bỏ qua    | max 1000      |


**Ví dụ body tối thiểu**

```json
{}
```

**Ví dụ body đầy đủ**

```json
{
  "ticketType": "STANDARD",
  "notes": "Giao trong ngày — ưu tiên kệ A"
}
```

**JWT:** Server đọc `sub` / `NameIdentifier` để ghi `**createdBy`** (người tạo). Nếu không parse được user → **403** `FORBIDDEN` với message kiểu “Không xác định được người dùng hiện tại”.

---

## 4. Tạo phiếu — response thành công (HTTP 200)

Envelope:

```json
{
  "success": true,
  "message": "Tạo phiếu xuất kho thành công",
  "data": { }
}
```

`data` là object `**FulfillmentDetailDto**` (rút gọn cấu trúc; số minh họa):

```json
{
  "success": true,
  "message": "Tạo phiếu xuất kho thành công",
  "data": {
    "id": 1001,
    "orderId": 42,
    "ticketType": "STANDARD",
    "status": "Pending",
    "notes": "Giao trong ngày — ưu tiên kệ A",
    "createdAt": "2026-04-19T10:00:00Z",
    "updatedAt": null,
    "assignedWorkerId": null,
    "assignedWorkerName": null,
    "createdBy": 5,
    "createdByName": "Nguyễn Kho",
    "order": {
      "id": 42,
      "orderCode": "ORD-2026-001",
      "orderStatus": "Confirmed",
      "paymentStatus": "Paid",
      "createdAt": "2026-04-18T08:00:00Z",
      "merchandiseTotal": 500000,
      "discountTotal": 0,
      "payableTotal": 500000,
      "customer": {
        "id": 10,
        "fullName": "Khách A",
        "email": "a@example.com",
        "phone": "0900000000"
      },
      "shippingAddress": {
        "id": 3,
        "receiverName": "Khách A",
        "receiverPhone": "0900000000",
        "addressLine": "123 Đường X, Q.1"
      },
      "lines": [
        {
          "id": 200,
          "variantId": 34,
          "skuSnapshot": "SKU-001",
          "quantity": 2,
          "priceSnapshot": 250000,
          "subTotal": 500000,
          "currentSku": "SKU-001",
          "variantName": "Đỏ / M",
          "productName": "Áo thun",
          "imageUrl": "https://..."
        }
      ]
    }
  },
  "errorCode": null,
  "errors": null
}
```

Sau khi tạo, `assignedWorkerId` thường `**null**` — cần bước **gán Worker** (mục 5).

---

## 5. Bước tiếp theo sau khi tạo (cùng module fulfillment)


| Bước                        | Method | Path                                  | Body / query                                                |
| --------------------------- | ------ | ------------------------------------- | ----------------------------------------------------------- |
| Lấy danh sách phiếu         | GET    | `/api/admin/fulfillments`             | `page`, `pageSize`, `status`, `orderId`, `assignedWorkerId` |
| Chi tiết phiếu              | GET    | `/api/admin/fulfillments/{id}`        | —                                                           |
| Danh sách trạng thái hợp lệ | GET    | `/api/admin/fulfillments/statuses`    | Trả mảng string trong `data`                                |
| Gán Worker                  | PUT    | `/api/admin/fulfillments/{id}/assign` | `{ "workerId": 7 }`                                         |
| Đổi trạng thái phiếu        | PUT    | `/api/admin/fulfillments/{id}/status` | `{ "status": "Picking", "notes": null }`                    |


**Chuỗi trạng thái phiếu (BE):** `Pending` → `Picking` → `Packed` → `Shipped`. Có thể hủy: `Pending`/`Picking`/`Packed` → `Cancelled` (theo `FulfillmentStatuses.CanTransition`).

**Ghi chú khi `Shipped`:** Nếu đơn đang `**ReadyToShip`** và cho phép chuyển, BE có thể đồng bộ `**orderStatus` của đơn → `Shipped`**. Việc này **không** tự tạo giao dịch kho.

---

## 6. Lỗi thường gặp


| HTTP | `errorCode` (tiêu biểu) | Tình huống                                                                                  |
| ---- | ----------------------- | ------------------------------------------------------------------------------------------- |
| 403  | `FORBIDDEN`             | JWT không đủ `WarehouseStaff`; hoặc không lấy được user id khi tạo.                         |
| 404  | `NOT_FOUND`             | `orderId` không tồn tại; hoặc (ở API khác) `fulfillmentId` / `workerId` không có.           |
| 409  | `CONFLICT`              | `InvalidOperationException`: đơn hủy hoặc đơn chưa đủ điều kiện (New / AwaitingPayment).    |
| 400  | `VALIDATION_ERROR`      | Body assign/status không hợp lệ (thiếu `workerId`, thiếu `status`, vượt max length).        |
| 400  | `BAD_REQUEST`           | Chuyển trạng thái phiếu không hợp lệ (bước sai hoặc không nằm trong `FulfillmentStatuses`). |


---

## 7. Gợi ý UI

1. Màn chi tiết đơn (`orderId` đã biết) → nút **“Tạo phiếu xuất kho”** → `POST` như trên → điều hướng hoặc mở panel chi tiết phiếu (`data.id`).
2. Sau tạo: form **Gán Worker** (dropdown từ `GET /api/admin/staff-directory?role=Worker&status=Active` nếu đã có tích hợp nhân sự).
3. Worker / điều phối: nút chuyển trạng thái theo đúng thứ tự; gọi `GET .../fulfillments/statuses` để fill label.

---

## 8. Tham chiếu mã nguồn

- `Controllers/AdminFulfillmentsController.cs`, `AdminOrderFulfillmentsController.cs`
- `Service/AdminFulfillmentService.cs`
- `Dto/Fulfillment/AdminFulfillmentDtos.cs`
- `Domain/FulfillmentStatuses.cs`

