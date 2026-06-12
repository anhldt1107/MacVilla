# Guideline UI — Manager (`Manager` role, BE_API)

Tài liệu tích hợp cho **FE workspace Manager** — tập trung **duyệt / đối soát / điều phối / báo cáo**. Cùng phong cách [../example.md](../example.md), [../admin/](../admin/), [../sales/](../sales/), [../b2b/](../b2b/).

Manager là **nhân sự** (`PrincipalKind: staff`), role `Manager`. Trong code Manager match các policy:

- `StaffAuthenticated` — mọi endpoint staff cơ bản.
- `**ManagerOrAdmin`** — phê duyệt / hoàn tiền / đối soát / điều chỉnh công nợ / báo cáo.
- `WarehouseStaff` — đồng thời Manager có quyền kho vì nằm trong whitelist Manager / StockManager / Worker / Admin.
- **Không** match `AdminOnly`.

**Base URL:** cấu hình theo môi trường (VD Docker `http://localhost:8080`).  
**Envelope:** `ResponseDto`. **JSON:** camelCase. Header `Authorization: Bearer <access_token>`.  
**Chân lý contract:** Swagger `/swagger`, OpenAPI `/swagger/v1/swagger.json`.  
**Xử lý lỗi:** [../../api_response_va_xu_ly_loi.md](../../api_response_va_xu_ly_loi.md).

---

## Phạm vi nghiệp vụ Manager — mapping endpoint


| Nhóm                        | Endpoint chính                                                                                                                                                 | Policy                                        | Ghi chú                                                |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------- | ------------------------------------------------------ |
| Auth / phiên                | `POST /api/Auth/login`, `GET /api/Auth/me`, `GET /api/me`                                                                                                      | Staff                                         | Check `roleName === "Manager"`                         |
| Dashboard / KPI             | `GET /api/admin/reports/sales-overview`, `/low-stock`, `/top-sales`                                                                                            | ManagerOrAdmin                                | Xem [bao-cao.md](./bao-cao.md)                         |
| Staff directory (phân công) | `GET /api/admin/staff-directory?role=Sales/...`                                                                                                                | ManagerOrAdmin                                | [nhan-su-va-phan-cong.md](./nhan-su-va-phan-cong.md)   |
| **Duyệt báo giá**           | `PUT /api/admin/quotes/{id}/approve`, `.../reject` + list/detail/statuses                                                                                      | ManagerOrAdmin + Staff                        | [bao-gia.md](./bao-gia.md)                             |
| Hợp đồng                    | `/api/admin/contracts/`* (list/detail/create/update/send/cancel)                                                                                               | Staff                                         | [hop-dong.md](./hop-dong.md)                           |
| **Điều phối đơn**           | `POST /api/admin/orders/{id}/cancel`, `PUT .../assign-sales`, `PUT .../status`, `PUT .../payment-status`                                                       | Cancel/assign: ManagerOrAdmin; còn lại: Staff | [don-hang.md](./don-hang.md)                           |
| Hóa đơn                     | `/api/admin/invoices/`*                                                                                                                                        | Staff                                         | [hoa-don-va-thanh-toan.md](./hoa-don-va-thanh-toan.md) |
| **Thanh toán + hoàn**       | `/api/admin/payments/`* (refund = ManagerOrAdmin)                                                                                                              | Hỗn hợp                                       | [hoa-don-va-thanh-toan.md](./hoa-don-va-thanh-toan.md) |
| **Đối soát chuyển khoản**   | `POST /api/admin/transfer-notifications/{id}/verify`, `.../reject` + list/detail                                                                               | ManagerOrAdmin + Staff                        | [hoa-don-va-thanh-toan.md](./hoa-don-va-thanh-toan.md) |
| **Khách hàng + công nợ**    | `/api/admin/customers/`* (debt/adjust = ManagerOrAdmin)                                                                                                        | Hỗn hợp                                       | [khach-hang-va-cong-no.md](./khach-hang-va-cong-no.md) |
| **Duyệt đổi trả**           | `PUT /api/admin/returns/{id}/approve`, `.../reject` + list/detail                                                                                              | ManagerOrAdmin + Staff                        | [doi-tra-bao-hanh.md](./doi-tra-bao-hanh.md)           |
| Bảo hành                    | `/api/admin/warranty-tickets`, `/api/admin/warranty-claims/{id}/status`                                                                                        | Staff                                         | [doi-tra-bao-hanh.md](./doi-tra-bao-hanh.md)           |
| **Kho & fulfillment**       | `/api/admin/fulfillments/`*, `/api/admin/orders/{oid}/fulfillments`, `/api/admin/inventory-transactions`, `/api/admin/products/{pid}/variants/{vid}/inventory` | WarehouseStaff                                | [kho-va-fulfillment.md](./kho-va-fulfillment.md)       |


## Endpoint Manager **không** dùng được (`AdminOnly`)

Manager sẽ **403** với:

- `/api/admin/products`, `/api/admin/categories`, `/api/admin/products/{id}/variants`, `/api/admin/product-attributes`, `/api/admin/product-attribute-values`, `/api/admin/variant-lookup`
- `/api/admin/campaigns`, `/api/admin/vouchers`, `/api/admin/media/upload`
- `/api/admin/users`, `/api/admin/roles`

Nếu cần chọn nhân sự để phân công, dùng `/api/admin/staff-directory` (read-only, Manager được phép).

## Mục lục


| File                                                   | Nội dung                           |
| ------------------------------------------------------ | ---------------------------------- |
| [auth-va-phien.md](./auth-va-phien.md)                 | Đăng nhập staff, `me`              |
| [bao-cao.md](./bao-cao.md)                             | Dashboard KPI, tồn thấp, top sales |
| [nhan-su-va-phan-cong.md](./nhan-su-va-phan-cong.md)   | Staff directory, phân công         |
| [bao-gia.md](./bao-gia.md)                             | Hàng đợi duyệt báo giá             |
| [hop-dong.md](./hop-dong.md)                           | Hợp đồng (tạo / hủy)               |
| [don-hang.md](./don-hang.md)                           | Điều phối đơn, hủy, assign sales   |
| [hoa-don-va-thanh-toan.md](./hoa-don-va-thanh-toan.md) | HĐ, thanh toán, hoàn, đối soát CK  |
| [khach-hang-va-cong-no.md](./khach-hang-va-cong-no.md) | Khách hàng + công nợ + debt/adjust |
| [doi-tra-bao-hanh.md](./doi-tra-bao-hanh.md)           | Đổi trả duyệt, bảo hành            |
| [kho-va-fulfillment.md](./kho-va-fulfillment.md)       | Kho, phiếu xuất, tồn, ADJUST       |


**Luồng tổng thể:** [../kich_ban_b2b_bao_gia_den_ket_thuc_don.md](../kich_ban_b2b_bao_gia_den_ket_thuc_don.md).