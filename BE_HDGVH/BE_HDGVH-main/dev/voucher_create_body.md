# Body JSON — `POST /api/admin/vouchers` (`VoucherCreateDto`)

API tạo voucher mới. **Auth:** `AdminOnly`.

---

## Ví dụ schema (OpenAPI / Swagger)

```json
{
  "campaignId": 1,
  "code": "string",
  "discountType": "string",
  "discountValue": 0.01,
  "minOrderValue": 0,
  "maxDiscountAmount": 0,
  "usageLimit": 2147483647,
  "status": "string"
}
```

Các giá trị kiểu `"string"` / `0` / `2147483647` ở trên chỉ là **placeholder** của generator; dưới đây là ý nghĩa thật và giá trị hợp lệ.

---

## Giải thích từng field

### `campaignId` (number, bắt buộc)

ID **chiến dịch khuyến mãi** (`PromotionCampaign`) mà voucher thuộc về. Phải tồn tại trong DB; không có → lỗi *Không tìm thấy chiến dịch*.

---

### `code` (string, bắt buộc, tối đa 100 ký tự)

**Mã voucher** khách nhập khi thanh toán. Khi lưu, BE **trim** và chuyển **IN HOA**; **không được trùng** mã với voucher khác.

---

### `discountType` (string, bắt buộc)

Loại giảm. BE chỉ chấp nhận (so khớng **không phân biệt hoa thường**):

| Giá trị | Ý nghĩa |
|--------|---------|
| `Percentage` | Giảm theo **phần trăm** trên giá trị đơn (subtotal áp voucher). |
| `FixedAmount` | Giảm một **số tiền cố định**. |

*Lúc tính tiền (`VoucherComputation`), ngoài `Percentage` còn có alias `Percent` / `%`; **API tạo voucher** chỉ validate qua `VoucherDiscountTypes` → nên gửi `Percentage` hoặc `FixedAmount`.*

---

### `discountValue` (number, bắt buộc)

- **Data annotation:** phải **≥ 0.01**.
- Nếu **`discountType` = `Percentage`:** là **phần trăm 0–100** (vd. `10` = giảm 10%). Service báo lỗi nếu ngoài khoảng.
- Nếu **`discountType` = `FixedAmount`:** là **số tiền giảm** (cùng đơn vị tiền với đơn). Không được âm.

---

### `minOrderValue` (number)

**Giá trị đơn tối thiểu** (tổng tiền hàng trước giảm) để **được phép dùng** voucher. `0` = không yêu cầu tối thiểu. Khi áp dụng: `merchandiseSubtotal >= minOrderValue`.

---

### `maxDiscountAmount` (number hoặc `null`)

**Trần số tiền được giảm** (thường dùng khi giảm %).

- Với **Percentage**: sau khi tính `%`, lấy `min(kết quả, maxDiscountAmount)` nếu có giá trị.
- Với **FixedAmount**: vẫn áp trần nếu có.
- Discount không vượt quá subtotal (logic trong `VoucherComputation`).

`null` hoặc bỏ qua = **không giới hạn thêm** (ngoài rule “không giảm quá tiền hàng”).

*Trong Swagger, `0` có thể hiện — nên hiểu là “có trần 0” hay đổi sang `null` tùy FE; với trần thực tế thường đặt số dương.*

---

### `usageLimit` (integer hoặc `null`)

**Số lần dùng tối đa** của mã (toàn hệ thống). Nếu gửi số: theo annotation phải **từ 1** đến `int.MaxValue` (2147483647 là max int). `null` = **không giới hạn lượt**. Khi dùng, `UsedCount` tăng; hết lượt → không còn hợp lệ.

---

### `status` (string, tùy chọn)

Trạng thái voucher. **Không gửi / để trống** → mặc định **`Active`**. Nếu gửi, phải thuộc `VoucherStatuses`:

| Giá trị | Ý nghĩa |
|--------|---------|
| `Active` | Đang dùng được (vẫn phụ thuộc campaign, thời gian, lượt). |
| `Inactive` | Tắt chủ động. |
| `Expired` | Hết hiệu lực. |

---

## Ví dụ JSON hợp lệ

**Giảm 15%, đơn tối thiểu 500k, trần giảm 200k, 1000 lượt:**

```json
{
  "campaignId": 1,
  "code": "TET2026",
  "discountType": "Percentage",
  "discountValue": 15,
  "minOrderValue": 500000,
  "maxDiscountAmount": 200000,
  "usageLimit": 1000,
  "status": "Active"
}
```

**Giảm cố định 50k, không tối thiểu, không giới hạn lượt:**

```json
{
  "campaignId": 1,
  "code": "GIAM50K",
  "discountType": "FixedAmount",
  "discountValue": 50000,
  "minOrderValue": 0,
  "maxDiscountAmount": null,
  "usageLimit": null,
  "status": "Active"
}
```

---

**Code tham chiếu:** `AppData/Dto/Promotion/VoucherCreateDto.cs`, `AdminPromotionService.CreateVoucherAsync`, `VoucherComputation`.
