# Manager — Điều phối đơn (`/api/admin/orders`)

## Mục đích

Manager **điều phối** đơn: gán Sales, hủy đơn, theo dõi trạng thái, đẩy trạng thái thủ công khi cần (thường chỉ khi khác với luồng fulfillment tự đồng bộ). Soạn đơn / tra cứu: [../admin/don-hang.md](../admin/don-hang.md).

## Endpoint Manager dùng


| Method | Path                                                                                    | Policy             | Ghi chú                                                                                        |
| ------ | --------------------------------------------------------------------------------------- | ------------------ | ---------------------------------------------------------------------------------------------- |
| GET    | `/api/admin/orders?salesId&customerId&orderStatus&paymentStatus&fromDate&toDate&search` | Staff              |                                                                                                |
| GET    | `/api/admin/orders/{id}`, `/by-code/{orderCode}`                                        | Staff              |                                                                                                |
| POST   | `/api/admin/orders`                                                                     | Staff              | Tạo đơn hộ khách (ít dùng; thường convert từ báo giá)                                          |
| PUT    | `/api/admin/orders/{id}/status`                                                         | Staff              | Cập nhật trạng thái — **tuân thủ `OrderStatuses.CanTransition`**                               |
| PUT    | `/api/admin/orders/{id}/payment-status`                                                 | Staff              | Cập nhật `paymentStatus`                                                                       |
| POST   | `/api/admin/orders/{id}/cancel`                                                         | **ManagerOrAdmin** | Hủy đơn (chỉ `New`, `AwaitingPayment`, `Confirmed`, `Processing`, `ReadyToShip`)               |
| PUT    | `/api/admin/orders/{id}/assign-sales`                                                   | **ManagerOrAdmin** | Gán Sales (lấy list từ [nhan-su-va-phan-cong.md](./nhan-su-va-phan-cong.md))                   |
| GET    | `/api/admin/orders/{id}/timeline`, `/by-code/{orderCode}/timeline`                      | Staff              | Timeline đơn (events: Order / Fulfillment / Payment / Invoice / TransferNotification / Return) |
| GET    | `/api/admin/orders/statuses`                                                            | Staff              |                                                                                                |


## Luồng UI

### A) Phân công Sales

1. Dashboard có card **“Đơn chưa có Sales”** (`GET /orders?...&salesId=` filter null phía FE hoặc tự xử).
2. Mở chi tiết → nút **Gán Sales** → dropdown từ `GET /api/admin/staff-directory?role=Sales` → `PUT /assign-sales`.

### B) Hủy đơn

1. Nút **Hủy** chỉ hiện khi `orderStatus` nằm trong whitelist (`OrderStatuses.CanCancel`).
2. Dialog yêu cầu nhập `cancelReason`; BE sẽ kiểm tra và báo 409 nếu đã có thanh toán / giao.

### C) Theo dõi chuỗi trạng thái

- Luồng chuẩn: `New / AwaitingPayment → Confirmed → Processing → ReadyToShip → Shipped → Delivered → Completed`.
- Đẩy thủ công qua `/status` chỉ trong trường hợp ngoại lệ (VD fulfillment chưa kịp cập nhật nhưng đã nhận tiền mặt) — hiện luồng Fulfillment **tự chuyển đơn Shipped** khi phiếu xuất chuyển `Shipped` ([kho-va-fulfillment.md](./kho-va-fulfillment.md)).

### D) Cập nhật trạng thái thanh toán

- Cảnh báo double-book: nếu đã có `PaymentTransaction` đủ amount, để BE tự cập nhật HĐ → Paid; Manager không nên override trừ khi sửa lỗi.

## UX

- Chip trạng thái đơn + thanh toán rõ ràng.
- Ẩn nút không hợp lệ theo `CanTransition`.
- Link sang [hoa-don-va-thanh-toan.md](./hoa-don-va-thanh-toan.md) từ chi tiết đơn.

