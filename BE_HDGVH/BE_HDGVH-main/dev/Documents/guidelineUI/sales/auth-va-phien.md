# Sales — Đăng nhập & phiên (`/api/Auth`, `/api/me`)

## Mục đích

Nhân viên **Sales** đăng nhập bằng tài khoản staff, nhận JWT và gọi các API admin trong phạm vi cho phép (xem [README.md](./README.md)).

## API

| Method | Path | Policy | Ghi chú |
| ------ | ---- | ------ | ------- |
| POST | `/api/Auth/login` | AllowAnonymous | Trả JWT staff |
| GET | `/api/Auth/me` | StaffAuthenticated | Thông tin từ JWT (không query DB) |
| GET | `/api/me` | StaffAuthenticated | Hồ sơ đầy đủ từ DB |

Chi tiết field body/response giống cho toàn bộ staff: [../admin/auth-va-phien.md](../admin/auth-va-phien.md).

## Kiểm tra role sau login

`data.user.roleName` (hoặc claim `role` trong JWT) **phải** là `Sales` cho tài khoản Sales. FE nên:

1. Dựa vào `roleName` để quyết định menu / route “Sales workspace”.
2. Nếu `roleName !== "Sales"` nhưng token vẫn hợp lệ, có thể là user Manager/Admin — dẫn về workspace tương ứng thay vì Sales.

## Header mọi request

```
Authorization: Bearer <accessToken>
Content-Type: application/json
Accept: application/json
```

Nếu server trả **401**: JWT thiếu/hết hạn → refresh hoặc yêu cầu đăng nhập lại.  
Nếu **403 FORBIDDEN**: đủ token staff nhưng thiếu quyền (endpoint `AdminOnly` / `WarehouseStaff`) — xem [README.md](./README.md).
