# Guideline UI — Sales (`Sales` role, BE_API)

Tài liệu tích hợp cho **FE nội bộ dành cho nhân viên bán hàng (Sales)**, đúng phạm vi nghiệp vụ. Cùng phong cách [../example.md](../example.md) và thư mục [../admin/](../admin/), [../b2b/](../b2b/).

Sales là **nhân sự** (`PrincipalKind: staff`), role `Sales`. Trong code **không có policy `SalesOnly`** — Sales dùng chung các endpoint gắn policy `**StaffAuthenticated**` với Manager/Admin, nhưng một số endpoint trên đó **chỉ dành cho Manager** theo quy ước nghiệp vụ (BE chưa chặn cứng theo role, cần FE tôn trọng; hoặc BE sẽ siết sau).

**Base URL:** cấu hình theo môi trường (VD Docker `http://localhost:8080`).  
**Envelope:** `ResponseDto` — `success`, `data`, `message` (lỗi có thể kèm `errors`, `errorCode` — xem [../../api_response_va_xu_ly_loi.md](../../api_response_va_xu_ly_loi.md)).  
**JSON:** camelCase. Header `Authorization: Bearer <access_token>` sau đăng nhập.  
**Chân lý contract:** Swagger `/swagger` và OpenAPI `/swagger/v1/swagger.json`.

---

## Phạm vi nghiệp vụ Sales (mapping endpoint)


| Nhóm                           | Endpoint sử dụng                                                                                                                                               | Ghi chú / giới hạn                                                                                                                |
| ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Auth & phiên                   | `POST /api/Auth/login`, `GET /api/Auth/me`, `GET /api/me`                                                                                                      | Nhân sự, xem [auth-va-phien.md](./auth-va-phien.md)                                                                               |
| Khách hàng (CRM)               | `/api/admin/customers` (list, chi tiết, tạo, cập nhật, đơn, công nợ)                                                                                           | Xem [khach-hang.md](./khach-hang.md). **Không** tự điều chỉnh dư nợ trừ khi được phép (`POST .../debt/adjust` thường của kế toán) |
| Báo giá                        | `/api/admin/quotes/`* — tạo, sửa, submit, `return-to-draft`, `assign`, **convert-to-order**, `reserve-inventory` / `release-inventory-reservation`, `statuses` | Xem [bao-gia.md](./bao-gia.md). **Không** gọi `approve` / `reject` (Manager)                                                      |
| Hợp đồng                       | `/api/admin/contracts/`* — tạo, sửa (Draft), `send-for-customer-confirmation`, `cancel`, list / detail / `by-number`                                           | Xem [hop-dong.md](./hop-dong.md)                                                                                                  |
| Đơn hàng                       | `/api/admin/orders/*` — list, detail, tạo (hộ khách), `cancel`, theo dõi `status` / `payment-status`, `assign-sales` (thường Manager)                          | Xem [don-hang.md](./don-hang.md)                                                                                                  |
| Phiếu xuất (chỉ xem)           | `GET /api/admin/fulfillments`, `GET .../{id}`, `GET .../statuses`                                                                                              | `StaffAuthenticated` — Sales theo dõi tiến độ kho; filter `orderId` theo đơn. **Không** `POST` tạo phiếu / `PUT` status / assign (WarehouseStaff). |
| Hóa đơn & thanh toán (tra cứu) | `/api/admin/invoices/*`, `/api/admin/payments` list/detail, `/api/admin/transfer-notifications` list/detail                                                    | Xem [thanh-toan-va-cong-no.md](./thanh-toan-va-cong-no.md). **Không** ghi nhận thanh toán / hoàn / verify CK (kế toán)            |


## Endpoint Sales **không** được dùng

BE chặn bằng policy JWT role claim:


| Policy           | Role được phép                               | Module                                                                                                                               |
| ---------------- | -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `AdminOnly`      | `admin`                                      | Sản phẩm, danh mục, biến thể, thuộc tính, voucher, campaign, upload media, tra SKU admin, user & role                                |
| `ManagerOrAdmin` | `admin`, `Manager`                           | Duyệt báo giá / đổi trả, hủy đơn, assign-sales, refund, verify CK, điều chỉnh công nợ, báo cáo                                        |
| `WarehouseStaff` | `admin`, `Manager`, `StockManager`, `Worker` | **Ghi** fulfillment: `POST .../orders/{orderId}/fulfillments`, `PUT .../fulfillments/{id}/status`, `PUT .../assign`. Giao dịch kho, tồn kho admin. *(Danh sách/chi tiết phiếu `GET .../fulfillments` là `StaffAuthenticated` — Sales xem được.)* |


Sales gọi các route trên sẽ **403 FORBIDDEN**. Với UI dành riêng cho Sales, **ẩn / disable** nút tương ứng để tránh lỗi người dùng.

## Endpoint đã siết về `ManagerOrAdmin` (Sales **bị 403**, chỉ Manager/Admin dùng)

- `PUT /api/admin/quotes/{id}/approve`, `.../reject`
- `POST /api/admin/orders/{id}/cancel`, `PUT .../assign-sales`
- `POST /api/admin/payments/refund`
- `POST /api/admin/customers/{id}/debt/adjust`
- `PUT /api/admin/returns/{id}/approve`, `.../reject`
- `POST /api/admin/transfer-notifications/{id}/verify`, `.../reject`
- `GET /api/admin/reports/*` (ManagerOrAdmin)
- `GET /api/admin/staff-directory` (WarehouseStaff — Sales không thuộc nhóm này)

## Mục lục


| File                                                   | Nội dung                                            |
| ------------------------------------------------------ | --------------------------------------------------- |
| [auth-va-phien.md](./auth-va-phien.md)                 | Đăng nhập staff, `me`                               |
| [khach-hang.md](./khach-hang.md)                       | CRM phía Sales                                      |
| [bao-gia.md](./bao-gia.md)                             | Toàn bộ vòng đời Sales đảm nhận                     |
| [hop-dong.md](./hop-dong.md)                           | Tạo & gửi hợp đồng xác nhận                         |
| [don-hang.md](./don-hang.md)                           | Convert / theo dõi / hỗ trợ khách                   |
| [thanh-toan-va-cong-no.md](./thanh-toan-va-cong-no.md) | Xem hóa đơn, thanh toán, thông báo CK (chỉ tra cứu) |


**Luồng tổng thể (BA / tích hợp):** [../kich_ban_b2b_bao_gia_den_ket_thuc_don.md](../kich_ban_b2b_bao_gia_den_ket_thuc_don.md).