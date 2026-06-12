# Manager — Nhân sự & phân công (`/api/admin/staff-directory`, …)

## Mục đích

Manager **không tạo/sửa/khóa/reset mật khẩu user** (các API đó `AdminOnly`), nhưng có **`GET /api/admin/users`** (phân trang, `pageSize` tối đa 500) và **`GET /api/admin/users/roles`** để xem nhân sự / dropdown role (cùng policy **`ManagerOrAdminOrStockManager`** với StockManager); đồng thời dùng **staff-directory** để phân công Sales, Worker.

Field đầy đủ: [../admin/nhan-su-directory.md](../admin/nhan-su-directory.md).

## Endpoint Manager dùng

| Method | Path | Policy |
| ------ | ---- | ------ |
| GET | `/api/admin/staff-directory?role&status&search` | WarehouseStaff (Admin/Manager/StockManager/Worker) |
| GET | `/api/admin/users` | ManagerOrAdminOrStockManager — danh sách nhân sự (phân trang, filter) |
| GET | `/api/admin/users/roles` | ManagerOrAdminOrStockManager — danh sách **role** (id + tên) cho dropdown |
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

- Tạo / sửa / đổi mật khẩu user — vẫn chỉ màn Admin (`POST/PUT` trên `/api/admin/users`, **AdminOnly**).
- Tạo role mới (`/api/admin/roles`, `AdminOnly`).
