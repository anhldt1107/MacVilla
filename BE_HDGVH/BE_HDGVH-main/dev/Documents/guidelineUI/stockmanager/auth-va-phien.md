# Stock Manager — Đăng nhập & phiên (`/api/Auth`, `/api/me`)

## API

| Method | Path | Policy | Ghi chú |
| ------ | ---- | ------ | ------- |
| POST | `/api/Auth/login` | AllowAnonymous | Trả JWT staff |
| GET | `/api/Auth/me` | StaffAuthenticated | Thông tin từ JWT |
| GET | `/api/me` | StaffAuthenticated | Hồ sơ đầy đủ từ DB |

Chi tiết field: [../admin/auth-va-phien.md](../admin/auth-va-phien.md).

## Kiểm tra role

`data.user.roleName` phải là `StockManager`. Nếu khác → dẫn user về workspace tương ứng (Worker / Manager / Sales / Admin).

## Header mọi request

```
Authorization: Bearer <accessToken>
Content-Type: application/json
Accept: application/json
```

- **401** → token hết hạn / chưa login.
- **403 FORBIDDEN** → endpoint thuộc `AdminOnly` hoặc `ManagerOrAdmin` (xem [README.md](./README.md)).
