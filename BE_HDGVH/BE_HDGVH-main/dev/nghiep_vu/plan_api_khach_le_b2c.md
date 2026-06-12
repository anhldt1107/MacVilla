# Kế hoạch API: Khách lẻ (B2C)

Tài liệu lập theo **schema hiện tại** (`Customer`, `CustomerAddress`, `CustomerOrder` / bảng `[Order]`, `OrderItem`, `Product`, `ProductVariant`, `Inventory`, `Voucher`, …), luồng **3.1** trong [`chi_tiet_nghiep_vu.md`](../chi_tiet_nghiep_vu.md), và **convention** backend (`ResponseDto`, `GlobalExceptionHandler`, Service/Repository).

**Phạm vi:** chỉ **khách lẻ (B2C)** — không gồm báo giá/hợp đồng/công nợ B2B (sẽ tách plan riêng nếu cần).

---

## 1. Mục tiêu & phạm vi

**Mục tiêu:** Web/app cho khách lẻ **xem catalog**, **đăng ký/đăng nhập**, **quản lý địa chỉ**, **đặt hàng** (chọn variant + số lượng, voucher, địa chỉ giao), **xem đơn & trạng thái**, và **thanh toán** (tích hợp cổng — repo đã có package `payOS`).

**Ngoài phạm vi / giai đoạn sau:**

- Bảng **Giỏ hàng server-side** (`Cart` / `CartItem`) — hiện **chưa có** trong migration; giai đoạn 1 có thể **tạo đơn từ payload dòng hàng** (client giữ giỏ) hoặc bổ sung migration sau.
- **Giữ chỗ tồn kho (reserve)** khi thêm giỏ / khi tạo đơn — cần rule nghiệp vụ + có thể dùng `Inventory.QuantityReserved` / `InventoryTransaction`; ghi rõ trong phase.
- **Wishlist**, đánh giá sản phẩm, chat — chưa có entity.
- Upload ảnh đánh giá / avatar — ngoài phạm vi.

---

## 2. Căn cứ database (B2C)

| Entity / bảng | Ảnh hưởng API |
|---------------|----------------|
| **Customer** | `CustomerType` nên cố định `"B2C"` khi đăng ký lẻ; `PasswordHash` nullable (khách vãng lai ít dùng — tuỳ sản phẩm); `DebtBalance` B2C thường 0. |
| **CustomerAddress** | Nhiều địa chỉ / `IsDefault`; FK `CustomerId`. |
| **CustomerOrder** (`Order`) | `CustomerId`, `OrderCode` unique, `VoucherId?`, `PaymentMethod`, `PaymentStatus`, `OrderStatus`, `ShippingAddressId?`; `QuoteId`/`ContractId`/`SalesId` thường **null** cho đơn tự đặt B2C. |
| **OrderItem** | `VariantId`, `PriceSnapshot`, `SkuSnapshot`, `Quantity`, `SubTotal` — snapshot tại thời điểm đặt. |
| **Product** / **ProductVariant** | Chỉ expose ngoài site sản phẩm **Status** phù hợp (vd. `Active`); giá bán lẻ từ `RetailPrice`. |
| **Inventory** | Kiểm tra `QuantityAvailable` (hoặc rule tương đương) trước khi chốt đơn. |
| **Voucher** | `Code` unique; `DiscountType`, `MinOrderValue`, `MaxDiscountAmount`, `UsageLimit` / `UsedCount`, `Status`. |

---

## 3. Xác thực & phân quyền (đề xuất)

Hiện JWT đang phục vụ **nhân sự** (`AppUser`, claim `Role`). B2C nên **tách rõ**:

| Hướng | Mô tả |
|-------|--------|
| **A (khuyến nghị)** | JWT riêng cho customer (issuer/audience hoặc claim `sub` = `CustomerId`, **không** dùng `Role` staff) + policy `Policies.CustomerAuthenticated`. |
| **B** | Cùng scheme Bearer nhưng claim phân loại `user_type=customer` vs `staff` — handler `IAuthorizationHandler` kiểm tra. |

**Catalog công khai:** `AllowAnonymous` hoặc optional auth (ưu đãi member).

**Giới hạn dữ liệu:** mọi API “của tôi” (`/me/orders`, …) **bắt buộc** lọc theo `CustomerId` từ token — không tin query param.

