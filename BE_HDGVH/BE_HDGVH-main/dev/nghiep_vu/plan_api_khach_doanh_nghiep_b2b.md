# Kế hoạch API: Khách doanh nghiệp (B2B)

Tài liệu lập theo **schema hiện tại** (`Customer`, `Quote`, `QuoteItem`, `Contract`, `CustomerOrder` / `[Order]`, `OrderItem`, `Invoice`, `PaymentTransaction`, `ProductVariant`, `Inventory`, …), luồng **3.2** (Báo giá → hợp đồng → đơn), **3.4** (hóa đơn & công nợ) và ghi chú **3.5** (chiết khấu chủ yếu qua Quote) trong [`chi_tiet_nghiep_vu.md`](../chi_tiet_nghiep_vu.md), cùng **convention** backend (`ResponseDto`, `GlobalExceptionHandler`, Service/Repository).

**Phạm vi tài liệu này:** cổng **khách hàng doanh nghiệp** (đăng nhập DN, gửi/xem báo giá, xem hợp đồng, đơn phát sinh từ B2B, hóa đơn & dư nợ đọc được). **Không** gồm toàn bộ màn hình **Sales/Manager** (soạn báo giá, duyệt giá, chốt hợp đồng nội bộ) — nên tách **plan API nhân sự B2B** (hoặc mở rộng `api/admin/...`) ở tài liệu riêng.

**Đối chiếu:** [`plan_api_khach_le_b2c.md`](plan_api_khach_le_b2c.md) (store B2C, giỏ, payOS).

---

## 1. Mục tiêu & phạm vi

**Mục tiêu:** Web/app (hoặc portal) cho **khách B2B** **đăng ký/đăng nhập** với thông tin pháp nhân, **gửi yêu cầu báo giá** (danh sách variant + SL), **theo dõi trạng thái báo giá**, **xem hợp đồng** đã gắn báo giá, **theo dõi đơn** (`Order` có `QuoteId` / `ContractId`), **xem hóa đơn & dư nợ** (`Customer.DebtBalance`, `Invoice`).

**Ngoài phạm vi / phase sau (ghi rõ để tránh trộn):**

- **Workflow duyệt giá** (Manager), chỉnh `Quote` giá/chiết khấu — thuộc **nhân sự**, không phải API “khách tự sửa giá”.
- **Chuyển Quote → Contract → Order** do **Sales/Admin** thao tác (hoặc tự động batch) — khách chỉ **xác nhận/đồng ý** nếu nghiệp vụ có bước đó (cần quyết định sản phẩm: nút “Chấp nhận báo giá” có tạo sự kiện hay chỉ thông báo).
- **Ghi nhận thanh toán / trừ công nợ** (`PaymentTransaction`) — thường do **kế toán/Admin**; B2B portal chỉ **đọc** trừ khi có luồng “khách upload biên lai” (phase sau).
- **Giỏ server B2B** riêng — có thể **không** cần nếu RFQ gửi thẳng `Quote` + `QuoteItem`; hoặc tái dùng payload `items[]` một lần khi tạo yêu cầu.
- **Tích hợp ký số / upload hợp đồng đã ký** — có sẵn `Contract.AttachmentUrl`; API upload có thể tái dùng Cloudinary (raw) hoặc policy riêng.

---

## 2. Căn cứ database (B2B — khách)

| Entity / bảng | Vai trò API khách B2B |
|---------------|------------------------|
| **Customer** | `CustomerType` = **`B2B`** (chuẩn hóa constant trong code, hiện `CustomerTypes` mới có `B2C` — cần bổ sung `B2B`). Các field: `CompanyName`, `TaxCode`, `CompanyAddress`, `DebtBalance`, `FullName` (người đại diện), `Email`, `Phone`, `PasswordHash`. |
| **Quote** | Báo giá: `QuoteCode`, `CustomerId`, `Status`, `TotalAmount`, `DiscountType`/`DiscountValue`, `FinalAmount`, `SalesId`/`ManagerId` (chỉ đọc từ phía khách). Khách **tạo** bản ghi ở trạng thái đầu (vd. `CustomerRequested` / `Draft` — cần **chuỗi trạng thái** thống nhất với nghiệp vụ). |
| **QuoteItem** | Dòng hàng: `VariantId`, `Quantity`, `UnitPrice` (giá do **Sales** điền sau; lúc khách gửi có thể để 0 hoặc giá tham chiếu `RetailPrice` read-only). |
| **Contract** | `ContractNumber`, `QuoteId`, `CustomerId`, `Status`, điều khoản thanh toán, ngày hiệu lực, `AttachmentUrl`. Khách **đọc**; tạo/sửa **nhân sự**. |
| **CustomerOrder** (`Order`) | Đơn B2B: thường có `QuoteId` và/hoặc `ContractId`, `SalesId`; `VoucherId` ít dùng (ưu tiên chiết khấu trên Quote). |
| **OrderItem** | Snapshot giống B2C. |
| **Invoice** | `ContractId` / `OrderId`, `DueDate`, `Status`, số tiền — khách **đọc**. |
| **PaymentTransaction** | (Tuỳ phase) khách chỉ xem lịch sử ghi nhận đã public cho DN. |
| **ProductVariant** / **Inventory** | Khách chỉ cần **đọc** catalog/variant (có thể **tái sử dụng** API store public hoặc nhân bản prefix `api/b2b/...` chỉ thêm policy optional). |

