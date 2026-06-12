# Admin — Người dùng nội bộ & vai trò (`/api/admin/users`, `/api/Role`)

## Mục đích

- Quản lý **tài khoản nhân sự** (CRUD nhẹ, trạng thái, reset mật khẩu, dropdown role).
- Quản lý **Role** (CRUD) — route nằm ngoài prefix `admin` nhưng dùng chung cho cấu hình phân quyền admin.

**Auth:** **AdminOnly** cho CRUD / chi tiết / reset mật khẩu trên `users` và cho `Role`. **`GET /api/admin/users`** và **`GET /api/admin/users/roles`** dùng policy **`ManagerOrAdminOrStockManager`** (Admin + Manager + **StockManager**). `pageSize` danh sách user tối đa **500**.

**FE:** Swagger `/swagger`, OpenAPI `/swagger/v1/swagger.json`. Field JSON (camelCase).

---

## Phần 1 — Nhân sự (`/api/admin/users`)

| Method | Path | Mô tả |
| ------ | ---- | ----- |
| GET | `/api/admin/users` | Danh sách phân trang — **ManagerOrAdminOrStockManager** |
| GET | `/api/admin/users/{id}` | Chi tiết |
| POST | `/api/admin/users` | Tạo tài khoản |
| PUT | `/api/admin/users/{id}` | Cập nhật (fullName, email, phone, roleId) |
| PUT | `/api/admin/users/{id}/status` | Active / Inactive |
| PUT | `/api/admin/users/{id}/reset-password` | Reset mật khẩu |
| GET | `/api/admin/users/roles` | Danh sách role cho dropdown — **ManagerOrAdminOrStockManager** |
| GET | `/api/admin/users/statuses` | Trạng thái tài khoản |

### Query — `GET .../users`

| Param | Mặc định | Ghi chú |
| ----- | -------- | ------- |
| `page` | 1 | |
| `pageSize` | 20 | |
| `roleId` | — | |
| `status` | — | |
| `search` | — | |

### Body — `POST .../users`

| Field | Kiểu | Bắt buộc |
| ----- | ---- | -------- |
| `username` | string | Có |
| `password` | string | Có |
| `fullName` | string | Có |
| `email` | string | Không |
| `phone` | string | Không |
| `roleId` | number | Có |

```json
{
  "username": "nv.kho1",
  "password": "MatKhauTam123!",
  "fullName": "Trần Văn B",
  "email": "b@congty.vn",
  "phone": "0909111222",
  "roleId": 2
}
```

### Body — `PUT .../users/{id}`

Chỉ gửi field cần đổi:

| Field | Kiểu |
| ----- | ---- |
| `fullName` | string |
| `email` | string |
| `phone` | string |
| `roleId` | number |

```json
{
  "fullName": "Trần Văn B — kho chính",
  "roleId": 3
}
```

### Body — `PUT .../users/{id}/status`

| Field | Kiểu | Bắt buộc |
| ----- | ---- | -------- |
| `status` | string | Có | Active / Inactive |

```json
{
  "status": "Inactive"
}
```

### Body — `PUT .../users/{id}/reset-password`

| Field | Kiểu | Bắt buộc |
| ----- | ---- | -------- |
| `newPassword` | string | Có |

```json
{
  "newPassword": "MatKhauMoi456!"
}
```

---

## Phần 2 — Role (`/api/Role`)

Controller route: `api/[controller]` → **`/api/Role`** + tên action.

| Method | Path | Mô tả |
| ------ | ---- | ----- |
| GET | `/api/Role/GetAll` | Danh sách role |
| GET | `/api/Role/Get/{id}` | Chi tiết role |
| POST | `/api/Role/Create` | Tạo |
| PUT | `/api/Role/Update/{id}` | Cập nhật |
| DELETE | `/api/Role/Delete/{id}` | Xóa |

### Body — `POST /api/Role/Create`

| Field | Kiểu | Bắt buộc |
| ----- | ---- | -------- |
| `roleName` | string | Có |
| `description` | string | Không |
| `permissions` | string | Không | Chuỗi / JSON tùy triển khai BE |

```json
{
  "roleName": "Kho",
  "description": "Truy cập fulfillment & tồn kho",
  "permissions": null
}
```

### Body — `PUT /api/Role/Update/{id}`

Cùng các field với Create (`roleName`, `description`, `permissions`).

---

## Luồng UI gợi ý

### A) Onboarding nhân viên

1. POST user với `roleId` từ `GET .../users/roles`.
2. Gửi mật khẩu tạm qua kênh nội bộ (password do admin đặt trong `POST .../users`).

### B) Khóa tài khoản

1. `PUT .../status` → Inactive; user đó mất quyền đăng nhập (theo cách BE xử lý token).

### C) Cấu hình Role

1. Màn CRUD role tách biệt; sau khi đổi quyền, invalidate cache `roles` ở form user.

---

## UX tối ưu

- Không hiển thị hash mật khẩu; chỉ form reset có field mật khẩu mới.
- Confirm mạnh trước Delete role nếu còn user gắn role đó (BE có thể chặn).
- Ẩn menu Users/Role với non-admin.
