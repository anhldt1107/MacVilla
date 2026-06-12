# Customer — Đăng ký, đăng nhập, hồ sơ, đổi mật khẩu (`/api/store/auth`)

## API

| Method | Path | Policy | Ghi chú |
| ------ | ---- | ------ | ------- |
| POST | `/api/store/auth/register` | Anonymous | Đăng ký B2C + nhận JWT |
| POST | `/api/store/auth/login` | Anonymous | Email + mật khẩu |
| GET | `/api/store/auth/me` | Customer | Hồ sơ từ DB |
| PUT | `/api/store/auth/me` | Customer | Cập nhật họ tên, email, số điện thoại |
| POST | `/api/store/auth/change-password` | Customer | Đổi mật khẩu |

Header sau đăng nhập: `Authorization: Bearer <accessToken>`.

### Body — `POST /register` (`StoreCustomerRegisterDto`)

| Field | Kiểu | Bắt buộc | Ghi chú |
| ----- | ---- | -------- | ------- |
| `fullName` | string | Có | Max 255 |
| `email` | string | Có | email hợp lệ, unique |
| `phone` | string | Có | Max 50, unique |
| `password` | string | Có | Min 6, max 200 |

```json
{
  "fullName": "Trần Thị B",
  "email": "b@gmail.com",
  "phone": "0909123456",
  "password": "123456"
}
```

Response `data`: `StoreCustomerLoginResponseDto` — gồm `accessToken`, `expiresAtUtc`, `customer { id, customerType, fullName, email, phone }`.

### Body — `POST /login` (`StoreCustomerLoginDto`)

| Field | Kiểu | Bắt buộc |
| ----- | ---- | -------- |
| `email` | string | Có |
| `password` | string | Có |

### `GET /me` / `PUT /me` (`StoreCustomerProfileDto` / `StoreCustomerUpdateDto`)

`PUT /me` nhận:

| Field | Kiểu | Bắt buộc | Ghi chú |
| ----- | ---- | -------- | ------- |
| `fullName` | string | Có | |
| `email` | string | Có | Unique |
| `phone` | string | Có | Unique |

### Body — `POST /change-password` (`StoreCustomerChangePasswordDto`)

| Field | Kiểu | Bắt buộc | Ghi chú |
| ----- | ---- | -------- | ------- |
| `oldPassword` | string | Có | |
| `newPassword` | string | Có | Min 6, max 200, **khác** mật khẩu cũ |

```json
{ "oldPassword": "123456", "newPassword": "Abcdef@2026" }
```

Lỗi thường gặp:

- **401 / AUTH_FAILED**: sai mật khẩu hiện tại.
- **400 / BAD_REQUEST**: `newPassword` quá ngắn, trùng mật khẩu cũ.

> **Quên mật khẩu** (`forgot-password`, OTP email) chưa có — cần thêm bảng `PasswordResetToken` / tích hợp email ở lần bổ sung sau.

## Luồng UI

1. Trang đăng nhập / đăng ký → nhận token → lưu `accessToken`, dùng header `Authorization`.
2. Trang **Tài khoản của tôi** → `GET /me`.
3. Nút **Đổi mật khẩu** mở dialog → `POST /change-password`; thành công → đăng xuất khuyến nghị (optional) để buộc login lại với mật khẩu mới.

## UX

- Validate password client-side: độ dài, ký tự; cảnh báo trùng mật khẩu cũ.
- Sau **401** ở bất kỳ request nào → yêu cầu login lại.
- Không cache JWT trong storage kém an toàn (HttpOnly cookie nếu có thể).
