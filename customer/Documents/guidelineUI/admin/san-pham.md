# Admin — Sản phẩm (`/api/admin/products`)

## Mục đích

CRUD **sản phẩm** (metadata, danh mục, giá cơ sở, bảo hành, trạng thái, ảnh). Thuộc tính, biến thể, tồn kho nằm ở file riêng.

**Auth:** **AdminOnly**.

**FE:** Swagger `/swagger`, OpenAPI `/swagger/v1/swagger.json`. Field JSON (camelCase) như bảng dưới.

## API

| Method | Path | Mô tả |
| ------ | ---- | ----- |
| GET | `/api/admin/products` | Danh sách phân trang + filter |
| GET | `/api/admin/products/{id}` | Chi tiết (thuộc tính, biến thể, tồn nếu có) |
| POST | `/api/admin/products` | Tạo |
| PUT | `/api/admin/products/{id}` | Cập nhật |
| DELETE | `/api/admin/products/{id}` | Xóa (chặn nếu variant đã có trong đơn/báo giá) |

### Query — `GET .../products`

| Param | Mặc định | Ghi chú |
| ----- | -------- | ------- |
| `page` | 1 | |
| `pageSize` | 50 | |
| `categoryId` | — | Lọc theo danh mục |
| `includeSubcategories` | true | `true`: gồm cả nhánh con của `categoryId` |
| `status` | — | Trạng thái SP (VD Active, Draft, … — theo Swagger/domain) |
| `search` | — | Tìm kiếm |

### Body — `POST .../products`

| Field | Kiểu | Bắt buộc | Ghi chú |
| ----- | ---- | -------- | ------- |
| `categoryId` | number | Có | |
| `name` | string | Có | Max 500 |
| `slug` | string | Không | Để trống BE tự sinh từ `name` |
| `description` | string | Không | |
| `imageUrl` | string | Không | URL ảnh đại diện, max 2048 |
| `basePrice` | number | Không | ≥ 0 |
| `warrantyPeriodMonths` | number | Không | 0–1200; không gửi = 0 (mặc định CLR) |
| `status` | string | Không | Mặc định Active nếu không gửi |

```json
{
  "categoryId": 2,
  "name": "MacBook Pro 14",
  "slug": "macbook-pro-14",
  "description": "Mô tả ngắn",
  "imageUrl": "https://...",
  "basePrice": 45000000,
  "warrantyPeriodMonths": 12,
  "status": "Active"
}
```

### Body — `PUT .../products/{id}`

| Field | Kiểu | Bắt buộc | Ghi chú |
| ----- | ---- | -------- | ------- |
| `categoryId` | number | Có | |
| `name` | string | Có | |
| `slug` | string | Có | |
| `description` | string | Không | |
| `imageUrl` | string | Không | Không gửi / `null` = giữ; `""` = xóa ảnh |
| `basePrice` | number | Không | |
| `warrantyPeriodMonths` | number | Có | 0–1200 |
| `status` | string | Có | |

```json
{
  "categoryId": 2,
  "name": "MacBook Pro 14",
  "slug": "macbook-pro-14",
  "description": "Cập nhật mô tả",
  "imageUrl": "",
  "basePrice": 44000000,
  "warrantyPeriodMonths": 12,
  "status": "Active"
}
```

---

## Luồng UI gợi ý

### A) Danh sách

1. Bảng + filter `search`, `categoryId`, `includeSubcategories`, `status`.
2. Row click → chi tiết hoặc drawer; nút Sửa → form PUT.

### B) Tạo mới

1. Wizard: **Thông tin SP** (POST) → tab **Thuộc tính / Biến thể** (API khác).
2. Sau POST thành công: redirect `.../products/{id}`.

### C) Xóa

1. Confirm → DELETE; nếu còn ràng buộc, hiển thị lỗi từ BE.

---

## UX tối ưu

- Debounce ô search (300–500 ms).
- Giữ filter trong URL query.
- Ảnh đại diện: upload → `tra-cuu-sku-va-upload.md`.
