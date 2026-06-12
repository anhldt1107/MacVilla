# Admin — Staff directory (`/api/admin/staff-directory`)

## Mục đích

Read-only danh sách nhân sự nội bộ cho **Manager / Admin** dùng để **phân công Sales / Worker**, hiển thị người xử lý trên các view, hoặc tổng hợp KPI. Không sửa được ở endpoint này — quản lý user đầy đủ thuộc `AdminOnly` ([nguoi-dung-va-vai-tro.md](./nguoi-dung-va-vai-tro.md)).

**Auth:** **ManagerOrAdmin**.

## API

| Method | Path |
| ------ | ---- |
| GET | `/api/admin/staff-directory` |

### Query

| Param | Ghi chú |
| ----- | ------- |
| `role` | Tên role (`Sales`, `Manager`, `StockManager`, `Worker`, `admin`) |
| `status` | `Active`, `Inactive`, … (theo hệ thống) |
| `search` | Tìm theo `username`, `fullName`, `email`, `phone` |

### `data` — mảng

| Field | Kiểu |
| ----- | ---- |
| `id`, `username`, `fullName` | number / string |
| `email`, `phone` | string \| null |
| `roleName` | string |
| `status` | string |

## Luồng UI gợi ý

- Dialog **Gán Sales cho đơn**: `GET /staff-directory?role=Sales&status=Active` → dropdown → `PUT /api/admin/orders/{id}/assign-sales`.
- Dialog **Gán worker phiếu xuất**: `role=Worker` → `PUT /api/admin/fulfillments/{id}/assign`.
- Autocomplete xử lý đổi trả / warranty.

## UX

- Cache list staff theo role trong session (ít đổi).
- Ẩn nhân sự `status != Active` mặc định; cho toggle.
