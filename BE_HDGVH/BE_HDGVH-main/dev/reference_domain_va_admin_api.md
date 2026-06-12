# Tham chiếu nhanh: Domain & Admin API (CUS350)

Tài liệu tổng hợp từ schema/code trong repo (EF, `Domain/*`, controllers). Dùng làm tra cứu khi tích hợp FE hoặc seed SQL.

---

## 1. Role — seed INSERT (trừ Admin)

Bảng `[Role]` (`init_database.sql`): `Role_Name`, `Description`, `Permissions`.

```sql
INSERT INTO [Role] (Role_Name, Description, Permissions)
VALUES
(N'Manager', N'Quản lý: phê duyệt báo giá, hợp đồng, đổi trả; giám sát bán hàng và kho.', NULL),
(N'Sales', N'Nhân viên kinh doanh: tạo báo giá, theo dõi đơn hàng B2B/B2C.', NULL),
(N'Stock Manager', N'Quản lý kho: tồn kho, nhập xuất, phiếu giao hàng.', NULL),
(N'Worker', N'Nhân viên kho/đóng gói: thực hiện pick/pack theo phiếu.', NULL);
```

`Permissions` (`NVARCHAR(MAX)`): thường dùng lưu gói quyền (JSON hoặc chuỗi phân tách), RBAC nhẹ; hệ lớn hay tách bảng `Permission` / `RolePermission`.

---

## 2. Trạng thái đơn hàng (`OrderStatus`) — chuẩn code

**Nguồn:** `AppData/Domain/OrderStatuses.cs`. Mọi layer (DB, BE, FE, seed) nên dùng đúng các chuỗi này.

| Giá trị | Ý nghĩa |
|--------|---------|
| `New` | Đơn mới, chờ xác nhận |
| `AwaitingPayment` | Chờ thanh toán (PayOS) |
| `Confirmed` | Đã xác nhận, chờ xử lý |
| `Processing` | Đang xử lý / chuẩn bị hàng |
| `ReadyToShip` | Sẵn sàng giao |
| `Shipped` | Đang giao |
| `Delivered` | Đã giao |
| `Completed` | Hoàn thành (khách xác nhận) |
| `Cancelled` | Đã hủy |

Luồng chuyển trạng thái: `OrderStatuses.CanTransition` / `CanCancel` trong cùng file. API admin: `GET` danh sách status (controller orders).

**Lưu ý:** Comment trong `init_database.sql` hoặc doc cũ (vd. `Packing`, `Shipping`) có thể lệch — lấy `OrderStatuses.cs` làm chuẩn.

---

## 3. Công nợ

**Công nợ** (B2B): số tiền **khách còn phải trả** doanh nghiệp (hàng đã giao/ghi nhận nhưng chưa thu đủ). Phía công ty là **phải thu**.

Trong hệ thống: trường kiểu **`DebtBalance`** trên khách; API điều chỉnh công nợ (admin) cập nhật số dư (tăng nợ / giảm khi thanh toán).

---

## 4. `GET /api/admin/customers`

**Auth:** `StaffAuthenticated`.

| Query | Kiểu | Mặc định | Ý nghĩa |
|--------|------|----------|---------|
| `page` | int | 1 | Trang (tối thiểu 1) |
| `pageSize` | int | 20 | 1–100 |
| `customerType` | string? | null | Lọc `CustomerType`; chuẩn: `B2C`, `B2B` (khớp chuỗi DB) |
| `hasDebt` | bool? | null | `true`: `DebtBalance > 0`; `false`: `<= 0` |
| `search` | string? | null | `Contains` trên FullName, Phone, Email, CompanyName, TaxCode |

---

## 5. `GET /api/admin/users` — status user

**Nguồn:** `AppData/Domain/UserStatuses.cs`.

| Giá trị | Ý nghĩa |
|--------|---------|
| `Active` | Đang kích hoạt |
| `Inactive` | Khóa / không kích hoạt |

**Auth:** `AdminOnly`. Có endpoint trả danh sách status (`GetStatuses`). Filter `?status=` so khớp chuỗi với cột `Status`.

---

## 6. `api/admin/campaigns` vs `api/admin/vouchers`

**Auth:** `AdminOnly`.

- **`/api/admin/campaigns`:** **Chiến dịch** — khung chương trình KM (tên, mô tả, thời gian, status). CRUD + xóa (có điều kiện nếu voucher đã dùng). Chi tiết campaign kèm danh sách voucher.
- **`/api/admin/vouchers`:** **Mã giảm giá** — thuộc một `campaignId`; CRUD + `PUT .../status` để đổi trạng thái voucher.

Quan hệ: **Campaign** = đợt/chương trình; **Voucher** = mã cụ thể khách nhập khi mua.

---

## 7. Status — Campaign & Voucher

**Campaign:** `AppData/Domain/CampaignStatuses.cs`  
`Active`, `Inactive`, `Expired`.

**Voucher:** `AppData/Domain/VoucherStatuses.cs`  
`Active`, `Inactive`, `Expired`.

Query `status` trên list API lọc `Status ==` (khớp chuỗi). Khi ghi, `IsValid` thường **không phân biệt hoa thường**.

---

## 8. Body tạo voucher — `POST /api/admin/vouchers`

Chi tiết JSON (kể cả ví dụ Swagger `string` / `0.01` / `2147483647`) nằm trong **[`voucher_create_body.md`](voucher_create_body.md)**.

---

*Cập nhật theo code trong workspace; nếu đổi `Domain/*` hoặc DTO, nên sửa file này cho khớp.*
