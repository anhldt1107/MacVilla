# Customer — Đơn của tôi (`/api/store/me/orders`)

Auth: **CustomerAuthenticated**.

## API


| Method | Path                                        | Mô tả                                      |
| ------ | ------------------------------------------- | ------------------------------------------ |
| GET    | `/api/store/me/orders`                      | Phân trang đơn của khách                   |
| GET    | `/api/store/me/orders/{orderCode}`          | Chi tiết đơn                               |
| GET    | `/api/store/me/orders/{orderCode}/timeline` | Timeline sự kiện                           |
| POST   | `/api/store/me/orders/{orderCode}/cancel`   | Khách tự hủy đơn (khi cho phép)            |
| POST   | `/api/store/me/orders/{orderCode}/reorder`  | Đặt lại đơn cũ (thêm SKU vào giỏ hiện tại) |


### Response chi tiết đơn (`StoreOrderDetailDto`)

| Field | Kiểu | Ghi chú |
| ----- | ---- | ------- |
| `orderCode` | string | |
| `createdAt` | ISO 8601 | |
| `orderStatus` | string | `New / AwaitingPayment / Confirmed / Processing / ReadyToShip / Shipped / Delivered / Completed / Cancelled` |
| `paymentStatus` | string | VD `Unpaid / Paid / PartiallyPaid / Refunded` |
| `paymentMethod` | string \| null | |
| `voucherCode` | string \| null | |
| `shippingAddress` | `StoreOrderShippingAddressDto` \| null | `id`, `receiverName`, `receiverPhone`, `addressLine` |
| `lines[]` | array | Chi tiết bên dưới |
| `merchandiseSubtotal`, `discountAmount`, `payableTotal` | number | |

`lines[]` (`StoreOrderDetailLineDto`):

| Field | Kiểu |
| ----- | ---- |
| `variantId` | number |
| `skuSnapshot` | string \| null |
| `quantity`, `unitPrice`, `subTotal` | number |

### Timeline — `GET /{orderCode}/timeline` (`StoreOrderTimelineDto`)


| Field                                                     | Kiểu                        |
| --------------------------------------------------------- | --------------------------- |
| `orderCode`, `currentOrderStatus`, `currentPaymentStatus` | string                      |
| `createdAt`                                               | ISO 8601                    |
| `events[]`                                                | mảng (xếp theo `timestamp`) |


Mỗi event (`StoreOrderTimelineEventDto`):


| Field         | Kiểu          | Ghi chú                                                    |
| ------------- | ------------- | ---------------------------------------------------------- |
| `eventType`   | string        | `Order` / `Fulfillment` / `Payment` / `Invoice` / `Return` |
| `status`      | string        | Nội dung theo loại                                         |
| `description` | string        | Text tiếng Việt                                            |
| `timestamp`   | ISO 8601      | Thời gian thực (không phải mock)                           |
| `referenceId` | number | null | ID phiếu / HĐ / giao dịch / đơn đổi trả                    |
| `notes`       | string | null | `referenceCode` / tổng tiền…                               |


### Hủy đơn — `POST /{orderCode}/cancel`

Body `StoreOrderCancelDto`:

```json
{ "cancelReason": "Đổi ý không mua nữa" }
```

- Chỉ cho phép khi `orderStatus` ∈ `New, AwaitingPayment, Confirmed, Processing, ReadyToShip` (`OrderStatuses.CanCancel`).
- Nếu trạng thái khác → BE trả **409 CONFLICT**.

Response: `StoreOrderDetailDto` sau khi chuyển `Cancelled`.

### Reorder — `POST /{orderCode}/reorder`

Thêm các SKU còn đủ điều kiện từ đơn cũ vào giỏ hiện tại.

Response `StoreOrderReorderResponseDto`:


| Field            | Kiểu                                                                                                        |
| ---------------- | ----------------------------------------------------------------------------------------------------------- |
| `addedItems[]`   | `{ variantId, sku, quantity }`                                                                              |
| `skippedItems[]` | `{ variantId, sku, requestedQuantity, reason }` — lý do VD "Hết tồn kho", "Sản phẩm ngừng bán", "Chỉ còn X" |
| `message`        | string                                                                                                      |


## Luồng UI

1. Tab **Đơn của tôi**: `GET /me/orders` — list, chip trạng thái.
2. Mở chi tiết → `GET /{orderCode}` + tab **Timeline** (`/timeline`).
3. Nút **Hủy đơn** (chỉ hiện khi `orderStatus` cho phép) → dialog nhập lý do → `POST /cancel`.
4. Nút **Đặt lại** → `POST /reorder` → toast thông báo số SKU thêm vào giỏ + skipped; điều hướng đến [gio-hang.md](./gio-hang.md).
5. Nếu có phiếu bảo hành / đổi trả liên quan → timeline hiện sự kiện; click sẽ dẫn sang [bao-hanh.md](./bao-hanh.md), [doi-tra-hang.md](./doi-tra-hang.md).

## UX

- Badge màu theo `orderStatus` + `paymentStatus`.
- Disable các nút không hợp lệ theo `OrderStatuses.CanCancel`.
- Hiển thị `skippedItems` rõ để khách tự chỉnh thêm vào giỏ.

