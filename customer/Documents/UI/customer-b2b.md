# Sidebar đề xuất — **Khách B2B** (doanh nghiệp / cửa hàng B2B)

**Vai trò:** Yêu cầu báo giá, xác nhận báo giá/hợp đồng, theo dõi đơn & thanh toán; dữ liệu `Customer` + `Quote`, `Contract`, `CustomerOrder`, công nợ.

**Auth:** JWT **customer** — prefix `**api/store/b2b/...`**.

---

## 1. Trang chủ


| Mục                        | Mô tả                                                                                     |
| -------------------------- | ----------------------------------------------------------------------------------------- |
| **Dashboard doanh nghiệp** | `/partner/dashboard`: KPI + hoạt động gần đây gộp trên FE từ `quotes`, `contracts?PendingConfirmation`, `debt/summary`, `orders` (đơn mở: tối đa 50 bản ghi đầu). |


---

## 2. Báo giá


| Mục                     | Ghi chú                                               |
| ----------------------- | ----------------------------------------------------- |
| **Yêu cầu báo giá mới** | Form SKU + SL — `POST api/store/b2b/quotes/requests`. |
| **Danh sách báo giá**   | Lọc `status` — `GET api/store/b2b/quotes`.            |
| **Chi tiết báo giá**    | Theo `quoteCode` — `GET .../quotes/{quoteCode}`.      |


*Khi trạng thái **Approved**: hiển thị nút **Chấp nhận / Từ chối / Counter-offer** — các `POST` accept/reject/counter-offer.*

---

## 3. Hợp đồng


| Mục                     | Ghi chú                                                                  |
| ----------------------- | ------------------------------------------------------------------------ |
| **Danh sách hợp đồng**  | `GET api/store/b2b/contracts`.                                           |
| **Chi tiết & xác nhận** | `GET .../contracts/{contractNumber}`, `POST .../contracts/{id}/confirm`. |


---

## 4. Đơn hàng


| Mục                    | Ghi chú                                |
| ---------------------- | -------------------------------------- |
| **Đơn hàng**           | `GET api/store/b2b/orders`.            |
| **Chi tiết đơn**       | `GET .../orders/{orderCode}`.          |
| **Tiến độ (timeline)** | `GET .../orders/{orderCode}/timeline`. |


---

## 5. Tài chính (B2B)

**Sidebar:** một mục **Tài chính** → `/partner/payments/debt`. **Trong cụm tài chính:** thanh điều hướng (Công nợ · Hóa đơn · Thanh toán · Báo CK · Lịch sử) — không lặp 5 dòng con trên sidebar.

| Mục | Ghi chú |
| --- | --- |
| **Công nợ** | `GET /api/store/b2b/debt/summary` |
| **Hóa đơn** | `GET /api/store/b2b/invoices` · `GET /api/store/b2b/invoices/{invoiceNumber}` · PDF: `.../pdf` |
| **Lịch sử giao dịch đã ghi nhận** | `GET /api/store/b2b/payments` (query: `page`, `pageSize`, `invoiceId`, `transactionType`, `fromDate`, `toDate`) · `GET .../payments/{id}` |
| **Thông báo chuyển khoản** | `GET /api/store/b2b/payments/transfer-notifications` · `POST /api/store/b2b/payments/notify-transfer` (body: `referenceCode`, `amount`, `note?`, `attachmentUrl?`, `invoiceId?`) |
| **STK nhận CK (cấu hình)** | `GET /api/store/b2b/payments/bank-transfer-info` — `B2bBankTransfer` trong appsettings · [triển khai](../../../BE_HDGVH/dev/B2b-payments-staging.md) |
| **PayOS** | `POST /api/store/payments/payos/create` (body: `orderCode`, `returnUrl`, `cancelUrl`) — đơn có `paymentMethod=PayOS`, `paymentStatus=Unpaid`; JWT customer. FE B2B gửi `returnUrl`/`cancelUrl` về `/partner/payments/pay`; whitelist origin trên PayOS (fallback appsettings thường dùng cho store checkout). |


---

## 6. Hậu mãi


| Mục                    | Ghi chú                                                       |
| ---------------------- | ------------------------------------------------------------- |
| **Bảo hành / đổi trả** | `api/store/b2b/...` after-sales (theo controller trong repo). |


---

## 7. Tài khoản doanh nghiệp


| Mục            | Ghi chú                                                                |
| -------------- | ---------------------------------------------------------------------- |
| **Hồ sơ**      | `GET/PUT api/store/b2b/auth/me`.                                       |
| **Sổ địa chỉ** | Nếu dùng chung module địa chỉ store — endpoint địa chỉ B2B (xem repo). |
| **Đăng xuất**  | Header.                                                                |


---

## 8. Không đưa vào sidebar B2B


| Mục                            | Lý do              |
| ------------------------------ | ------------------ |
| **CRUD sản phẩm / kho nội bộ** | Thuộc admin/staff. |
| **Duyệt báo giá**              | Manager nội bộ.    |


---

*API chi tiết: `[../guidelineUI/tich_hop_api_fe.md](../guidelineUI/tich_hop_api_fe.md)`. Luồng: `[../guidelineUI/kich_ban_b2b_bao_gia_den_ket_thuc_don.md](../guidelineUI/kich_ban_b2b_bao_gia_den_ket_thuc_don.md)`. Demo tài chính B2B: `[../demo_b2b_tai_chinh.md](../demo_b2b_tai_chinh.md)`.*