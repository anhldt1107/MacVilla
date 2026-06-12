# Guideline UI — Customer B2C (BE_API)

Tài liệu tích hợp cho **cổng khách lẻ (B2C)** — JWT `PrincipalKind: customer`. Cùng phong cách [../example.md](../example.md), [../admin/](../admin/), [../sales/](../sales/), [../manager/](../manager/), [../b2b/](../b2b/).

**Prefix chính:**

- **`/api/store/*`** (anonymous hoặc customer) — cổng cửa hàng (catalog, đăng nhập, giỏ, đơn, thanh toán, hậu mãi).
- **`/api/store/me/*`** — khu vực **của khách đã đăng nhập** (account, cart, addresses, đơn của tôi, hóa đơn, thanh toán, bảo hành, đổi/trả).

**Base URL:** cấu hình theo môi trường (Docker `http://localhost:8080`).  
**Envelope:** `ResponseDto` — `success`, `data`, `message`, `errors?`, `errorCode?` ([../../api_response_va_xu_ly_loi.md](../../api_response_va_xu_ly_loi.md)).  
**JSON:** camelCase. Header `Authorization: Bearer <access_token>` sau đăng nhập.  
**Chân lý contract:** Swagger `/swagger`, OpenAPI `/swagger/v1/swagger.json`.

> **Một số endpoint dưới đây share service với B2B** (`IStoreB2BInvoiceService`, `IStoreB2BPaymentService`, `IStoreB2BAfterSalesService`) — FE không cần quan tâm tên class C#; chỉ đọc **tên field JSON** (camelCase) trong từng file md. Service đã bỏ ràng buộc loại khách và lọc theo `customerId` của JWT hiện tại. DTO trong schema OpenAPI có thể có tiền tố `StoreB2B*` nhưng nội dung trả về chính xác cho khách đang đăng nhập.

---

## Mục lục

| File | Nội dung |
| ---- | -------- |
| [auth-va-ho-so.md](./auth-va-ho-so.md) | Đăng ký, đăng nhập, me, cập nhật hồ sơ, **đổi mật khẩu** |
| [catalog.md](./catalog.md) | Danh mục, sản phẩm, variant (anonymous) |
| [voucher.md](./voucher.md) | Kiểm tra mã giảm giá |
| [dia-chi-giao-hang.md](./dia-chi-giao-hang.md) | `/api/store/me/addresses` |
| [gio-hang.md](./gio-hang.md) | `/api/store/me/cart` |
| [dat-don-thanh-toan.md](./dat-don-thanh-toan.md) | Preview + đặt đơn + PayOS |
| [don-hang.md](./don-hang.md) | Đơn của tôi, **timeline**, **hủy**, **reorder** |
| [hoa-don.md](./hoa-don.md) | Danh sách / chi tiết / PDF hóa đơn |
| [thanh-toan-lich-su.md](./thanh-toan-lich-su.md) | Lịch sử `PaymentTransaction` của khách |
| [bao-hanh.md](./bao-hanh.md) | Phiếu BH + tạo yêu cầu bảo hành |
| [doi-tra-hang.md](./doi-tra-hang.md) | Phiếu đổi/trả + tạo yêu cầu |

**Luồng tổng thể:** [../kich_ban_b2b_bao_gia_den_ket_thuc_don.md](../kich_ban_b2b_bao_gia_den_ket_thuc_don.md) (chủ yếu B2B; khách B2C dùng các trang trong folder này).

---

## Bảng tóm tắt toàn bộ endpoint B2C

| Nhóm | Endpoint | Auth |
| ---- | -------- | ---- |
| **Auth** | `POST /api/store/auth/register` | Anonymous |
| | `POST /api/store/auth/login` | Anonymous |
| | `GET /api/store/auth/me`, `PUT /api/store/auth/me` | Customer |
| | `POST /api/store/auth/change-password` | Customer |
| **Catalog** | `GET /api/store/categories` | Anonymous |
| | `GET /api/store/products` / `GET /api/store/products/id/{id}` / `GET /api/store/products/{slugOrId}` | Anonymous |
| | `GET /api/store/variants/by-sku/{sku}` | Anonymous |
| **Voucher** | `POST /api/store/vouchers/validate` | Anonymous |
| **Cart** | `GET /api/store/me/cart`, `POST /items`, `PUT /items/{variantId}`, `DELETE /items/{variantId}`, `DELETE /api/store/me/cart` | Customer |
| **Addresses** | `GET / POST / PUT / DELETE /api/store/me/addresses`, `POST /{id}/set-default` | Customer |
| **Checkout** | `POST /api/store/orders/preview`, `POST /api/store/orders` | Customer |
| **PayOS** | `POST /api/store/payments/payos/create` | Customer |
| | `POST /api/store/payments/payos/webhook` | Anonymous (PayOS callback) |
| **Đơn** | `GET /api/store/me/orders`, `GET /{orderCode}` | Customer |
| | `GET /api/store/me/orders/{orderCode}/timeline` | Customer |
| | `POST /api/store/me/orders/{orderCode}/cancel` | Customer |
| | `POST /api/store/me/orders/{orderCode}/reorder` | Customer |
| **Hóa đơn** | `GET /api/store/me/invoices`, `GET /{invoiceNumber}`, `GET /{invoiceNumber}/pdf` | Customer |
| **Thanh toán (lịch sử)** | `GET /api/store/me/payments`, `GET /{id}` | Customer |
| **Bảo hành** | `GET /api/store/me/warranty-tickets`, `GET /{ticketNumber}`, `POST warranty-tickets` | Customer |
| **Đổi / trả** | `GET /api/store/me/return-requests`, `GET /{ticketNumber}`, `POST return-requests` | Customer |

---

## Phân biệt với khách B2B

Khách B2B **vẫn dùng được** các route `/api/store/me/*` ở trên (service share). Tuy nhiên FE B2B có workspace riêng ([../b2b/](../b2b/)) với các tính năng đặc thù (hợp đồng, báo giá, notify transfer, debt summary). Khách B2C **không** nên dùng các route `/api/store/b2b/*` (dù kỹ thuật có thể) để tránh nhầm nghiệp vụ.
