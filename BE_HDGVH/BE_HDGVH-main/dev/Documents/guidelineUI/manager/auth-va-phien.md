# Manager — Đăng nhập & phiên (`/api/Auth`, `/api/me`)

## API


| Method | Path              | Policy             | Ghi chú            |
| ------ | ----------------- | ------------------ | ------------------ |
| POST   | `/api/Auth/login` | AllowAnonymous     | Trả JWT staff      |
| GET    | `/api/Auth/me`    | StaffAuthenticated | Thông tin từ JWT   |
| GET    | `/api/me`         | StaffAuthenticated | Hồ sơ đầy đủ từ DB |


Chi tiết field: [../admin/auth-va-phien.md](../admin/auth-va-phien.md).

## Kiểm tra role

`data.user.roleName` phải là `Manager`. Dẫn vào workspace Manager chỉ khi đúng role (hoặc `admin` mở rộng).

## Header mọi request

```
Authorization: Bearer <accessToken>
Content-Type: application/json
Accept: application/json
```

- **401** → token hết hạn.
- **403 FORBIDDEN** → endpoint thuộc `AdminOnly` (Manager không có), xem [README.md](./README.md).

