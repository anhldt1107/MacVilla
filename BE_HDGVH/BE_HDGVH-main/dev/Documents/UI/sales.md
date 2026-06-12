# Sidebar đề xuất — **Sales** (kinh doanh)

**Vai trò:** B2B — tiếp nhận báo giá, soạn giá, chuyển đơn; B2C — hỗ trợ đơn tại quầy; chăm sóc khách; **không** ưu tiên sidebar kho chi tiết (policy **WarehouseStaff** không gồm `Sales` — các API tồn/fulfillment sẽ 403).

---

## 1. Trang chủ

| Mục | Mô tả |
|-----|--------|
| **Dashboard Sales** | Báo giá `Requested` / `Draft` của mình, đơn gán `salesId`, báo giá chờ khách phản hồi. |

---

## 2. Báo giá B2B (trọng tâm)

| Mục | Ghi chú |
|-----|---------|
| **Hàng chờ tiếp nhận** | Lọc `Requested` (và luồng assign) — `api/admin/quotes`. |
| **Báo giá của tôi** | Lọc `salesId` = user hiện tại. |
| **Tất cả báo giá** | Tìm theo mã, khách (nếu được phân quyền xem). |
| **Tạo báo giá mới** | Cho khách B2B — `POST api/admin/quotes`. |

*Sau khi khách **CustomerAccepted**: có thể hiển thị CTA **Chuyển đơn**; nút **Giữ tồn** chỉ bật nếu user có quyền kho (hiện tại Sales **không** có WarehouseStaff — cần đổi policy hoặc ẩn nút.)*

---

## 3. Hợp đồng (B2B)

| Mục | Ghi chú |
|-----|---------|
| **Hợp đồng** | Tạo draft, sửa, gửi khách xác nhận — `api/admin/contracts`. |

---

## 4. Đơn hàng

| Mục | Ghi chú |
|-----|---------|
| **Đơn hàng** | Danh sách; lọc theo khách / trạng thái — `api/admin/orders`. |
| **Tạo đơn hộ khách** | B2C/B2B tại quầy — `POST api/admin/orders` (nếu nghiệp vụ dùng). |

---

## 5. Khách hàng

| Mục | Ghi chú |
|-----|---------|
| **Khách hàng** | Tạo/sửa B2B, xem địa chỉ, lịch sử đơn — `api/admin/customers`. |

---

## 6. Tài chính (hỗ trợ bán)

| Mục | Ghi chú |
|-----|---------|
| **Hóa đơn** | Lập/xem theo đơn — `api/admin/invoices` (theo quy định công ty). |
| **Thanh toán** | Ghi nhận thanh toán khách — `api/admin/payments`. |

---

## 7. Hậu mãi (CSKH bán hàng)

| Mục | Ghi chú |
|-----|---------|
| **Bảo hành** | Mở phiếu, claim — `api/admin/warranty-tickets`. |
| **Đổi / trả** | Tạo yêu cầu (nếu được giao) — `api/admin/returns`. |

---

## 8. Ẩn / không đưa vào sidebar Sales

| Mục | Lý do |
|-----|--------|
| **Danh mục / Sản phẩm / SKU master** | Thuộc Admin (trừ khi có policy mở cho Sales chỉ đọc). |
| **Tồn kho / Phiếu fulfillment** | API kho yêu cầu **WarehouseStaff** — Sales dễ 403. |
| **Voucher / Campaign** | Tuỳ tổ chức; thường Marketing/Admin. |
| **Quản user** | Chỉ Admin. |

---

*Tài liệu đối chiếu: [`../actors.md`](../actors.md).*
