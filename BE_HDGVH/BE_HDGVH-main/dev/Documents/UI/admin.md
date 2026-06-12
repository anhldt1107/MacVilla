# Sidebar đề xuất — **Admin** (quản trị hệ thống)

**Vai trò:** Toàn quyền cấu hình, phân quyền, master data nhạy cảm; ít thao tác đơn hàng hàng ngày nhưng **có quyền** vì policy `admin` và một số API chỉ `AdminOnly`.

**Nguyên tắc UI:** nhóm theo **vận hành** (bán hàng / kho / tài chính / hệ thống); mục chỉ dành cho admin đặt cuối hoặc trong “Hệ thống”.

---

## 1. Tổng quan & báo cáo (tuỳ chọn triển khai)


| Mục sidebar               | Mô tả ngắn                                                                        |
| ------------------------- | --------------------------------------------------------------------------------- |
| **Trang chủ / Dashboard** | KPI tổng (đơn, doanh thu, tồn cảnh báo) — có thể ghép nhiều API thống kê sau này. |


---

## 2. Bán hàng & khách


| Mục               | Ghi chú                                                            |
| ----------------- | ------------------------------------------------------------------ |
| **Khách hàng**    | Danh sách B2C/B2B, công nợ, điều chỉnh nợ — `api/admin/customers`. |
| **Đơn hàng**      | Toàn bộ đơn, lọc trạng thái — `api/admin/orders`.                  |
| **Báo giá (B2B)** | Xem mọi báo giá (hỗ trợ vận hành) — `api/admin/quotes`.            |
| **Hợp đồng**      | Tạo/sửa/gửi khách/hủy — `api/admin/contracts`.                     |


---

## 3. Danh mục & sản phẩm (thường **AdminOnly** trong code hiện tại)


| Mục                      | Ghi chú                                                          |
| ------------------------ | ---------------------------------------------------------------- |
| **Danh mục**             | Cây danh mục — `api/admin/categories`.                           |
| **Sản phẩm**             | CRUD sản phẩm — `api/admin/products`.                            |
| **Thuộc tính & giá trị** | Theo từng sản phẩm — `.../attributes`, `.../values`.             |
| **Biến thể (SKU)**       | SKU, giá — `.../variants`; tra SKU nhanh — `api/admin/variants`. |
| **Upload media**         | Ảnh/tài liệu — `api/admin/uploads`.                              |


---

## 4. Kho & xuất hàng


| Mục                          | Ghi chú                                                                                      |
| ---------------------------- | -------------------------------------------------------------------------------------------- |
| **Tồn kho**                  | Theo variant — `api/admin/products/.../inventory`.                                           |
| **Giao dịch kho**            | IN/OUT/RESERVE/RELEASE — `api/admin/inventory-transactions`.                                 |
| **Phiếu xuất / fulfillment** | Danh sách, trạng thái, gán worker — `api/admin/fulfillments`, `.../orders/.../fulfillments`. |


*Admin có trong policy **WarehouseStaff** nên xem được toàn bộ mục kho.*

---

## 5. Tài chính & khuyến mãi


| Mục                        | Ghi chú                |
| -------------------------- | ---------------------- |
| **Hóa đơn**                | `api/admin/invoices`.  |
| **Thanh toán / hoàn tiền** | `api/admin/payments`.  |
| **Chiến dịch**             | `api/admin/campaigns`. |
| **Voucher**                | `api/admin/vouchers`.  |


---

## 6. Hậu mãi


| Mục           | Ghi chú                                                          |
| ------------- | ---------------------------------------------------------------- |
| **Bảo hành**  | Phiếu + claim — `api/admin/warranty-tickets`, `warranty-claims`. |
| **Đổi / trả** | Phiếu đổi trả — `api/admin/returns`.                             |


---

## 7. Hệ thống & nhân sự


| Mục                   | Ghi chú                                                                                              |
| --------------------- | ---------------------------------------------------------------------------------------------------- |
| **Người dùng nội bộ** | CRUD user, reset mật khẩu — `api/admin/users`.                                                       |
| **Vai trò (Role)**    | Nếu có màn CRUD — `api/Role` (route không nằm dưới `admin`).                                         |
| **Cài đặt**           | JWT, tích hợp (PayOS, Cloudinary…) — thường là env / backend; UI chỉ placeholder hoặc link tài liệu. |


---

## 8. Không bắt buộc hiển thị riêng

- **Đăng xuất / Đổi mật khẩu:** header user menu thay vì sidebar.
- **Swagger:** chỉ dev/staging, không đưa vào sidebar production.

---

*Tài liệu đối chiếu actor: `[../actors.md](../actors.md)`. API: `[../guidelineUI/tich_hop_api_fe.md](../guidelineUI/tich_hop_api_fe.md)`.*