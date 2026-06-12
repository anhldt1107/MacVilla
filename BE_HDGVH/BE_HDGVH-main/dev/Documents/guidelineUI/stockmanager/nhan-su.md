# Stock Manager — Nhân sự & phân công (`/api/admin/staff-directory`)

Auth: **WarehouseStaff** (Admin / Manager / StockManager / Worker). Read-only danh sách nhân sự để Stock Manager phân công Worker cho phiếu xuất.

Field đầy đủ: [../admin/nhan-su-directory.md](../admin/nhan-su-directory.md).

## API


| Method | Path                                            |
| ------ | ----------------------------------------------- |
| GET    | `/api/admin/staff-directory?role&status&search` |


### Query


| Param    | Ghi chú                                               |
| -------- | ----------------------------------------------------- |
| `role`   | `Worker`, `StockManager`, `Manager`, `Sales`, `admin` |
| `status` | `Active`, `Inactive`                                  |
| `search` | Tìm theo `username`, `fullName`, `email`, `phone`     |


### Response `data` — mảng `AdminStaffDirectoryItemDto`


| Field                        | Kiểu            |
| ---------------------------- | --------------- |
| `id`, `username`, `fullName` | number / string |
| `email`, `phone`             | string | null   |
| `roleName`                   | string          |
| `status`                     | string          |


## Luồng UI

### A) Gán Worker cho phiếu xuất

1. Mở phiếu cần gán ở [fulfillment.md](./fulfillment.md).
2. Dropdown "Chọn Worker" → `GET /api/admin/staff-directory?role=Worker&status=Active`.
3. Chọn user → `PUT /api/admin/fulfillments/{id}/assign` body `{ "workerId": <id> }`.

### B) Tra cứu người xử lý trên view

- Tên `processedByUser`, `createdByUser` hay tương tự trong các response (fulfillment, warranty, inventory transaction) có thể chưa join kèm `fullName`. Khi cần hiển thị tên từ `workerIdAssigned` hoặc `assignedWorkerId`: gọi staff-directory 1 lần và cache theo `id`.

### C) Xem đội Stock / phối hợp

- `GET /staff-directory?role=StockManager` để biết ai là StockManager khác (ví dụ ca sau).
- `GET /staff-directory?role=Manager` để biết Manager phê duyệt đổi/trả.

## UX

- Ẩn nhân sự `status != Active` mặc định; cho toggle hiển thị.
- Cache theo role trong session (ít đổi).
- Không có chỉnh sửa — mọi thay đổi user thuộc `AdminOnly` ([../admin/nguoi-dung-va-vai-tro.md](../admin/nguoi-dung-va-vai-tro.md)).
- Sales role **không** vào được endpoint này (không thuộc `WarehouseStaff`).

