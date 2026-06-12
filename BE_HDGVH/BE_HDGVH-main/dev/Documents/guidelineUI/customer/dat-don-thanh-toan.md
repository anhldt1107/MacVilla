# Customer — Đặt đơn & thanh toán (`/api/store/orders`, `/api/store/payments/payos`)

Auth: **CustomerAuthenticated**.

## API


| Method | Path                                | Ghi chú                                                    |
| ------ | ----------------------------------- | ---------------------------------------------------------- |
| POST   | `/api/store/orders/preview`         | Xem trước tổng tiền + giảm giá + tồn kho; **không** ghi DB |
| POST   | `/api/store/orders`                 | Đặt đơn từ giỏ (clear giỏ khi thành công)                  |
| POST   | `/api/store/payments/payos/create`  | Tạo link PayOS cho đơn đã có (nếu chọn PayOS)              |
| POST   | `/api/store/payments/payos/webhook` | Callback PayOS (Anonymous)                                 |


### Body — `POST /orders/preview` và `POST /orders`

`StoreOrderCheckoutDto`:


| Field               | Kiểu   | Bắt buộc (preview / create)                                 |
| ------------------- | ------ | ----------------------------------------------------------- |
| `shippingAddressId` | number | Optional / **Required**                                     |
| `paymentMethod`     | string | Optional / **Required** — VD `COD`, `PayOS`, `BankTransfer` |
| `voucherCode`       | string | Optional                                                    |


Preview response `StoreOrderPreviewResponseDto`:


| Field                                                   | Kiểu                                                                                          |
| ------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| `lines[]`                                               | `StoreOrderPreviewLineDto` (sku, productName, variantName, quantity, unitPrice, lineSubtotal) |
| `merchandiseSubtotal`, `discountAmount`, `payableTotal` | number                                                                                        |
| `voucherId`, `voucherCode`                              | nullable                                                                                      |


Create response: `StoreOrderDetailDto` — gồm `orderCode`, `orderStatus` (`New` / `AwaitingPayment` nếu PayOS), `paymentStatus`, `shippingAddress`, `lines`, tổng tiền.

### PayOS flow

1. `POST /orders` với `paymentMethod=PayOS` → đơn ở `OrderStatus: AwaitingPayment`, chưa có link.
2. `POST /payments/payos/create` → nhận `checkoutUrl`.
3. Khách thanh toán trên trang PayOS → PayOS POST webhook về BE → BE cập nhật `paymentStatus`.
4. FE poll `GET /api/store/me/orders/{orderCode}` hoặc redirect sau khi PayOS success → thấy `paymentStatus=Paid`, `orderStatus=Confirmed`.

#### Body — `POST /payments/payos/create` (`StorePayOsCreatePaymentDto`)

| Field | Kiểu | Bắt buộc | Ghi chú |
| ----- | ---- | -------- | ------- |
| `orderCode` | string | Có | Mã hiển thị đơn (VD `ORD-2026-...`) |
| `returnUrl` | string | Không | Override `returnUrl` cấu hình |
| `cancelUrl` | string | Không | Override `cancelUrl` cấu hình |

```json
{ "orderCode": "ORD-2026-0123" }
```

#### Response `data` (`StorePayOsCreatePaymentResponseDto`)

| Field | Kiểu | Ghi chú |
| ----- | ---- | ------- |
| `orderCode` | string | |
| `payOsOrderCode` | number | Mã PayOS (số) |
| `amount` | number | Tổng tiền (long, đơn vị VND) |
| `checkoutUrl` | string | URL redirect khách thanh toán |
| `paymentLinkId` | string \| null | |
| `linkExpiresAtUtc` | ISO 8601 \| null | |

**Idempotent:** gọi lại với cùng `orderCode` khi link chưa hết hạn sẽ trả cùng `checkoutUrl`. Nếu đơn không `AwaitingPayment` hoặc `paymentMethod != PayOS` → **409 CONFLICT**.

## Luồng UI

1. Trang **Checkout**: chọn địa chỉ, `paymentMethod`, nhập `voucherCode` → `POST /preview`.
2. Nút **Đặt hàng** → `POST /orders`. Xoá giỏ phía client.
3. Nếu PayOS → `POST /payos/create` → redirect `checkoutUrl`. Nếu COD → hiển thị cảm ơn.
4. Redirect return từ PayOS: mở trang **Cảm ơn** với `orderCode` → `GET /me/orders/{orderCode}`.

## UX

- Preview **không lock tồn**; race-condition được BE kiểm tra lại khi create (báo 400 nếu hết tồn).
- Double-submit guard cho nút Đặt hàng.
- Khi PayOS cancel / fail → cho phép đổi phương thức → có thể gọi lại `/payos/create` nếu đơn vẫn `AwaitingPayment`.