---

## 3. Xác thực & phân quyền (đề xuất)

**Tách JWT khách B2B** tương tự B2C (cùng pattern issuer/audience hoặc tách audience `b2b`):

| Policy gợi ý | Điều kiện |
|--------------|-----------|
| **`CustomerB2BAuthenticated`** (tên có thể rút gọn) | `PrincipalKind = Customer` **và** claim `CustomerType = B2B` (hoặc kiểm tra DB mỗi request — kém hiệu năng). |
| **Catalog** | `AllowAnonymous` hoặc dùng chung `api/store/...` đã có. |

**Giới hạn dữ liệu:** mọi API `/me/...` hoặc `/customers/me/...` **chỉ** `CustomerId` từ token; `QuoteCode`/`ContractNumber` trên URL phải verify **thuộc** khách đó.

**Không** cho B2B dùng policy `CustomerAuthenticated` của B2C nếu muốn tách rõ luồng (tránh B2C token gọi API báo giá). Có thể dùng **một** JWT customer với claim type, hoặc **hai** endpoint đăng nhập (`/store/auth/*` vs `/b2b/auth/*`).

---

## 4. Chuỗi trạng thái (cần chốt trước code)

Gợi ý khớp [`chi_tiet_nghiep_vu.md`](../chi_tiet_nghiep_vu.md) mục 3.2:

| Đối tượng | Trạng thái (ví dụ) | Ghi chú |
|-----------|-------------------|---------|
| **Quote** | `CustomerRequested` → `Draft` (Sales đang soạn) → `PendingManagerApproval` → `Approved` / `Rejected` → `SentToCustomer` → `Accepted` / `Expired` | Tên chính xác lưu `string` trên entity; có thể bổ sung migration **constraint** hoặc chỉ validate ở service. |
| **Contract** | `Draft` → `Active` → `Completed` / `Cancelled` | |
| **Invoice** | `Unpaid` → `PartiallyPaid` → `Paid` (nếu mở rộng) | Hiện entity có `Status` dạng chuỗi. |

---

## 5. Các nhóm endpoint (đề xuất)

Prefix gợi ý **`api/b2b/`** (tách biệt `api/store/` B2C).

### 5.1 Tài khoản & hồ sơ DN

| # | Method | Route gợi ý | Mô tả |
|---|--------|-------------|--------|
| B-U1 | `POST` | `api/b2b/auth/register` | Tạo `Customer` với `CustomerType = B2B`, bắt buộc `CompanyName`, `TaxCode` (unique?), `Phone`, `Email`, hash mật khẩu. |
| B-U2 | `POST` | `api/b2b/auth/login` | JWT B2B (issuer/claim giống convention đã chọn). |
| B-U3 | `GET` | `api/b2b/auth/me` | Profile + thông tin công ty + `DebtBalance` (đọc). |
| B-U4 | `PUT` | `api/b2b/auth/me` | Cập nhật người liên hệ, SĐT, email, địa chỉ công ty (không tự đổi `CustomerType`). |

### 5.2 Địa chỉ (tuỳ nghiệp vụ)

Có thể **tái sử dụng** cấu trúc `CustomerAddress` với policy B2B, route ví dụ `api/b2b/me/addresses` (mirror store) **hoặc** chỉ dùng `CompanyAddress` trên `Customer` nếu DN chỉ cần một địa chỉ giao hàng mặc định.

### 5.3 Yêu cầu báo giá (RFQ → Quote)

| # | Method | Route gợi ý | Mô tả |
|---|--------|-------------|--------|
| B-Q1 | `POST` | `api/b2b/quotes` | Body: `items[]` (`variantId`, `quantity`), `note?`. Tạo `Quote` + `QuoteItem`; `Status` = `CustomerRequested` (hoặc tên đã chốt); `UnitPrice`/`SubTotal` rule: 0 hoặc snapshot `RetailPrice` chỉ để hiển thị. |
| B-Q2 | `GET` | `api/b2b/quotes` | Danh sách báo giá của khách (phân trang). |
| B-Q3 | `GET` | `api/b2b/quotes/{quoteCode}` | Chi tiết + dòng hàng + giá sau khi Sales cập nhật (read-only). |
| B-Q4 | `POST` | `api/b2b/quotes/{quoteCode}/accept` | (Optional) Khách chấp nhận báo giá đã `SentToCustomer` — cập nhật `Status`, có thể trigger thông báo nội bộ (không tự sinh `Contract` nếu nghiệp vụ bắt Sales tạo). |

