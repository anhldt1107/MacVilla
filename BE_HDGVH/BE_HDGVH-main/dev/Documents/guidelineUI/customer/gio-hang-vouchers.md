# Customer — Gợi ý mã giảm giá trên giỏ (`GET /api/store/me/cart/vouchers`)

Tài liệu tích hợp cho FE gọi khi khách B2C đã đăng nhập vào trang giỏ: trả về danh sách mã đang mở (campaign + voucher `Active`) và cờ `**applicableToCart**` so với tạm tính giỏ hiện tại (ví dụ giỏ 100k, mã yêu cầu tối thiểu 200k → `applicableToCart: false`).

---

## 1. Tổng quan API


| Thuộc tính       | Giá trị                                                       |
| ---------------- | ------------------------------------------------------------- |
| **Method**       | `GET`                                                         |
| **Path**         | `/api/store/me/cart/vouchers`                                 |
| **Auth**         | Bắt buộc — JWT cửa hàng (B2C), policy `CustomerAuthenticated` |
| **Query / body** | Không có tham số                                              |


---

## 2. Request

### 2.1. URL đầy đủ (ví dụ)

```http
GET /api/store/me/cart/vouchers HTTP/1.1
Host: <BASE_URL>
```

### 2.2. Headers


| Header          | Bắt buộc | Giá trị / ghi chú                                                                                     |
| --------------- | -------- | ----------------------------------------------------------------------------------------------------- |
| `Authorization` | **Có**   | `Bearer <access_token>` — token đăng nhập khách B2C (`/api/store/auth/login` hoặc luồng tương đương). |
| `Accept`        | Không    | Khuyến nghị: `application/json`                                                                       |
| `Content-Type`  | Không    | GET không có body                                                                                     |


**Ví dụ:**

```http
GET /api/store/me/cart/vouchers HTTP/1.1
Host: localhost:8080
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Accept: application/json
```

### 2.3. Query parameters

Không.

### 2.4. Body

Không.

---

## 3. Response thành công (HTTP 200)

Envelope chuẩn dự án: `ResponseDto`.


| Field (root) | Kiểu    | Ghi chú                                      |
| ------------ | ------- | -------------------------------------------- |
| `success`    | boolean | `true`                                       |
| `data`       | object  | Xem mục 3.1 — `StoreCartVouchersResponseDto` |
| `message`    | string  | Ví dụ: `"OK"`                                |
| `errorCode`  | string  | null                                         |
| `errors`     | object  | null                                         |
| `traceId`    | string  | null                                         |
| `detail`     | string  | null                                         |


### 3.1. Object `data` — `StoreCartVouchersResponseDto`


| Field                 | Kiểu JSON | Bắt buộc | Mô tả                                                                                                                                                                                                                                                |
| --------------------- | --------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `merchandiseSubtotal` | number    | Có       | Tạm tính hàng dùng để so với `minOrderValue` của từng mã. **Chỉ** cộng dòng có biến thể tồn tại và **sản phẩm** (`Product`) đang `Active`. **Không** kiểm tra tồn kho tại bước này (khác với lúc đặt đơn). Giỏ rỗng hoặc không có dòng hợp lệ → `0`. |
| `items`               | array     | Có       | Danh sách tối đa **200** voucher: `Voucher.Status` và `Campaign.Status` đều `Active`, sắp xếp `minOrderValue` tăng dần, rồi `code`.                                                                                                                  |


### 3.2. Phần tử `items[]` — `StoreCartVoucherListItemDto`


| Field               | Kiểu JSON | Mô tả                                                                                                                                                                                                       |
| ------------------- | --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `voucherId`         | number    | ID voucher                                                                                                                                                                                                  |
| `code`              | string    | Mã nhập khi checkout                                                                                                                                                                                        |
| `discountType`      | string    | null                                                                                                                                                                                                        |
| `discountValue`     | number    | Với `%`: giá trị phần trăm (0–100). Với tiền cố định: số tiền giảm gốc (trước khi áp `maxDiscountAmount` và trần theo tạm tính).                                                                            |
| `minOrderValue`     | number    | Giá trị đơn tối thiểu (tạm tính hàng) để mã áp dụng được.                                                                                                                                                   |
| `maxDiscountAmount` | number    | null                                                                                                                                                                                                        |
| `campaignName`      | string    | null                                                                                                                                                                                                        |
| `eligible`          | boolean   | `true` khi mã còn trong điều kiện hợp lệ: voucher + campaign `Active`, trong khung ngày campaign, chưa vượt `usageLimit` (nếu có). `false` khi hết hạn, chưa mở, hết lượt, campaign/voucher không active, … |
| `applicableToCart`  | boolean   | `true` **chỉ khi** `eligible === true` **và** `merchandiseSubtotal >= minOrderValue` **và** cấu hình discount hợp lệ khi tính. Dùng để badge “Dùng được với giỏ này”.                                       |
| `discountAmount`    | number    | null                                                                                                                                                                                                        |
| `message`           | string    | null                                                                                                                                                                                                        |