---

## 4. Các nhóm endpoint (theo hạng mục)

Route gợi ý prefix **`api/store/`** hoặc **`api/b2c/`** để tách khỏi `api/admin/`.

### 4.1 Catalog công khai (đọc)

| # | Method | Route gợi ý | Mô tả |
|---|--------|---------------|--------|
| S1 | `GET` | `api/store/categories` | Cây hoặc danh sách danh mục (chỉ node cần cho menu). |
| S2 | `GET` | `api/store/products` | Danh sách SP: phân trang, lọc `categoryId` (+ **gồm nhánh con** giống admin), `search`, chỉ `Status=Active`. |
| S3 | `GET` | `api/store/products/id/{id}` | Chi tiết SP theo **id số** (chỉ `Active`); cùng payload với S3b. |
| S3b | `GET` | `api/store/products/{slugOrId}` | Chi tiết SP theo **slug** hoặc chuỗi số (ưu tiên id nếu parse được và tồn tại Active). |
| S4 | `GET` | `api/store/variants/by-sku/{**sku}` | Tra cứu nhanh (quét mã) — tùy chọn, có thể gộp vào S3. |

**Ghi chú:** có thể tái sử dụng logic subtree category như `ProductService` (read-only, filter `Active`).

---

### 4.2 Tài khoản khách (B2C)

| # | Method | Route gợi ý | Mô tả |
|---|--------|---------------|--------|
| U1 | `POST` | `api/store/auth/register` | Tạo `Customer` với `CustomerType=B2C`, hash mật khẩu (BCrypt). |
| U2 | `POST` | `api/store/auth/login` | Trả JWT customer (hoặc session tuỳ kiến trúc). |
| U3 | `GET` | `api/store/auth/me` | Profile: tên, email, phone. |
| U4 | `PUT` | `api/store/auth/me` | Cập nhật profile (không đổi type sang B2B tại đây). |

**Validation:** email/phone unique tuỳ rule nghiệp vụ (hiện DB có thể cần index — kiểm tra migration).

---

### 4.3 Sổ địa chỉ

| # | Method | Route gợi ý | Mô tả |
|---|--------|---------------|--------|
| D1 | `GET` | `api/store/me/addresses` | Danh sách địa chỉ. |
| D2 | `POST` | `api/store/me/addresses` | Thêm. |
| D3 | `PUT` | `api/store/me/addresses/{id}` | Sửa. |
| D4 | `DELETE` | `api/store/me/addresses/{id}` | Xóa (chặn nếu đang là địa chỉ bắt buộc của đơn đang xử lý — rule sau). |
| D5 | `POST` | `api/store/me/addresses/{id}/set-default` | Một địa chỉ `IsDefault=true`, bỏ default cũ. |

---

### 4.4 Voucher (B2C)

| # | Method | Route gợi ý | Mô tả |
|---|--------|---------------|--------|
| V1 | `POST` | `api/store/vouchers/validate` | Body: `code` + (optional) tạm tính giỏ → trả %/số tiền giảm, lỗi nếu hết hạn / hết lượt / không đủ min order. |

Áp dụng chính thức khi **tạo đơn** (server tính lại để chống gian lận).

---

### 4.5 Đơn hàng (checkout & theo dõi) — **hướng tối ưu**

**Nguyên tắc:** một nguồn dòng hàng khi đặt = **giỏ server** (`ShoppingCarts` / `ShoppingCartItems`, đã migration `20260322120000_AddShoppingCart.cs`). Khách **B2C đã đăng nhập** (`CustomerAuthenticated`). **Không** trộn cùng lúc `items[]` trong body checkout với giỏ DB (tránh hai nguồn, tránh gian lận). Mọi giá / tồn / voucher **tính lại trên server** lúc preview và lúc tạo đơn.

| Bảng | Vai trò |
|------|---------|
| `ShoppingCarts` | `CustomerId` **unique**, `UpdatedAt`; xóa khách → cascade xóa giỏ. |
| `ShoppingCartItems` | `VariantId`, `Quantity`; unique `(ShoppingCartId, VariantId)`; FK variant **Restrict**. |

#### Luồng nghiệp vụ (thứ tự gợi ý cho FE)

