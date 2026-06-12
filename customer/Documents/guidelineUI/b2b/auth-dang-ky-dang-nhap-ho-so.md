# B2B Store — Đăng ký, đăng nhập & hồ sơ (`/api/store/b2b/auth`)

## Mục đích

Khách **doanh nghiệp** đăng ký tài khoản, đăng nhập nhận **JWT customer**, xem và cập nhật **hồ sơ** (người đại diện, công ty, MST, địa chỉ, dư nợ hiển thị).

## Auth


| Method | Path                           | Policy                | Mô tả                      |
| ------ | ------------------------------ | --------------------- | -------------------------- |
| POST   | `/api/store/b2b/auth/register` | AllowAnonymous        | Đăng ký + nhận JWT         |
| POST   | `/api/store/b2b/auth/login`    | AllowAnonymous        | Đăng nhập email + mật khẩu |
| GET    | `/api/store/b2b/auth/me`       | CustomerAuthenticated | Hồ sơ từ DB                |
| PUT    | `/api/store/b2b/auth/me`       | CustomerAuthenticated | Cập nhật hồ sơ             |


### Header (sau đăng nhập)


| Header          | Ghi chú                |
| --------------- | ---------------------- |
| `Authorization` | `Bearer <accessToken>` |


---

## Body — `POST .../auth/register`


| Field            | Kiểu   | Bắt buộc | Ghi chú                          |
| ---------------- | ------ | -------- | -------------------------------- |
| `fullName`       | string | Có       | Người đại diện, max 500          |
| `email`          | string | Có       | Đăng nhập, email hợp lệ, max 255 |
| `phone`          | string | Có       | Max 50                           |
| `password`       | string | Có       | Min 6, max 200                   |
| `companyName`    | string | Có       | Max 255                          |
| `taxCode`        | string | Không    | Max 100                          |
| `companyAddress` | string | Không    | Max 500                          |


```json
{
  "fullName": "Nguyễn Văn A",
  "email": "a@congty.vn",
  "phone": "0909123456",
  "password": "matKhau6KyTu",
  "companyName": "Công ty TNHH ABC",
  "taxCode": "0123456789",
  "companyAddress": "123 Đường X, TP.HCM"
}
```

### Response — `data` (đăng ký / đăng nhập)

Cấu trúc `StoreB2BLoginResponseDto`:


| Field          | Kiểu              | Ghi chú                              |
| -------------- | ----------------- | ------------------------------------ |
| `accessToken`  | string            | JWT customer                         |
| `expiresAtUtc` | string (ISO 8601) | Hết hạn token                        |
| `customer`     | object            | `StoreB2BProfileDto` — xem bảng dưới |


`**customer` (profile sau đăng ký/đăng nhập):**


| Field            | Kiểu          |
| ---------------- | ------------- |
| `id`             | number        |
| `customerType`   | string        |
| `fullName`       | string        |
| `email`          | string | null |
| `phone`          | string        |
| `companyName`    | string        |
| `taxCode`        | string | null |
| `companyAddress` | string | null |
| `debtBalance`    | number        |


---

## Body — `POST .../auth/login`


| Field      | Kiểu   | Bắt buộc |
| ---------- | ------ | -------- |
| `email`    | string | Có       |
| `password` | string | Có       |


```json
{
  "email": "a@congty.vn",
  "password": "matKhau6KyTu"
}
```

---

## Body — `PUT .../auth/me`

Toàn bộ field sau **bắt buộc** (theo `StoreB2BUpdateDto`):


| Field            | Kiểu   | Ghi chú                                                         |
| ---------------- | ------ | --------------------------------------------------------------- |
| `fullName`       | string | Max 500                                                         |
| `email`          | string | Max 255, email                                                  |
| `phone`          | string | Max 50                                                          |
| `companyName`    | string | Max 255                                                         |
| `taxCode`        | string | Không bắt buộc validation `[Required]` nhưng có max 100 nếu gửi |
| `companyAddress` | string | Không bắt buộc, max 500                                         |


```json
{
  "fullName": "Nguyễn Văn A",
  "email": "a.moi@congty.vn",
  "phone": "0909111222",
  "companyName": "Công ty TNHH ABC",
  "taxCode": "0123456789",
  "companyAddress": "Địa chỉ mới chi nhánh"
}
```

`GET .../auth/me` trả cùng dạng `data` profile (không body).

---

## Luồng UI gợi ý

### A) Onboarding

1. Trang đăng ký → `POST register` → lưu token → `GET me` hoặc dùng luôn `customer` trong response.
2. Bắt buộc đổi mật khẩu sau lần đầu (nếu nghiệp vụ nội bộ yêu cầu — hiện BE không có endpoint đổi mật khách trong controller này, kiểm tra Swagger nếu bổ sung).

### B) Phiên đăng nhập

1. Lưu `accessToken` + `expiresAtUtc`; refresh nếu BE có (hiện response chỉ có access + expires).
2. **401:** xóa token, về màn login.

### C) Header app

1. Sau login: hiển thị `companyName`, `debtBalance` (format tiền).

---

## UX tối ưu

- Không log `accessToken` ra console production.
- Hiển thị lỗi validation từ `errors` (map theo tên field camelCase).
- Email đăng nhập: trim + lowercase phía client (BE vẫn validate).

