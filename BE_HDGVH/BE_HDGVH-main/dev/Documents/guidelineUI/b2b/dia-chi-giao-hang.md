# B2B Store — Địa chỉ giao hàng (`/api/store/me/addresses`)

## Mục đích

Quản lý **địa chỉ giao** cho tài khoản đang đăng nhập (**B2C hoặc B2B** dùng chung API). FE cổng B2B cần API này khi đặt hàng / chọn `shippingAddressId` (luồng liên quan đơn hàng thường gắn địa chỉ đã lưu).

**Auth:** **CustomerAuthenticated** (cùng JWT customer với B2B).

**FE:** Swagger `/swagger`, OpenAPI `/swagger/v1/swagger.json`.

## API


| Method | Path                                       | Mô tả                                          |
| ------ | ------------------------------------------ | ---------------------------------------------- |
| GET    | `/api/store/me/addresses`                  | Danh sách địa chỉ                              |
| POST   | `/api/store/me/addresses`                  | Thêm địa chỉ                                   |
| PUT    | `/api/store/me/addresses/{id}`             | Cập nhật                                       |
| DELETE | `/api/store/me/addresses/{id}`             | Xóa (có rule nếu đã dùng trong đơn / mặc định) |
| POST   | `/api/store/me/addresses/{id}/set-default` | Đặt mặc định                                   |


### Body — `POST .../addresses`


| Field           | Kiểu    | Bắt buộc | Ghi chú                                                                      |
| --------------- | ------- | -------- | ---------------------------------------------------------------------------- |
| `receiverName`  | string  | Có       | Max 500                                                                      |
| `receiverPhone` | string  | Có       | Max 50                                                                       |
| `addressLine`   | string  | Có       | Max 2000                                                                     |
| `isDefault`     | boolean | Có       | Địa chỉ đầu hoặc khi chưa có mặc định có thể tự set mặc định (theo mô tả BE) |


```json
{
  "receiverName": "Kho ABC — bộ phận nhận hàng",
  "receiverPhone": "02839999999",
  "addressLine": "KCN X, Huyện Y, Tỉnh Z",
  "isDefault": true
}
```

### Body — `PUT .../addresses/{id}`

Cùng các field với POST (`receiverName`, `receiverPhone`, `addressLine`, `isDefault`).

---

## Luồng UI gợi ý

### A) Checkout / tạo đơn B2B (nếu có form phía store)

1. Load `GET .../addresses` → chọn một `id` làm `shippingAddressId`.
2. Nút “Thêm địa chỉ mới” → POST → chọn mặc định nếu cần.

### B) Sổ địa chỉ

1. Danh sách + badge **Mặc định**; swipe hoặc menu **Đặt mặc định** → `POST .../set-default`.

---

## UX tối ưu

- Confirm trước DELETE (BE có thể chặn nếu địa chỉ đã dùng trong đơn).
- Sau POST/PUT: refetch list để đồng bộ `isDefault`.

