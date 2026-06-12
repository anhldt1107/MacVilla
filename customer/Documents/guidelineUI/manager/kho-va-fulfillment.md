# Manager — Kho & fulfillment

## Phạm vi

Manager thuộc policy **WarehouseStaff** → dùng được toàn bộ API kho như StockManager/Worker: phiếu xuất, giao dịch kho, chỉnh tồn. Field đầy đủ: [../admin/fulfillment.md](../admin/fulfillment.md), [../admin/giao-dich-kho.md](../admin/giao-dich-kho.md), [../admin/bien-the-va-ton-kho.md](../admin/bien-the-va-ton-kho.md).

## API

### Fulfillment — `/api/admin/fulfillments`, `/api/admin/orders/{orderId}/fulfillments`

| Method | Path |
| ------ | ---- |
| GET | `/api/admin/fulfillments?status&orderId&assignedWorkerId` |
| GET | `/api/admin/fulfillments/{id}` |
| POST | `/api/admin/orders/{orderId}/fulfillments` |
| PUT | `/api/admin/fulfillments/{id}/status` |
| PUT | `/api/admin/fulfillments/{id}/assign` |
| GET | `/api/admin/fulfillments/statuses` |

Chuỗi status: `Pending → Picking → Packed → Shipped` (hoặc `Cancelled`). Khi phiếu → `Shipped`, BE tự đẩy đơn `ReadyToShip → Shipped`.

### Giao dịch kho — `/api/admin/inventory-transactions`

| Method | Path | Ghi chú |
| ------ | ---- | ------- |
| GET | `/api/admin/inventory-transactions?variantId&type&fromDate&toDate` | Lịch sử IN/OUT/ADJUST/RESERVE/RELEASE |
| GET | `/api/admin/inventory-transactions/{id}` | |
| POST | `/api/admin/inventory-transactions` | Ghi nhận giao dịch (nhập/xuất/điều chỉnh) |

Manager thường là người **điều chỉnh (ADJUST)** khi kiểm kê; log `reason` rõ để audit.

### Tồn theo variant — `/api/admin/products/{pid}/variants/{vid}/inventory`

| Method | Path | Ghi chú |
| ------ | ---- | ------- |
| GET | `.../inventory` | Xem tồn hiện tại |
| PUT | `.../inventory` | Set tồn (thay trực tiếp) |
| POST | `.../inventory` | Thường là ADJUST có lý do |

## Luồng UI

### A) Từ cảnh báo tồn thấp ([bao-cao.md](./bao-cao.md))

1. Click SKU → mở màn tồn → `GET /variants/{vid}/inventory`.
2. **Nhập thêm**: `POST /inventory-transactions` type `IN`, kèm `quantity`, `reason`.

### B) Kiểm kê & ADJUST

1. Form kiểm kê: chọn SKU → so sánh số thực vs hệ thống → `POST /inventory-transactions` type `ADJUST` với `quantity` (delta) + lý do bắt buộc.
2. Refresh `QuantityOnHand` / `QuantityAvailable`.

### C) Điều phối phiếu xuất

1. Manager xem hàng đợi `status=Pending`, gán Worker bằng `PUT /fulfillments/{id}/assign` (lấy list Worker từ [nhan-su-va-phan-cong.md](./nhan-su-va-phan-cong.md)).
2. Theo dõi tiến trình → đơn tự `Shipped` khi phiếu cuối chuyển `Shipped`.

## UX

- Bảng giao dịch kho hiển thị `type`, `quantity`, `reason`, `createdBy` để audit.
- Cảnh báo khi ADJUST làm `QuantityAvailable` âm.
- Link cross: phiếu xuất → đơn → khách → KPI Sales.
