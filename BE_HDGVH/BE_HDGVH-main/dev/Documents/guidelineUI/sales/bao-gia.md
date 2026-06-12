# Sales — Báo giá (`/api/admin/quotes`)

## Mục đích

**Trọng tâm của Sales:** tiếp nhận yêu cầu báo giá từ khách (qua cổng B2B hoặc tạo hộ), soạn giá, gửi duyệt, tiếp nhận phản hồi khách, **chuyển thành đơn**, và tuỳ chọn **giữ tồn**.

**Auth:** **StaffAuthenticated** (Sales). **Duyệt / từ chối là của Manager** — xem [README.md](./README.md).

Bảng field đầy đủ: [../admin/bao-gia.md](../admin/bao-gia.md). File này tóm tắt **Sales làm gì**.

## API Sales sử dụng

| Method | Path | Sales dùng khi |
| ------ | ---- | -------------- |
| GET | `/api/admin/quotes?status&customerId&salesId&search` | Hàng đợi của mình (`salesId` = user hiện tại) + tab theo trạng thái |
| GET | `/api/admin/quotes/{id}`, `/by-code/{quoteCode}` | Mở chi tiết |
| POST | `/api/admin/quotes` | Tạo báo giá hộ khách; BE gán `salesId` = user hiện tại |
| PUT | `/api/admin/quotes/{id}` | Sửa báo giá (**chỉ khi Draft**) — thêm/bớt dòng, chiết khấu, `validUntil` |
| PUT | `/api/admin/quotes/{id}/assign` | Tiếp nhận **Requested** / **CounterOffer** → **Draft**; body `{}` hoặc không gửi `salesId` → gán **mình**; gửi `salesId` khác → 403 (chỉ Manager/admin) |
| PUT | `/api/admin/quotes/{id}/return-to-draft` | Sau CounterOffer / Rejected / PendingApproval → về **Draft** khi domain cho phép |
| PUT | `/api/admin/quotes/{id}/submit` | **Draft → PendingApproval** (gửi Manager) |
| POST | `/api/admin/quotes/{id}/convert-to-order` | **CustomerAccepted → Converted**; tùy chọn `contractId` đã Confirmed/Active |
| POST | `/api/admin/quotes/{id}/reserve-inventory` | Giữ tồn sau **CustomerAccepted** (nếu chính sách cho Sales tự làm — thông thường cần quyền kho, xem lưu ý bên dưới) |
| POST | `/api/admin/quotes/{id}/release-inventory-reservation` | Trả giữ tồn |
| GET | `/api/admin/quotes/statuses` | Tải `QuoteStatuses` cho filter |

**Không dùng (Manager):** `approve`, `reject`.

### Lưu ý về reserve / release inventory

- BE gắn `StaffAuthenticated`, nhưng bên trong service có thể tạo `InventoryTransaction` — hành động này thường gắn nghiệp vụ **kho**. Nếu team quyết định chỉ Stock Manager / Warehouse mới thao tác, FE Sales nên **ẩn nút** và yêu cầu gửi Manager / Stock.
- Khi Sales gọi `convert-to-order`, BE có thể tự **release** reserve tương ứng — không cần gọi tay trước khi convert.

## Body (tóm tắt)

Tạo báo giá: `customerId`, `lines[]` (`variantId`, `quantity`, `unitPrice?`), `discountType?`, `discountValue?`, `validUntil?`, `notes?`. Ví dụ JSON đầy đủ: [../admin/bao-gia.md](../admin/bao-gia.md).

## Luồng UI chuẩn

1. **Hàng đợi của tôi** (`GET /quotes?salesId=<me>`), tab `Requested` / `Draft` / `PendingApproval` / `Approved` / `CustomerAccepted` / `CounterOffer`.
2. **Tiếp nhận** (Requested/CounterOffer) → `PUT /{id}/assign` → vào màn **Soạn giá** (Draft).
3. **Soạn giá**: chỉnh `lines`, chiết khấu, hạn → **Gửi duyệt** (`PUT /{id}/submit`).
4. Chờ Manager duyệt → khi **Approved**, khách phản hồi qua cổng B2B.
5. Nếu khách **CustomerAccepted** → mở dialog **Chuyển đơn**: chọn `shippingAddressId` (của khách), `paymentMethod`, tùy chọn `contractId` (nếu có hợp đồng) → `POST /{id}/convert-to-order`.
6. Nếu khách **CounterOffer** → `PUT /{id}/return-to-draft` → sửa lại → submit lại.
7. Nếu hết hạn hoặc khách **Rejected** → dừng hoặc liên hệ lại.

## UX

- Hiển thị **timeline trạng thái** rõ; disable nút không hợp lệ theo `QuoteStatuses`.
- `validUntil` cảnh báo khi sắp hết hạn (ví dụ < 3 ngày).
- Kiểm tra tồn (qua tra cứu SKU nếu có) trước khi submit — tránh convert đơn mà không đủ tồn.
- Tìm khách bằng autocomplete ([khach-hang.md](./khach-hang.md)).

## Liên kết

- Hợp đồng phát sinh từ báo giá: [hop-dong.md](./hop-dong.md).
- Chuyển đơn & theo dõi: [don-hang.md](./don-hang.md).
- Khách B2B phản hồi báo giá: [../b2b/bao-gia.md](../b2b/bao-gia.md).