1. **Quản lý giỏ** — API `api/store/me/cart` (implement sau; policy `CustomerAuthenticated`): GET giỏ (kèm giá hiển thị & tồn đọc được), POST/PUT thêm hoặc cập nhật SL, DELETE dòng. Validate: `Product.Status = Active`, `Quantity > 0`, có thể cảnh báo vượt `QuantityAvailable` (chặn cứng tại **O2** là bắt buộc).
2. **Voucher (tuỳ chọn)** — `POST api/store/vouchers/validate` với `subTotal` = tạm tính từ giỏ để hiển thị; **O2** gọi lại cùng logic / shared service để chống chỉnh số trên client.
3. **Preview** — O1: không ghi `Order`, không trừ tồn, không tăng `UsedCount` voucher.
4. **Đặt hàng** — O2: **một transaction** — đọc giỏ → kiểm tra địa chỉ thuộc `CustomerId` → kiểm tra từng dòng (giá bán lẻ hiện tại, tồn đủ) → áp voucher hợp lệ → tạo `CustomerOrder` + `OrderItem` (snapshot `PriceSnapshot`, `SkuSnapshot`) → cập nhật `Voucher.UsedCount` nếu có → **xóa toàn bộ dòng giỏ** (hoặc xóa giỏ). Sinh `OrderCode` unique.
5. **Theo dõi** — O3/O4 chỉ dữ liệu của `CustomerId` trong JWT.

#### Bảng endpoint (O + giỏ)

| # | Method | Route gợi ý | Mô tả |
|---|--------|---------------|--------|
| C1 | `GET` | `api/store/me/cart` | Giỏ hiện tại + dòng (variant, SL, đơn giá, dòng tổng; có thể kèm cảnh báo tồn). |
| C2 | `POST` | `api/store/me/cart/items` | Thêm hoặc **upsert** theo `variantId` + `quantity`. |
| C3 | `PUT` | `api/store/me/cart/items/{variantId}` | Đổi số lượng (hoặc gộp vào C2). |
| C4 | `DELETE` | `api/store/me/cart/items/{variantId}` | Xóa dòng. |
| C5 | `DELETE` | `api/store/me/cart` | Làm rỗng giỏ (tuỳ chọn). |
| O1 | `POST` | `api/store/orders/preview` | Body: `shippingAddressId?`, `voucherCode?` — nguồn dòng = **giỏ**; trả tạm tính, giảm giá, tổng thanh toán; **không** ghi DB. |
| O2 | `POST` | `api/store/orders` | Cùng kiểu body như O1 (+ `paymentMethod`…); **ghi đơn** theo giỏ rồi clear giỏ. |
| O3 | `GET` | `api/store/me/orders` | Lịch sử (phân trang). |
| O4 | `GET` | `api/store/me/orders/{orderCode}` | Chi tiết + `OrderItem` (chỉ owner). |

**Policy:** O1/O2/O3/O4 dùng `CustomerAuthenticated` (trừ khi sau này bổ sung **guest checkout** — tách rõ endpoint hoặc `items[]` + email/SĐT, không trộn với giỏ đăng nhập).

**Trạng thái đơn:** document `OrderStatus`, `PaymentStatus` (chuỗi hiện có trong entity) cho FE; mở rộng `AwaitingPayment` nếu cần gắn payOS (mục 4.6).

#### Pha sau (không chặn MVP)

- **Guest / mua nhanh:** endpoint riêng hoặc body `items[]` **chỉ** cho luồng không đăng nhập — không đọc `ShoppingCart`.
- **Giữ chỗ tồn:** khi thêm giỏ hoặc khi O2 — tách phase (B7).
- **Phí vận chuyển:** thêm vào O1/O2 khi có bảng cấu hình.

---

### 4.6 Thanh toán

| # | Method | Route gợi ý | Mô tả |
|---|--------|---------------|--------|
| P1 | `POST` | `api/store/payments/payos/create` | Tạo link/thanh toán payOS cho `orderId`/`orderCode` đã có. |
| P2 | `POST` | `api/store/payments/payos/webhook` | Webhook IPN (signature), cập nhật `PaymentStatus` / gọi kho — **AllowAnonymous** nhưng bảo mật chữ ký. |

Chi tiết tham số theo tài liệu **payOS** và cấu hình `appsettings`.

**Khách đóng trình duyệt sau khi tạo link — đơn đang ở trạng thái nào, có thanh toán lại được không?**

