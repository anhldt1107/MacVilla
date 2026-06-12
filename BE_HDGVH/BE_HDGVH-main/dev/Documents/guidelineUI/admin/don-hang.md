# Admin — Đơn hàng (`/api/admin/orders`)

## Mục đích

Xử lý **đơn hàng nội bộ**: danh sách, chi tiết (theo ID hoặc mã đơn), tạo đơn hộ khách, cập nhật trạng thái đơn / thanh toán, hủy, gán sales. Kết hợp **fulfillment** (file `fulfillment.md`).

**Auth:** **StaffAuthenticated**.

**FE:** Swagger `/swagger`, OpenAPI `/swagger/v1/swagger.json`. Dưới đây là field JSON (camelCase).

## API


| Method | Path                                             | Mô tả                                             |
| ------ | ------------------------------------------------ | ------------------------------------------------- |
| GET    | `/api/admin/orders`                              | Danh sách phân trang + filter                     |
| GET    | `/api/admin/orders/{id}`                         | Chi tiết theo ID                                  |
| GET    | `/api/admin/orders/by-code/{orderCode}`          | Chi tiết theo mã đơn                              |
| POST   | `/api/admin/orders`                              | Tạo đơn (Sales tạo hộ khách)                      |
| PUT    | `/api/admin/orders/{id}/status`                  | Cập nhật trạng thái đơn                           |
| PUT    | `/api/admin/orders/{id}/payment-status`          | Cập nhật trạng thái thanh toán                    |
| POST   | `/api/admin/orders/{id}/cancel`                  | Hủy đơn (**ManagerOrAdmin**; giới hạn trạng thái) |
| PUT    | `/api/admin/orders/{id}/assign-sales`            | Gán nhân viên bán (**ManagerOrAdmin**)            |
| GET    | `/api/admin/orders/{id}/timeline`                | Timeline đơn (sự kiện thực từ DB)                 |
| GET    | `/api/admin/orders/by-code/{orderCode}/timeline` | Timeline theo mã                                  |
| GET    | `/api/admin/orders/statuses`                     | `OrderStatuses` + `PaymentStatuses`               |


### Response — `GET .../{id}/timeline` / `by-code/{orderCode}/timeline`

`data`: `AdminOrderTimelineDto`:


| Field                                        | Kiểu            | Ghi chú                       |
| -------------------------------------------- | --------------- | ----------------------------- |
| `orderId`, `orderCode`                       | number / string |                               |
| `currentOrderStatus`, `currentPaymentStatus` | string          | Trạng thái hiện tại           |
| `createdAt`                                  | ISO 8601        |                               |
| `events[]`                                   | array           | Xếp theo `timestamp` tăng dần |


Mỗi `events[]`:


| Field         | Kiểu     | Ghi chú                                                                             |
| ------------- | -------- | ----------------------------------------------------------------------------------- |
| `eventType`   | string   | `Order` / `Fulfillment` / `Payment` / `Invoice` / `TransferNotification` / `Return` |
| `status`      | string   | Nội dung theo loại (VD `Shipped`, `Payment`, `Verified`, `Approved`)                |
| `description` | string   | Text tiếng Việt cho UI                                                              |
| `timestamp`   | ISO 8601 |                                                                                     |
| `referenceId` | number   | null                                                                                |
| `notes`       | string   | null                                                                                |
| `actorName`   | string   | null                                                                                |


### Query — `GET .../orders`


| Param                | Mặc định | Ghi chú |
| -------------------- | -------- | ------- |
| `page`               | 1        |         |
| `pageSize`           | 20       |         |
| `orderStatus`        | —        |         |
| `paymentStatus`      | —        |         |
| `customerId`         | —        |         |
| `salesId`            | —        |         |
| `fromDate`, `toDate` | —        |         |
| `search`             | —        |         |


### Body — `POST .../orders`


| Field               | Kiểu   | Bắt buộc | Ghi chú                              |
| ------------------- | ------ | -------- | ------------------------------------ |
| `customerId`        | number | Có       |                                      |
| `shippingAddressId` | number | Có       | Địa chỉ giao của khách               |
| `paymentMethod`     | string | Có       | Theo domain / Swagger                |
| `voucherCode`       | string | Không    |                                      |
| `lines`             | array  | Có       | Mỗi phần tử: `variantId`, `quantity` |
| `note`              | string | Không    |                                      |


`**lines[]`:**


| Field       | Kiểu   | Bắt buộc |
| ----------- | ------ | -------- |
| `variantId` | number | Có       |
| `quantity`  | number | Có       |


```json
{
  "customerId": 12,
  "shippingAddressId": 8,
  "paymentMethod": "BankTransfer",
  "voucherCode": null,
  "lines": [
    { "variantId": 101, "quantity": 2 }
  ],
  "note": "Giao trong giờ HC"
}
```

*(Sales gán từ token — không cần gửi `salesId` trong body.)*

### Body — `PUT .../{id}/status`


| Field    | Kiểu   | Bắt buộc | Ghi chú                                                                                   |
| -------- | ------ | -------- | ----------------------------------------------------------------------------------------- |
| `status` | string | Có       | Luồng gợi ý: New → Confirmed → Processing → ReadyToShip → Shipped → Delivered → Completed |
| `note`   | string | Không    |                                                                                           |


```json
{
  "status": "Confirmed",
  "note": "Khách đã xác nhận qua điện thoại"
}
```

### Body — `PUT .../{id}/payment-status`


| Field           | Kiểu   | Bắt buộc | Ghi chú                       |
| --------------- | ------ | -------- | ----------------------------- |
| `paymentStatus` | string | Có       | Unpaid → PartiallyPaid → Paid |
| `note`          | string | Không    |                               |


```json
{
  "paymentStatus": "Paid",
  "note": "Chuyển kho đủ 100%"
}
```

### Body — `POST .../{id}/cancel`

Chỉ cho phép ở một số trạng thái đơn (xem Swagger / message lỗi).


| Field          | Kiểu   | Bắt buộc |
| -------------- | ------ | -------- |
| `cancelReason` | string | Không    |


```json
{
  "cancelReason": "Khách đổi ý, không lấy hàng"
}
```

### Body — `PUT .../{id}/assign-sales`


| Field     | Kiểu   | Bắt buộc |
| --------- | ------ | -------- |
| `salesId` | number | Có       |


```json
{
  "salesId": 5
}
```

---

## Luồng UI gợi ý

### A) Danh sách đơn

1. Filter preset: Hôm nay, Chưa thanh toán, Theo sales đăng nhập.
2. Quick search mã đơn → `by-code/{orderCode}`.

### B) Chi tiết đơn

1. Header: trạng thái đơn + thanh toán; timeline thay đổi (nếu BE trả lịch sử trong DTO).
2. Actions: đổi `status`, đổi `payment-status`, **Hủy** (confirm), **Gán sales**.
3. Section Fulfillment: link tạo phiếu `POST /orders/{id}/fulfillments`.

### C) Tạo đơn tại quầy

1. Chọn khách (`customerId`) + dòng hàng (variant, qty) theo DTO.
2. Submit → chi tiết đơn mới.

---

## UX tối ưu

- Disable nút Hủy khi trạng thái không hợp lệ (có thể prefetch `statuses`).
- Optimistic UI thận trọng với chuyển trạng thái — rollback nếu 400.
- In phiếu / export PDF (FE) nếu nghiệp vụ cần — không phụ thuộc API riêng.

