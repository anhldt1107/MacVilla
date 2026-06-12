# Admin — Xác thực & phiên (`/api/Auth`, `/api/me`)

## Mục đích

Đăng nhập **nhân viên / admin** cho panel nội bộ, lấy **JWT** và **thông tin user**: `GET /api/Auth/me` (từ claims JWT, không DB), `GET /api/me` (hồ sơ + quyền từ DB). Phân quyền chi tiết theo policy trên từng endpoint admin (xem từng file hạng mục).

**FE:** Swagger `/swagger`, OpenAPI `/swagger/v1/swagger.json`. Field JSON (camelCase).

## API


| Method | Path              | Mô tả                                      |
| ------ | ----------------- | ------------------------------------------ |
| POST   | `/api/Auth/login` | Đăng nhập staff → JWT                      |
| GET    | `/api/Auth/me`    | User hiện tại (từ token)                   |
| GET    | `/api/me`         | Alias / bổ sung profile (theo cấu hình BE) |


### Body — `POST /api/Auth/login`

| Field | Kiểu | Bắt buộc | Ghi chú |
| ----- | ---- | -------- | ------- |
| `username` | string | Có | Max 100 |
| `password` | string | Có | |

```json
{
  "username": "admin",
  "password": "123456"
}
```

### Response — `data` khi đăng nhập thành công

Envelope `ResponseDto`; `data` là object:

| Field | Kiểu | Ghi chú |
| ----- | ---- | ------- |
| `accessToken` | string | JWT |
| `expiresAtUtc` | string (ISO 8601) | Thời điểm hết hạn token |
| `user` | object | `id`, `username`, `fullName`, `roleName` |

```json
{
  "accessToken": "eyJhbGciOi...",
  "expiresAtUtc": "2026-04-18T12:00:00+00:00",
  "user": {
    "id": 1,
    "username": "admin",
    "fullName": "Quản trị",
    "roleName": "Admin"
  }
}
```

FE lưu `accessToken` (memory / secure storage theo policy).

### Header — mọi request sau đăng nhập


| Header          | Ghi chú                 |
| --------------- | ----------------------- |
| `Authorization` | `Bearer <access_token>` |


### Query — `GET /api/Auth/me`, `GET /api/me`

Không query bắt buộc. **401** nếu thiếu/sai token.

### Response — `GET /api/Auth/me` (`data`)

Từ JWT (không truy vấn DB): `id`, `username`, `fullName`, `roleName`.

### Response — `GET /api/me` (`data` — `StaffMeDto`)

| Field | Kiểu | Ghi chú |
| ----- | ---- | ------- |
| `principalKind` | string | Luôn `"staff"` |
| `id` | number | |
| `username` | string | |
| `fullName` | string | |
| `email` | string | Nullable |
| `phone` | string | Nullable |
| `status` | string | |
| `roleId` | number | |
| `roleName` | string | |
| `roleDescription` | string | Nullable |
| `permissions` | string | Nullable (có thể là JSON string) |
| `canAccessWarehouse` | boolean | `true` nếu role được gọi API kho/fulfillment |

**Gợi ý FE:** dùng `GET /api/me` để sidebar (kho, fulfillment); `GET /api/Auth/me` nhẹ hơn nếu chỉ cần thông tin từ token.

---

## Luồng UI gợi ý

### A) Màn hình đăng nhập

1. Form username/password → `POST /api/Auth/login`.
2. Thành công: lưu token, redirect dashboard.
3. Thất bại: hiển thị `message` / `errors` từ envelope.

### B) Sau khi vào app

1. App init: gọi `GET /api/Auth/me` (hoặc `/api/me`) để hydrate store (tên, role, quyền hiển thị menu).
2. **401** trên bất kỳ API: xóa token, redirect login (kèm optional `returnUrl`).

### C) Đổi mật khẩu / profile

Nếu BE có endpoint riêng (ngoài phạm vi file này), gắn vào menu Cài đặt; không đoán body nếu chưa có trong Swagger.

---

## UX tối ưu

- Không log token ra console production.
- Timeout session: đồng bộ với TTL JWT + UX “Phiên hết hạn”.
- Tránh gọi `me` lặp vô hạn: cache trong store, refetch khi focus window hoặc sau đăng nhập.

