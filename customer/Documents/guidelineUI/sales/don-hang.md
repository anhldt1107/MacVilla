# Sales — Đơn hàng (`/api/admin/orders`)

## Mục đích

Sales **theo dõi đơn** do mình tạo (từ convert báo giá hoặc tạo hộ khách), **hỗ trợ khách** về trạng thái, **hủy** khi được phép. Bước kho, giao hàng thuộc **WarehouseStaff** ([../admin/fulfillment.md](../admin/fulfillment.md)).

**Auth:** **StaffAuthenticated**.

Bảng field đầy đủ: [../admin/don-hang.md](../admin/don-hang.md).

## API Sales sử dụng

| Method | Path | Sales dùng khi |
| ------ | ---- | -------------- |
| GET | `/api/admin/orders?salesId=<me>&orderStatus&paymentStatus&customerId&search` | Bảng đơn của mình |
| GET | `/api/admin/orders/{id}`, `/by-code/{orderCode}` | Chi tiết |
| POST | `/api/admin/orders` | Tạo đơn hộ khách (ít dùng — thường convert từ báo giá) |
| POST | `/api/admin/orders/{id}/cancel` | Hủy đơn khi còn được phép (VD trước khi `Processing`) |
| GET | `/api/admin/orders/{id}/timeline`, `/by-code/{orderCode}/timeline` | Timeline đơn để trả lời khách nhanh |
| GET | `/api/admin/orders/statuses` | Tải `OrderStatuses` + `PaymentStatuses` |

**Thận trọng / thường thuộc Manager hoặc Warehouse:**

- `PUT /api/admin/orders/{id}/status` — cập nhật trạng thái đơn. Với workflow chuẩn: trạng thái được BE đồng bộ theo **fulfillment** (kho cập nhật phiếu → đơn chuyển **Shipped**). Sales **không** nên tự đẩy `Processing → Shipped → Delivered`. Có thể giữ nút cho Manager, ẩn với Sales.
- `PUT /api/admin/orders/{id}/payment-status` — thường kế toán / Manager.
- `PUT /api/admin/orders/{id}/assign-sales` — Manager phân công Sales.

## Luồng UI

1. **“Đơn của tôi”** (`salesId=<me>`), tab `New`/`Confirmed`/`Processing`/`ReadyToShip`/`Shipped`/`Delivered`/`Completed`/`Cancelled`.
2. Mở chi tiết → xem `lines`, `shippingAddress`, `paymentStatus`, timeline.
3. Khách nhờ huỷ → kiểm `OrderStatuses.CanCancel` (hoặc thử gọi và xử lý lỗi 409) → `POST /cancel` với lý do.
4. Khách hỏi tình hình: show timeline + trạng thái phiếu xuất nếu có (read từ chi tiết đơn).
5. Sau khi **Delivered**: hỗ trợ hậu mãi (liên hệ bộ phận BH / đổi trả — ngoài phạm vi Sales chính).

## UX

- Ẩn nút `Cập nhật trạng thái` / `Cập nhật thanh toán` nếu vai trò là Sales; hiện chỉ ở vai trò Manager.
- Cảnh báo khi hủy đơn đã có hóa đơn / giao dịch thanh toán (BE sẽ báo lỗi nghiệp vụ — hiển thị thân thiện).
- Liên kết sang [thanh-toan-va-cong-no.md](./thanh-toan-va-cong-no.md) để xem thanh toán của đơn.
