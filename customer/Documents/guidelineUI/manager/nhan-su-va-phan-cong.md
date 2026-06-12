# Manager — Nhân sự & phân công (`/api/admin/staff-directory`, …)

## Mục đích

Manager **không quản lý user** (role `AdminOnly`), nhưng cần **xem danh sách nhân sự** để phân công Sales, Worker, đọc tên người xử lý trên các view.

Field đầy đủ: [../admin/nhan-su-directory.md](../admin/nhan-su-directory.md).

## Endpoint Manager dùng

| Method | Path | Policy |
| ------ | ---- | ------ |
| GET | `/api/admin/staff-directory?role&status&search` | ManagerOrAdmin |
| PUT | `/api/admin/orders/{id}/assign-sales` | ManagerOrAdmin |
| PUT | `/api/admin/fulfillments/{id}/assign` | WarehouseStaff (Manager thuộc whitelist) |

## Luồng UI

### A) Gán Sales cho đơn

1. Dialog **“Gán Sales”** → `GET /staff-directory?role=Sales&status=Active`.
2. Chọn user → `PUT /api/admin/orders/{id}/assign-sales` với body chứa `salesId` (xem [../admin/don-hang.md](../admin/don-hang.md)).

### B) Gán Worker cho phiếu xuất

1. `GET /staff-directory?role=Worker&status=Active`.
2. `PUT /api/admin/fulfillments/{id}/assign` với `workerId`.

### C) Xem đội ngũ Sales + KPI

Kết hợp `GET /staff-directory?role=Sales` + `GET /api/admin/reports/top-sales` → nối theo `salesId` cho bảng KPI.

## Không được làm qua endpoint này

- Tạo / sửa / đổi mật khẩu user — dùng màn hình Admin (`/api/admin/users`, `AdminOnly`).
- Tạo role mới (`/api/admin/roles`, `AdminOnly`).