- **Đơn hàng (`CustomerOrder`)** không biến mất: vẫn một dòng trong DB. Sau khi checkout thành công, gợi ý giữ **`OrderStatus`** ở trạng thái “chờ thanh toán” (vd. mở rộng từ mặc định hiện tại `"New"`, hoặc thêm `"AwaitingPayment"` nếu team chuẩn hoá chuỗi) và **`PaymentStatus = "Unpaid"`** cho đến khi webhook (hoặc API tra cứu) xác nhận đã thu tiền → khi đó **`PaymentStatus = "Paid"`** (và `OrderStatus` chuyển sang bước xử lý tiếp, vd. `"Confirmed"`).
- **Record “mới”** khi gọi lại `payos/create` thường là **phiên thanh toán payOS** (hoặc bảng log nội bộ), **không** bắt buộc tạo đơn mới. Khách **được phép** gọi lại **P1** cho **cùng `orderCode`** miễn đơn vẫn `Unpaid` và chưa bị hủy/hết hạn (nếu sau này có policy hủy đơn quá hạn).
- **Thiết kế P1 nên làm rõ một trong hai hướng:** (1) **Idempotent:** nếu đã có link payOS còn hiệu lực cho đơn này thì trả lại cùng URL, không tạo thêm giao dịch trùng; (2) **Mỗi lần gọi tạo request mới** trên payOS thì phải lưu `payOS order id` / correlation, xử lý webhook **theo `orderCode` (hoặc metadata)** và **idempotent** (nếu hai link, chỉ một lần thanh toán thành công vẫn cập nhật đúng một đơn, tránh double-apply). Tránh coi “mỗi lần tạo link = đơn mới” trừ khi nghiệp vụ cố ý tách.

---

## 5. Thứ tự triển khai đề xuất (phase)

| Phase | Nội dung |
|-------|----------|
| **B0** | Claim `principal_kind` + policy `CustomerAuthenticated` / siết `StaffAuthenticated` (cùng issuer/audience JWT). |
| **B1** | Catalog công khai **S1–S4** (đã có). |
| **B2** | **U1–U4** đăng ký / đăng nhập / profile (đã có `api/store/auth`). |
| **B3** | **D1–D5** địa chỉ (đã có `api/store/me/addresses`). |
| **B4** | **C1–C5** API giỏ (đã có). |
| **B5** | **O1–O4** preview/checkout/lịch sử/chi tiết (đã có; voucher `VoucherComputation` + tăng `UsedCount` khi O2). |
| **B6** | **P1–P2** payOS + cập nhật `PaymentStatus` / `OrderStatus`. |
| **B7** | (Sau) **Reserve tồn**; guest checkout / `items[]`; thông báo email (MailKit). |

---

## 6. Checklist tổng hợp

- [x] **S** — Store catalog: S1–S4 + chi tiết theo id (`api/store/products/id/{id}`)  
- [x] **U** — Auth/profile B2C: U1–U4 (`api/store/auth/*`, policy `CustomerAuthenticated`, BCrypt)  
- [x] **D** — Địa chỉ: D1–D5 (`api/store/me/addresses`)  
- [x] **V** — Voucher: V1 `POST api/store/vouchers/validate` (áp dụng khi O2 sau)  
- [x] **C** — Giỏ: C1–C5 (`api/store/me/cart`)  
- [x] **O** — Đơn: O1–O4 (`api/store/orders`, `api/store/me/orders`; cột `MerchandiseTotal`/`DiscountTotal`/`PayableTotal` trên `Order`)  
- [ ] **P** — Thanh toán payOS: P1–P2  

---

## 7. Liên kết

- Luồng nghiệp vụ: [`chi_tiet_nghiep_vu.md`](../chi_tiet_nghiep_vu.md) (mục 3.1, 3.5 voucher).  
- DB: [`DB_EXPLANATION.md`](../DB_EXPLANATION.md).  
- Response & lỗi: [`api_response_va_xu_ly_loi.md`](../api_response_va_xu_ly_loi.md).  
- Admin catalog (đã implement): [`plan_api_master_data_san_pham_admin.md`](plan_api_master_data_san_pham_admin.md).  

---

*Cập nhật file khi bổ sung bảng Cart, đổi rule tồn kho, hoặc tách API B2B.*
