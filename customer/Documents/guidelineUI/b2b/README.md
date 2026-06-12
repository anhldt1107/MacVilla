# Guideline UI — B2B Store (BE_API)

Tài liệu tích hợp **cổng khách doanh nghiệp** (JWT **customer**), cùng phong cách với `[../example.md](../example.md)` và thư mục `[../admin/](../admin/)`.

**Base URL:** theo môi trường (VD Docker `http://localhost:8080`).  
**Envelope:** `ResponseDto` — `success`, `data`, `message` (và có thể `errors`, `errorCode` khi lỗi).

## Ghi chú quan trọng cho FE

- **Prefix B2B:** hầu hết API nằm dưới `**/api/store/b2b/...`**.
- **JWT:** dùng token trả về từ `POST /api/store/b2b/auth/login` hoặc `register` — **không** dùng chéo token **staff** (`/api/Auth/login`) cho các route này.
- **Policy:** gần như toàn bộ route B2B (trừ register/login) yêu cầu `**CustomerAuthenticated`** — header `Authorization: Bearer <access_token>`.
- **Chân lý contract:** Swagger UI `http://localhost:8080/swagger` và OpenAPI `http://localhost:8080/swagger/v1/swagger.json`. Trong từng file có **bảng field JSON (camelCase)** + ví dụ; tên class C# chỉ để dev BE đối chiếu `Dto/Store/...`.

## Mục lục


| File                                                                 | Nội dung                                                          |
| -------------------------------------------------------------------- | ----------------------------------------------------------------- |
| [auth-dang-ky-dang-nhap-ho-so.md](./auth-dang-ky-dang-nhap-ho-so.md) | Đăng ký, đăng nhập, `me`, cập nhật hồ sơ                          |
| [dia-chi-giao-hang.md](./dia-chi-giao-hang.md)                       | Địa chỉ giao (`/api/store/me/addresses`) — dùng chung B2C/B2B     |
| [bao-gia.md](./bao-gia.md)                                           | Yêu cầu báo giá, danh sách, chi tiết, accept/reject/counter-offer |
| [hop-dong.md](./hop-dong.md)                                         | Hợp đồng, xác nhận                                                |
| [don-hang.md](./don-hang.md)                                         | Đơn hàng, timeline                                                |
| [cong-no-va-hoa-don.md](./cong-no-va-hoa-don.md)                     | Tổng quan công nợ, hóa đơn, PDF                                   |
| [thanh-toan-va-chuyen-khoan.md](./thanh-toan-va-chuyen-khoan.md)     | Lịch sử thanh toán, thông báo CK                                  |
| [bao-hanh.md](./bao-hanh.md)                                         | Phiếu BH, tạo yêu cầu BH                                          |
| [doi-tra-hang.md](./doi-tra-hang.md)                                 | Phiếu đổi/trả, tạo yêu cầu                                        |


Nghiệp vụ **tạo báo giá / duyệt / kho** phía nội bộ nằm trong `[../admin/](../admin/)` (staff), không trùng prefix với store B2B.