**Quan hệ logic (tóm tắt):**

- `eligible === false` → `applicableToCart === false`, `discountAmount === null`.
- `eligible === true` nhưng `merchandiseSubtotal < minOrderValue` → `applicableToCart === false`, `message` kiểu chưa đạt giá trị tối thiểu.
- `eligible === true` và đủ tối thiểu → `applicableToCart === true`, có `discountAmount`.

### 3.3. Ví dụ JSON response đầy đủ (200)

```json
{
  "success": true,
  "data": {
    "merchandiseSubtotal": 100000,
    "items": [
      {
        "voucherId": 3,
        "code": "MIN200",
        "discountType": "FixedAmount",
        "discountValue": 50000,
        "minOrderValue": 200000,
        "maxDiscountAmount": null,
        "campaignName": "Tết 2026",
        "eligible": true,
        "applicableToCart": false,
        "discountAmount": null,
        "message": "Đơn chưa đạt giá trị tối thiểu (200,000) để dùng voucher."
      },
      {
        "voucherId": 7,
        "code": "SALE10PCT",
        "discountType": "Percentage",
        "discountValue": 10,
        "minOrderValue": 0,
        "maxDiscountAmount": 50000,
        "campaignName": "Mở bán",
        "eligible": true,
        "applicableToCart": true,
        "discountAmount": 10000,
        "message": "Áp dụng được cho giỏ hiện tại."
      },
      {
        "voucherId": 2,
        "code": "EXPIREDX",
        "discountType": "FixedAmount",
        "discountValue": 30000,
        "minOrderValue": 0,
        "maxDiscountAmount": null,
        "campaignName": "Cũ",
        "eligible": false,
        "applicableToCart": false,
        "discountAmount": null,
        "message": "Voucher đã hết hạn."
      }
    ]
  },
  "message": "OK",
  "errorCode": null,
  "errors": null,
  "traceId": null,
  "detail": null
}
```

---

## 4. Response lỗi


| HTTP    | Tình huống                                                                                                   | Body (chuẩn hóa theo middleware dự án)                                                                           |
| ------- | ------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------- |
| **401** | Thiếu / sai JWT                                                                                              | `success: false`, thông điệp unauthorized                                                                        |
| **404** | Không tìm thấy tài khoản B2C gắn với token (`KeyNotFoundException`: không phải khách B2C hoặc không tồn tại) | `success: false`, có thể kèm `errorCode` (VD `NOT_FOUND`) — đối chiếu Swagger / global exception handler thực tế |


Không có body JSON tùy chỉnh cho GET ngoài envelope trên.

---

## 5. Ghi chú tích hợp FE

1. Gọi sau khi đã có token và (tuỳ chọn) sau khi load giỏ — mỗi lần đổi số lượng dòng giỏ nên gọi lại để cập nhật `merchandiseSubtotal` và `applicableToCart`.
2. `**applicableToCart`** là cờ chính để hiển thị “Dùng được với giỏ này”; `**eligible`** phân biệt “mã hết hạn / hết lượt” với “mã còn live nhưng giỏ chưa đủ tiền”.
3. Khi khách chọn mã, vẫn nên gọi `POST /api/store/vouchers/validate` + `POST /api/store/orders/preview` trước khi tạo đơn để đồng bộ với kiểm tra tồn / rule checkout ([voucher.md](./voucher.md), [dat-don-thanh-toan.md](./dat-don-thanh-toan.md)).

---

## 6. Liên quan


| API                                 | Mục đích                                         |
| ----------------------------------- | ------------------------------------------------ |
| `GET /api/store/me/cart`            | Nội dung giỏ                                     |
| `POST /api/store/vouchers/validate` | Kiểm tra một mã + tạm tính tùy chỉnh (anonymous) |
| `POST /api/store/orders/preview`    | Xem trước đơn kèm voucher (đã đăng nhập)         |


