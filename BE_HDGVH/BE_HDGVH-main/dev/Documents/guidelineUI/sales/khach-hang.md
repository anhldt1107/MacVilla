# Sales — Khách hàng (`/api/admin/customers`)

## Mục đích

Sales **quản lý danh bạ khách hàng B2B / B2C mình chăm sóc**: tra cứu, tạo nhanh khách mới khi phát sinh báo giá / đơn, xem đơn của khách và dư nợ để tư vấn.

**Auth:** **StaffAuthenticated** (role Sales dùng được).

Bảng field đầy đủ: [../admin/khach-hang.md](../admin/khach-hang.md). File này chỉ tóm tắt **phần Sales sử dụng**.

## API

| Method | Path | Sales dùng khi |
| ------ | ---- | -------------- |
| GET | `/api/admin/customers` | Danh sách / tìm khách (autocomplete khi tạo báo giá, đơn) |
| GET | `/api/admin/customers/{id}` | Hồ sơ, mã số thuế, địa chỉ |
| POST | `/api/admin/customers` | Tạo nhanh khách mới (B2C / B2B đơn giản) trước khi lập báo giá |
| PUT | `/api/admin/customers/{id}` | Cập nhật thông tin liên hệ / công ty |
| GET | `/api/admin/customers/{id}/orders` | Lịch sử đơn của khách — hỗ trợ chăm sóc |
| GET | `/api/admin/customers/{id}/debt` | Tra cứu công nợ (read-only) |
| GET | `/api/admin/customers/types` | Danh sách `CustomerType` (B2C/B2B) |

**Không dùng cho Sales:**

- `POST /api/admin/customers/{id}/debt/adjust` — điều chỉnh công nợ thủ công (kế toán / Manager).

## Luồng gợi ý

1. Khách gọi / chat yêu cầu báo giá → tìm `GET customers?search=...`.
2. Chưa có → `POST customers` (tối thiểu `fullName`, `phone`, `email`, `customerType`).
3. Mở profile → tạo báo giá ([bao-gia.md](./bao-gia.md)) với `customerId` vừa tìm/tạo.
4. Trước khi convert đơn: xem công nợ & đơn cũ để tư vấn điều khoản thanh toán.

## UX

- Tìm kiếm **fuzzy** theo tên + SĐT + email + MST.
- Badge `customerType`, cảnh báo nếu `debtBalance` > ngưỡng (cấu hình FE).
- Không cho edit các trường thuộc kế toán (MST, dư nợ) nếu policy team hạn chế.
