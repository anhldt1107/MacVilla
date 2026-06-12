# Customer — Giỏ hàng (`/api/store/me/cart`)

Auth: **CustomerAuthenticated**. Server-side cart — 1 giỏ / khách.

## API

| Method | Path | Ghi chú |
| ------ | ---- | ------- |
| GET | `/api/store/me/cart` | Lấy giỏ hiện tại + dòng sản phẩm |
| POST | `/api/store/me/cart/items` | Thêm SKU vào giỏ |
| PUT | `/api/store/me/cart/items/{variantId}` | Đặt số lượng cho 1 dòng (0 → xoá) |
| DELETE | `/api/store/me/cart/items/{variantId}` | Xoá 1 dòng |
| DELETE | `/api/store/me/cart` | Xoá toàn bộ giỏ |

### Body — `POST /items` (`StoreCartAddItemDto`)

| Field | Kiểu | Bắt buộc | Ghi chú |
| ----- | ---- | -------- | ------- |
| `variantId` | number | Có | |
| `quantity` | number | Có (default `1`) | Range 1..1,000,000 |

```json
{ "variantId": 101, "quantity": 2 }
```

### Body — `PUT /items/{variantId}` (`StoreCartSetQuantityDto`)

| Field | Kiểu | Bắt buộc | Ghi chú |
| ----- | ---- | -------- | ------- |
| `quantity` | number | Có | Range 0..1,000,000; **0 → xoá dòng** |

```json
{ "quantity": 3 }
```

### Response `GET /cart` — `StoreCartDto`

| Field | Kiểu | Ghi chú |
| ----- | ---- | ------- |
| `cartId` | number | |
| `updatedAt` | ISO 8601 | |
| `merchandiseSubtotal` | number | Tạm tính trước áp voucher |
| `lines[]` | `StoreCartLineDto[]` | |

`lines[]`:

| Field | Kiểu | Ghi chú |
| ----- | ---- | ------- |
| `lineId`, `variantId` | number | |
| `sku`, `variantName`, `productName` | string | |
| `imageUrl` | string \| null | |
| `quantity` | number | |
| `unitPrice` | number | Giá hiện tại của variant |
| `lineSubtotal` | number | `unitPrice * quantity` |
| `quantityAvailable` | number | Tồn khả dụng hiện tại |
| `insufficientStock` | boolean | `true` khi `quantity > quantityAvailable` |

Response của `POST /items`, `PUT /items/{variantId}`, `DELETE /items/{variantId}` là `StoreCartDto` (giỏ sau cập nhật). `DELETE /cart` (clear) trả envelope với `data: null`.

## Luồng UI

1. Sau login → `GET /cart` để sync icon + badge số dòng.
2. Thêm SKU từ trang sản phẩm → `POST /items`.
3. Trang **Giỏ hàng**: chỉnh `quantity` (`PUT`), xoá dòng (`DELETE /items/{variantId}`), xoá tất cả (`DELETE /cart`).
4. Cảnh báo khi `insufficientStock=true` hoặc `unitPrice` khác snapshot cũ (client so sánh).
5. Checkout → `POST /api/store/orders/preview` ([dat-don-thanh-toan.md](./dat-don-thanh-toan.md)).
6. **Reorder** đơn cũ (xem [don-hang.md](./don-hang.md)) thêm SKU vào giỏ hiện tại → gọi lại `GET /cart` để refresh.

## UX

- Hiển thị cảnh báo khi tồn giảm xuống dưới `quantity` trong giỏ.
- Sau mỗi hành động cart, re-render merchandiseSubtotal từ response (không tự tính lại).
- Không render variant thuộc sản phẩm ngừng bán (BE lọc sẵn).
