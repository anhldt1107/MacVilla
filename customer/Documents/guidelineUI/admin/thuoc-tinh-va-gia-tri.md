# Admin — Thuộc tính & giá trị (`/api/admin/products/{productId}/attributes`, `.../values`)

## Mục đích

Quản lý **thuộc tính** và **giá trị** gắn với một sản phẩm; có thể **bulk upsert** theo map tên thuộc tính → giá trị (chuỗi hoặc mảng chuỗi).

**Auth:** **AdminOnly**.

**FE:** schema đầy đủ trong Swagger (`/swagger`, `/swagger/v1/swagger.json`). Dưới đây là tên field JSON (camelCase) theo code BE hiện tại.

---

## API — Thuộc tính

Base: `/api/admin/products/{productId}/attributes`

| Method | Path | Mô tả |
| ------ | ---- | ----- |
| GET | `.../attributes` | Danh sách thuộc tính của SP |
| GET | `.../attributes/{id}` | Chi tiết (kèm danh sách giá trị) |
| POST | `.../attributes` | Tạo thuộc tính |
| PUT | `.../attributes/{id}` | Cập nhật **tên** thuộc tính |
| DELETE | `.../attributes/{id}` | Xóa (cascade xóa các giá trị) |
| PUT | `.../attributes/bulk-upsert` | Upsert hàng loạt tên thuộc tính + giá trị (partial) |

### Body — `POST .../attributes`

| Field | Kiểu | Bắt buộc | Ghi chú |
| ----- | ---- | -------- | ------- |
| `name` | string | Có | Max 500 ký tự |

```json
{
  "name": "Màu sắc"
}
```

### Body — `PUT .../attributes/{id}`

| Field | Kiểu | Bắt buộc |
| ----- | ---- | -------- |
| `name` | string | Có |

```json
{
  "name": "Màu (hiển thị)"
}
```

### Body — `PUT .../attributes/bulk-upsert`

Body là **object JSON**: mỗi **key** = tên thuộc tính; **value** = **một chuỗi** hoặc **mảng chuỗi** (danh sách giá trị). Chỉ các key có trong body được upsert; giá trị của từng thuộc tính được **thay thế hoàn toàn** theo payload; thuộc tính không nằm trong body **giữ nguyên**.

```json
{
  "Kích thước": "15x28",
  "Màu": ["Đỏ", "Xanh"]
}
```

---

## API — Giá trị (từng thuộc tính)

Base: `/api/admin/products/{productId}/attributes/{attributeId}/values`

| Method | Path | Mô tả |
| ------ | ---- | ----- |
| GET | `.../values` | Danh sách giá trị |
| POST | `.../values` | Thêm một giá trị |
| PUT | `.../values/{valueId}` | Sửa một giá trị |
| DELETE | `.../values/{valueId}` | Xóa giá trị |

### Body — `POST .../values`

| Field | Kiểu | Bắt buộc | Ghi chú |
| ----- | ---- | -------- | ------- |
| `value` | string | Có | Max 500 ký tự |

```json
{
  "value": "Đỏ"
}
```

### Body — `PUT .../values/{valueId}`

Giống POST (chỉ field `value`).

---

## Luồng UI gợi ý

### A) Nhập nhanh nhiều thuộc tính

1. Form key/value hoặc import JSON → `PUT .../bulk-upsert` một lần.
2. Hiển thị cảnh báo: key không có trong payload sẽ **không** bị xóa, nhưng giá trị của key có trong payload bị **thay toàn bộ**.

### B) Sửa từng giá trị

1. `GET .../attributes/{id}` → list values hoặc `GET .../values`.
2. Sửa một dòng → `PUT .../values/{valueId}`.

### C) Đổi tên thuộc tính

1. `PUT .../attributes/{id}` chỉ đổi `name`, không đụng bulk map.

---

## UX tối ưu

- Preview JSON trước khi gửi bulk-upsert (tránh ghi đè nhầm).
- Sau bulk: refetch cây thuộc tính + danh sách biến thể nếu UI phụ thuộc combo giá trị.
