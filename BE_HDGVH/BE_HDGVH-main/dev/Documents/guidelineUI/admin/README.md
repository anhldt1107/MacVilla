# Guideline UI — Admin (BE_API)

Tài liệu tích hợp FE admin, **mỗi hạng mục một file**, cùng phong cách với `[../example.md](../example.md)`.

## Ghi chú cho FE (không cần biết tên class DTO C#)

- **Chân lý contract API:** Swagger UI `http://localhost:8080/swagger` (hoặc base URL môi trường + `/swagger`) và file OpenAPI `http://localhost:8080/swagger/v1/swagger.json`. Từ đó có thể sinh TypeScript (`openapi-typescript`, NSwag, …) hoặc đọc trực tiếp schema từng endpoint.
- Trong markdown, nếu có nhắc tên kiểu `AdminQuoteCreateDto` thì đó chỉ là **tham chiếu mã nguồn BE** (file `Dto/...`). FE **không** phải gửi hay nhận tên class đó — chỉ gửi **JSON body** với **tên property** đúng schema (thường **camelCase**, vd. `customerId`).
- Các mục **Body** trong từng file nên ưu tiên: bảng field + ví dụ JSON; trùng khớp với Swagger là đủ để gắn UI.
- Các file `*.md` trong thư mục này đã được rà và bổ sung **bảng field + ví dụ JSON** (và chỉnh query/body cho khớp controller/DTO hiện tại trong repo). Khi BE đổi DTO, cập nhật lại cho đồng bộ với Swagger.


| File                                                     | Nội dung                                                           |
| -------------------------------------------------------- | ------------------------------------------------------------------ |
| [auth-va-phien.md](./auth-va-phien.md)                   | Đăng nhập staff, `/api/Auth/me`, `/api/me`                         |
| [danh-muc.md](./danh-muc.md)                             | Danh mục sản phẩm                                                  |
| [san-pham.md](./san-pham.md)                             | Sản phẩm (CRUD)                                                    |
| [thuoc-tinh-va-gia-tri.md](./thuoc-tinh-va-gia-tri.md)   | Thuộc tính & giá trị thuộc tính                                    |
| [bien-the-va-ton-kho.md](./bien-the-va-ton-kho.md)       | Biến thể & tồn kho theo sản phẩm                                   |
| [tra-cuu-sku-va-upload.md](./tra-cuu-sku-va-upload.md)   | Tra cứu SKU & upload media                                         |
| [giao-dich-kho.md](./giao-dich-kho.md)                   | Giao dịch kho (toàn hệ thống)                                      |
| [fulfillment.md](./fulfillment.md)                       | Fulfillment / xuất kho đơn                                         |
| [khach-hang.md](./khach-hang.md)                         | Khách hàng                                                         |
| [don-hang.md](./don-hang.md)                             | Đơn hàng                                                           |
| [bao-gia.md](./bao-gia.md)                               | Báo giá                                                            |
| [hop-dong.md](./hop-dong.md)                             | Hợp đồng                                                           |
| [hoa-don.md](./hoa-don.md)                               | Hóa đơn                                                            |
| [thanh-toan.md](./thanh-toan.md)                         | Thanh toán                                                         |
| [thong-bao-chuyen-khoan.md](./thong-bao-chuyen-khoan.md) | Thông báo chuyển khoản B2B (đối soát, verify/reject)               |
| [khuyen-mai.md](./khuyen-mai.md)                         | Chiến dịch & voucher                                               |
| [bao-hanh.md](./bao-hanh.md)                             | Bảo hành                                                           |
| [warranty-claims-danh-sach.md](./warranty-claims-danh-sach.md) | Danh sách claim (hàng chờ xử lý) — `GET /api/admin/warranty-claims` |
| [doi-tra.md](./doi-tra.md)                               | Đổi / trả hàng                                                     |
| [nguoi-dung-va-vai-tro.md](./nguoi-dung-va-vai-tro.md)   | Người dùng nội bộ & Role                                           |
| [bao-cao.md](./bao-cao.md)                               | Báo cáo / dashboard Manager (sales-overview, low-stock, top-sales) |
| [nhan-su-directory.md](./nhan-su-directory.md)           | Staff directory (Manager/Admin xem nhân sự để phân công)           |
| [kho-warehouse.md](./kho-warehouse.md)                   | Warehouse dashboard (WarehouseStaff): overview, low-stock, inventory list |


> **Theo vai trò:** FE dành riêng cho Sales xem thư mục [../sales/](../sales/), Manager xem [../manager/](../manager/), Stock Manager xem [../stockmanager/](../stockmanager/), B2B xem [../b2b/](../b2b/), và **khách lẻ B2C** xem [../customer/](../customer/).

**Base URL:** cấu hình theo môi trường (VD Docker `http://localhost:8080`). **Envelope:** `ResponseDto` — `success`, `data`, `message` (và có thể có `errors` khi lỗi validation).

**Phân quyền tham khảo:** `AdminOnly` (Admin), `StaffAuthenticated` (mọi staff), `WarehouseStaff` (Admin, Manager, StockManager, Worker), `**ManagerOrAdmin`** (Admin + Manager). Các endpoint **duyệt / hoàn / đối soát / điều chỉnh** đã siết về `ManagerOrAdmin`:

- `PUT /api/admin/quotes/{id}/approve`, `.../reject`
- `POST /api/admin/orders/{id}/cancel`, `PUT .../assign-sales`
- `POST /api/admin/payments/refund`
- `POST /api/admin/customers/{id}/debt/adjust`
- `PUT /api/admin/returns/{id}/approve`, `.../reject`
- `POST /api/admin/transfer-notifications/{id}/verify`, `.../reject`
- `GET /api/admin/reports/*` (ManagerOrAdmin)
- `GET /api/admin/staff-directory` (mở cho **WarehouseStaff** — Admin/Manager/StockManager/Worker; Sales bị 403)