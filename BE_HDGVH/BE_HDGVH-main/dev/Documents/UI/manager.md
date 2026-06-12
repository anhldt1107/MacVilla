# Sidebar đề xuất — **Manager** (quản lý kinh doanh / duyệt)

**Vai trò:** Duyệt báo giá B2B, duyệt đổi trả, giám sát doanh thu & kho ở mức tổng quan; không cần sidebar “master data” đầy đủ như Admin trừ khi nghiệp vụ giao thêm.

**Policy thực tế:** JWT **staff** + role `Manager`; tham gia **WarehouseStaff** (xem lại kho nếu cần).

---

## 1. Trang chủ

| Mục | Mô tả |
|-----|--------|
| **Dashboard** | Đơn chờ duyệt giá, đổi trả chờ duyệt, báo giá PendingApproval, công nợ B2B vượt hạn (widget gọi API lọc). |

---

## 2. Duyệt & giám sát bán hàng

| Mục | Ghi chú |
|-----|---------|
| **Báo giá — hàng chờ duyệt** | Lọc `status=PendingApproval` — `api/admin/quotes`. |
| **Báo giá — tất cả / tìm kiếm** | Theo khách, sales, ngày. |
| **Hợp đồng** | Xem / hỗ trợ hủy nếu được phân quyền — `api/admin/contracts` (tuỳ policy sau này). |
| **Đơn hàng** | Toàn cục, lọc theo trạng thái — `api/admin/orders`. |
| **Khách hàng** | Đặc biệt B2B + **công nợ** — `api/admin/customers`. |

---

## 3. Tài chính (xem & xử lý cấp quản lý)

| Mục | Ghi chú |
|-----|---------|
| **Hóa đơn** | Theo đơn / hợp đồng — `api/admin/invoices`. |
| **Thanh toán** | Đối soát, hoàn — `api/admin/payments`. |

---

## 4. Kho (đọc + điều phối)

| Mục | Ghi chú |
|-----|---------|
| **Phiếu fulfillment** | Theo đơn, trạng thái — `api/admin/fulfillments`. |
| **Tồn kho / Giao dịch** | Xem tồn, xác nhận nghiệp vụ cần Manager — `inventory`, `inventory-transactions`. |

*Ẩn hoặc read-only **CRUD danh mục/sản phẩm** nếu không muốn Manager sửa master data.*

---

## 5. Hậu mãi

| Mục | Ghi chú |
|-----|---------|
| **Đổi / trả — chờ duyệt** | Lọc trạng thái chờ Manager — `api/admin/returns`. |
| **Bảo hành** | Giám sát — `api/admin/warranty-tickets`. |

---

## 6. Ẩn hoặc gom vào “Khác”

| Mục | Lý do |
|-----|--------|
| **Voucher / Campaign** | Chỉ khi Manager được giao phê duyệt khuyến mãi; không thì để Admin/Sales. |
| **Người dùng nội bộ** | Thường chỉ **Admin**; Manager không cần sidebar quản user. |

---

*Tài liệu đối chiếu: [`../actors.md`](../actors.md), luồng B2B [`../guidelineUI/kich_ban_b2b_bao_gia_den_ket_thuc_don.md`](../guidelineUI/kich_ban_b2b_bao_gia_den_ket_thuc_don.md).*