**Không** cho khách `PUT` giá/ chiết khấu trên `Quote` (vi phạm luồng 3.2).

### 5.4 Hợp đồng

| # | Method | Route gợi ý | Mô tả |
|---|--------|-------------|--------|
| B-C1 | `GET` | `api/b2b/contracts` | Danh sách hợp đồng của `CustomerId`. |
| B-C2 | `GET` | `api/b2b/contracts/{contractNumber}` | Chi tiết + tham chiếu `quoteCode`, trạng thái, điều khoản, `AttachmentUrl`. |

### 5.5 Đơn hàng B2B

| # | Method | Route gợi ý | Mô tả |
|---|--------|-------------|--------|
| B-O1 | `GET` | `api/b2b/me/orders` | `CustomerOrder` có `QuoteId != null` hoặc `ContractId != null` (rule rõ trong service). |
| B-O2 | `GET` | `api/b2b/me/orders/{orderCode}` | Chi tiết + dòng hàng (giống store nhưng policy B2B). |

### 5.6 Hóa đơn & công nợ (đọc)

| # | Method | Route gợi ý | Mô tả |
|---|--------|-------------|--------|
| B-F1 | `GET` | `api/b2b/me/finance/summary` | `DebtBalance`, tổng hóa đơn chưa thanh toán (aggregate từ `Invoice`). |
| B-F2 | `GET` | `api/b2b/me/invoices` | Danh sách hóa đơn. |
| B-F3 | `GET` | `api/b2b/me/invoices/{invoiceNumber}` | Chi tiết. |

### 5.7 Catalog (tuỳ chọn)

- **Không làm mới:** dùng `GET api/store/...` từ FE B2B.
- **Hoặc** proxy `api/b2b/catalog/*` trỏ cùng service read-only để CORS/route tách.

---

## 6. API nhân sự (ghi nhớ tách plan)

Để luồng 3.2 khép kín, cần thêm (không thuộc “actor khách”):

- Sales: CRUD `Quote`/`QuoteItem`, đổi `Status`, gán `SalesId`.
- Manager: duyệt (`ManagerId`, trạng thái `PendingManagerApproval` → `Approved`).
- Tạo `Contract` từ `Quote`, chuyển `Order` từ `Contract`/`Quote`.

Có thể gom vào **`plan_api_nhan_su_b2b_sales.md`** hoặc mở rộng `api/admin/...` với policy `StaffAuthenticated` + role Sales/Manager.

---

## 7. Thứ tự triển khai đề xuất (phase)

| Phase | Nội dung |
|-------|----------|
| **BB0** | Thêm `CustomerTypes.B2B`, policy `CustomerB2BAuthenticated`, JWT claim/type (và có thể tách login register B2B). |
| **BB1** | B-U1–B-U4 (đăng ký/đăng nhập/me) + validate `TaxCode`/`Email` theo rule DN. |
| **BB2** | B-Q1–B-Q3 (tạo & xem báo giá) + kiểm tra `Variant`/`Product` Active, tồn có thể chỉ cảnh báo (không trừ kho lúc RFQ). |
| **BB3** | B-C1–B-C2, B-O1–B-O2. |
| **BB4** | B-F1–B-F3 (tổng hợp từ `Invoice` + `DebtBalance`). |
| **BB5** | B-Q4 (accept quote) + thông báo/email (MailKit) nếu cần. |
| **BB6** | (Song song hoặc trước BB2) API **nhân sự** chỉnh `Quote`/duyệt/tạo `Contract`. |

---

## 8. Checklist tổng hợp

- [ ] **BB0** — Constant `B2B`, policy JWT, tách hoặc ràng buộc token B2C vs B2B  
- [ ] **BB1** — Đăng ký / đăng nhập / profile DN  
- [ ] **BB2** — Gửi & xem báo giá (RFQ)  
- [ ] **BB3** — Hợp đồng & đơn B2B (đọc)  
- [ ] **BB4** — Hóa đơn & tóm tắt công nợ  
- [ ] **BB5** — (Optional) Chấp nhận báo giá phía khách  
- [ ] **Staff** — Plan riêng Sales/Manager cho Quote/Contract/Order  

---

## 9. Liên kết

- Luồng nghiệp vụ: [`chi_tiet_nghiep_vu.md`](../chi_tiet_nghiep_vu.md) (3.2, 3.4, 3.5).  
- B2C đã implement: [`plan_api_khach_le_b2c.md`](plan_api_khach_le_b2c.md).  
- DB: [`DB_EXPLANATION.md`](../DB_EXPLANATION.md).  
- Response & lỗi: [`api_response_va_xu_ly_loi.md`](../api_response_va_xu_ly_loi.md).  
- Auth: [`authorization.md`](../authorization.md).  

---

*Cập nhật file khi chốt bảng trạng thái `Quote`/`Contract`, hoặc khi thêm bảng RFQ tách khỏi `Quote`.*
