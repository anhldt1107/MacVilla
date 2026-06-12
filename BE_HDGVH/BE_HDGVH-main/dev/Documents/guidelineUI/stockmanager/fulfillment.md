# Stock Manager — Phiếu xuất kho (`/api/admin/fulfillments`)

Auth: **WarehouseStaff**.

Field DTO đầy đủ: [../admin/fulfillment.md](../admin/fulfillment.md).

## API


| Method | Path                                                                    | Mô tả                                                 |
| ------ | ----------------------------------------------------------------------- | ----------------------------------------------------- |
| GET    | `/api/admin/fulfillments?page&pageSize&status&orderId&assignedWorkerId` | List phiếu                                            |
| GET    | `/api/admin/fulfillments/{id}`                                          | Chi tiết                                              |
| POST   | `/api/admin/orders/{orderId}/fulfillments`                              | Tạo phiếu cho 1 đơn                                   |
| PUT    | `/api/admin/fulfillments/{id}/status`                                   | Pending → Picking → Packed → Shipped (hoặc Cancelled) |
| PUT    | `/api/admin/fulfillments/{id}/assign`                                   | Gán Worker                                            |
| GET    | `/api/admin/fulfillments/statuses`                                      | `FulfillmentStatuses.All`                             |


### Quy luật trạng thái — `FulfillmentStatuses.CanTransition`

```
Pending  → Picking | Cancelled
Picking  → Packed  | Cancelled
Packed   → Shipped | Cancelled
```

Khi phiếu chuyển **Shipped** → BE tự đẩy đơn `ReadyToShip → Shipped`.

---

## Luồng UI

### A) Hàng đợi tạo phiếu

1. Lấy đơn `Confirmed` từ `GET /api/admin/orders?orderStatus=Confirmed` (Staff policy).
2. Mở chi tiết đơn → nút **Tạo phiếu xuất** → `POST /orders/{orderId}/fulfillments` (body theo [admin/fulfillment.md](../admin/fulfillment.md)).
3. Tự gán Worker hoặc gán sau ở bước B.

### B) Phân công Worker

1. Gọi `GET /api/admin/staff-directory?role=Worker&status=Active` — `/staff-directory` đã mở cho `WarehouseStaff`, StockManager dùng được (xem [nhan-su.md](./nhan-su.md)).
2. Chọn user trong dropdown → `PUT /fulfillments/{id}/assign` body `{ "workerId": <id> }`.
3. Có thể tái sử dụng `GET /staff-directory?role=Worker` cho filter list phiếu theo Worker (`?assignedWorkerId=<id>`).

### C) Theo dõi tiến độ

1. List phiếu lọc `status` (Pending / Picking / Packed / Shipped).
2. Filter `assignedWorkerId=<userId>` để xem theo từng Worker.
3. Khi Worker hoàn tất 1 bước → status tự cập nhật; Stock chỉ giám sát.
4. Hủy phiếu khi cần: `PUT /status` về `Cancelled` (hợp lệ Pending/Picking/Packed → Cancelled).

### D) Đối chiếu với giao dịch kho

- Sau khi phiếu `Shipped`, kiểm `GET /api/admin/inventory-transactions?referenceType=Order&referenceId=<orderId>` → xem các OUT/RELEASE đã ghi.

## UX

- Badge màu theo `status` (Pending = xám, Picking = vàng, Packed = xanh dương, Shipped = xanh lá, Cancelled = đỏ).
- Disable nút transition không hợp lệ.
- Hiển thị `assignedWorker.fullName` (nếu API trả).
- Cảnh báo nếu phiếu đã `Picking` quá lâu (client tự tính).

