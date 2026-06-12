# Customer — Voucher (`/api/store/vouchers`)

Anonymous — gọi trước checkout để hiển thị số tiền giảm dự kiến.

## API

| Method | Path |
| ------ | ---- |
| POST | `/api/store/vouchers/validate` |

### Body — `StoreVoucherValidateRequestDto`

| Field | Kiểu | Bắt buộc | Ghi chú |
| ----- | ---- | -------- | ------- |
| `code` | string | Có | Max 450 |
| `subTotal` | number | Không | Tạm tính giỏ (sau giảm SP nếu có). Bỏ qua → chỉ kiểm hợp lệ, không trả số tiền giảm |

```json
{ "code": "SALE10", "subTotal": 1200000 }
```

### Response `data` — `StoreVoucherValidateResponseDto`

| Field | Kiểu | Ghi chú |
| ----- | ---- | ------- |
| `applicable` | boolean | `true` khi đáp ứng điều kiện |
| `voucherId` | number \| null | |
| `code` | string | Mã chuẩn hoá |
| `discountType` | string \| null | VD `Percent`, `Fixed` |
| `minOrderValue` | number | Giá trị đơn tối thiểu để áp |
| `discountAmount` | number \| null | Số tiền giảm (khi có `subTotal`) |
| `subTotalAfterDiscount` | number \| null | |
| `message` | string \| null | Lý do không áp được (nếu `applicable=false`) hoặc note |

Lỗi thường gặp: **404 NOT_FOUND** khi `code` không tồn tại; **400 BAD_REQUEST** khi thiếu `code`.

## Luồng UI

1. Khách nhập code trong trang giỏ / checkout → `POST /validate` kèm `subTotal` hiện tại.
2. Nếu `applicable=true` → hiển thị `discountAmount`; chuyển `code` vào `POST /api/store/orders/preview` / `POST /api/store/orders` ([dat-don-thanh-toan.md](./dat-don-thanh-toan.md)).
3. Nếu `applicable=false` → hiển thị `message` để khách điều chỉnh (VD "chưa đạt `minOrderValue`", hết hạn…).

> Chưa có "danh sách voucher của tôi"; chỉ validate theo code. Nếu cần cá nhân hoá (voucher gắn khách), phải thêm bảng `CustomerVoucher` (ngoài scope hiện tại).
