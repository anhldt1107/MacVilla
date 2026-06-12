# Guideline UI — Stock Manager (`StockManager` role, BE_API)

Tài liệu tích hợp cho **FE workspace Stock Manager** — trọng tâm vận hành kho, phiếu xuất, hoàn tất đổi/trả, xử lý bảo hành. Cùng phong cách [../example.md](../example.md), [../admin/](../admin/), [../sales/](../sales/), [../manager/](../manager/), [../customer/](../customer/), [../b2b/](../b2b/).

Stock Manager là **nhân sự** (`PrincipalKind: staff`), role `StockManager`. Match policy:

- `StaffAuthenticated` — mọi endpoint staff cơ bản.
- `WarehouseStaff` — kho, phiếu xuất, giao dịch kho, dashboard kho.

**Không** match:

- `AdminOnly` — không CRUD sản phẩm / danh mục / user / voucher / campaign / upload media.
- `ManagerOrAdmin` — không duyệt báo giá / đổi trả, không refund, không verify CK, không xem `/api/admin/reports/`*.

> `**GET /api/admin/staff-directory` đã mở cho `WarehouseStaff`** — StockManager / Worker đều xem được để phân công phiếu xuất (xem [nhan-su.md](./nhan-su.md)).

**Base URL:** cấu hình theo môi trường (Docker `http://localhost:8080`).  
**Envelope:** `ResponseDto`. **JSON:** camelCase. Header `Authorization: Bearer <access_token>`.  
**Chân lý contract:** Swagger `/swagger`, OpenAPI `/swagger/v1/swagger.json`.  
**Xử lý lỗi:** [../../api_response_va_xu_ly_loi.md](../../api_response_va_xu_ly_loi.md).

---

## Phạm vi nghiệp vụ Stock Manager — mapping endpoint


| Nhóm                         | Endpoint chính                                                                                                                                                      | Policy                                               | Ghi chú                                                                                                 |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| Auth / phiên                 | `POST /api/Auth/login`, `GET /api/Auth/me`, `GET /api/me`                                                                                                           | Staff                                                | Check `roleName === "StockManager"`                                                                     |
| **Staff directory**          | `GET /api/admin/staff-directory?role=Worker&status=Active`                                                                                                          | WarehouseStaff                                       | Dùng cho gán Worker — [nhan-su.md](./nhan-su.md)                                                        |
| **Dashboard kho**            | `GET /api/admin/warehouse/overview`                                                                                                                                 | WarehouseStaff                                       | [dashboard.md](./dashboard.md)                                                                          |
| **Cảnh báo tồn thấp**        | `GET /api/admin/warehouse/low-stock`                                                                                                                                | WarehouseStaff                                       | Bản mirror `/reports/low-stock` cho kho                                                                 |
| **Tồn cắt ngang toàn kho**   | `GET /api/admin/warehouse/inventory`                                                                                                                                | WarehouseStaff                                       | Filter low / out-of-stock / location / search                                                           |
| **Tồn theo SKU**             | `GET / PUT / POST /api/admin/products/{pid}/variants/{vid}/inventory`                                                                                               | WarehouseStaff                                       | Upsert / set / tạo                                                                                      |
| **Giao dịch kho**            | `GET / POST /api/admin/inventory-transactions`, `/{id}`                                                                                                             | WarehouseStaff                                       | IN / OUT / ADJUST / RESERVE / RELEASE; mới có filter `referenceType`, `referenceId`, `workerIdAssigned` |
| **Phiếu xuất (fulfillment)** | `GET /api/admin/fulfillments`, `/{id}`, `/statuses` (StaffAuthenticated); `/{id}/status`, `/{id}/assign`; `POST .../orders/{orderId}/fulfillments` (WarehouseStaff) | WarehouseStaff cho thao tác ghi; Sales chỉ đọc `GET` | [fulfillment.md](./fulfillment.md)                                                                      |
| **Đổi / trả — hoàn tất**     | `GET /api/admin/returns?status=Approved` …, `PUT /{id}/complete`                                                                                                    | Staff                                                | StockManager là người **complete**                                                                      |
| **Bảo hành — xử lý claim**   | `GET /api/admin/warranty-tickets`, `/{id}`, `/by-number/{n}`; `PUT /api/admin/warranty-claims/{id}/status`                                                          | Staff                                                | Pending_Check → Checking → Confirmed_Defect → Repairing → Waiting_Pickup → Completed                    |
| **Đơn — xem theo phiếu**     | `GET /api/admin/orders/{id}`, `/{id}/timeline`, `/by-code/{code}`                                                                                                   | Staff                                                | Tra cứu địa chỉ giao, line, voucher                                                                     |
| **Quotes — giữ / trả tồn**   | `POST /api/admin/quotes/{id}/reserve-inventory`, `/release-inventory-reservation`                                                                                   | Staff                                                | Tạo RESERVE / RELEASE                                                                                   |


## Endpoint Stock Manager **không** dùng được

Trả **403** với:


| Policy           | Module                                                                                                                                                               |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AdminOnly`      | products, categories, variants CRUD, attributes, vouchers, campaigns, users, roles, media                                                                            |
| `ManagerOrAdmin` | quotes approve/reject, orders cancel/assign-sales, payments refund, customers debt/adjust, returns approve/reject, transfer-notifications verify/reject, `reports/`* |


Khi cần phối hợp: **báo Manager** (qua kênh khác) chứ không gọi API trên.

## Mục lục


| File                                                 | Nội dung                                                                 |
| ---------------------------------------------------- | ------------------------------------------------------------------------ |
| [auth-va-phien.md](./auth-va-phien.md)               | Login staff + check role                                                 |
| [nhan-su.md](./nhan-su.md)                           | Staff directory để phân công Worker (đọc-only)                           |
| [dashboard.md](./dashboard.md)                       | `/warehouse/overview`, `/warehouse/low-stock`                            |
| [ton-kho-va-giao-dich.md](./ton-kho-va-giao-dich.md) | List tồn cắt ngang, tồn theo SKU, ghi nhận IN/OUT/ADJUST/RESERVE/RELEASE |
| [fulfillment.md](./fulfillment.md)                   | Tạo phiếu xuất, gán Worker, theo dõi tiến độ                             |
| [doi-tra-hoan-tat.md](./doi-tra-hoan-tat.md)         | Hoàn tất phiếu đổi/trả đã được Manager duyệt                             |
| [bao-hanh-xu-ly.md](./bao-hanh-xu-ly.md)             | Cập nhật trạng thái claim BH theo tiến trình sửa chữa                    |


**Luồng tổng thể:** [../kich_ban_b2b_bao_gia_den_ket_thuc_don.md](../kich_ban_b2b_bao_gia_den_ket_thuc_don.md). Kịch bản demo có Stock Manager: [../kich_ban_demo_day_du.md](../kich_ban_demo_day_du.md) (Act 1.2, Act 4, Act 5).