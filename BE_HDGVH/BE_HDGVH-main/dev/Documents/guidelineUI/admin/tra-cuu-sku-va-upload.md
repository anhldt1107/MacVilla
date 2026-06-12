# Admin — Tra cứu biến thể & upload (`/api/admin/variants`, `/api/admin/uploads`)

## Mục đích

- **Danh sách / lọc biến thể toàn hệ thống** và **tra cứu theo SKU** (kể cả SKU chứa ký tự đặc biệt như `/`).
- **Upload** file (ảnh, PDF, Word) lên Cloudinary, nhận URL dùng cho `ImageUrl` hoặc tài liệu đính kèm.

**Auth:** **AdminOnly** (cả hai controller).

**FE:** Swagger `/swagger`, OpenAPI `/swagger/v1/swagger.json`. Query string dùng tên tham số camelCase như bảng dưới.

## API — Tra cứu biến thể

Base: `/api/admin/variants`

| Method | Path | Mô tả |
| ------ | ---- | ----- |
| GET | `/api/admin/variants` | Danh sách phân trang + filter |
| GET | `/api/admin/variants/by-sku/{**sku}` | Chi tiết theo SKU (catch-all — **URL-encode** SKU, VD `%2F` cho `/`) |

### Query — `GET /api/admin/variants`

| Param | Mặc định | Ghi chú |
| ----- | -------- | ------- |
| `page` | 1 | Phân trang |
| `pageSize` | 20 | |
| `productId` | — | Lọc theo SP |
| `categoryId` | — | Lọc theo danh mục |
| `productStatus` | — | VD Active, Draft, Hidden |
| `search` | — | SKU, tên biến thể, tên SP |
| `minRetailPrice`, `maxRetailPrice` | — | Khoảng giá |
| `minQuantityAvailable`, `maxQuantityAvailable` | — | Tồn khả dụng; không có bản ghi Inventory → coi như 0 |

**404** trên `by-sku`: không tìm thấy SKU.

---

## API — Upload

| Method | Path | Mô tả |
| ------ | ---- | ----- |
| POST | `/api/admin/uploads` | `multipart/form-data`, field file |

### Query — `POST .../uploads`

| Param | Ghi chú |
| ----- | ------- |
| `folder` | Optional — thư mục Cloudinary |

### Request

- **Content-Type:** `multipart/form-data`
- **Body:** field file (tên field đúng theo Swagger; thường là `file`)
- **Giới hạn:** body tối đa **30 MB** (ảnh / pdf / doc / docx)

**Lưu ý Swagger:** không gắn `[FromForm]` cho `IFormFile` trong code BE (tránh lỗi generator); client vẫn gửi form bình thường.

---

## Luồng UI gợi ý

### A) Màn “Kho / SKU”

1. Filter nâng cao (giá, tồn, danh mục) → `GET /variants`.
2. Ô search SKU nhanh → nếu biết đúng SKU, gọi `by-sku` (encode path).

### B) Gắn ảnh sản phẩm

1. `POST /uploads` với `folder` theo convention (VD `products/{id}`).
2. Lấy URL trong `data` → điền vào form PUT sản phẩm / biến thể.

### C) SKU có dấu `/`

1. Dùng `encodeURIComponent` cho segment path hoặc dùng library HTTP đúng chuẩn RFC.

---

## UX tối ưu

- Progress bar upload; giới hạn chọn file ≤ 30 MB phía client.
- Hiển thị preview ảnh sau upload thành công.
- Bảng filter: debounce `search`; reset `page` khi đổi filter.
