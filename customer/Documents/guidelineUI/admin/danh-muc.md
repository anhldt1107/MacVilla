# Admin — Danh mục (`/api/admin/categories`)

## Mục đích

Quản lý **danh mục sản phẩm** (CRUD, soft delete), danh sách phân trang, **cây nested**. Thường map tree / select khi tạo sản phẩm.

**Auth:** **AdminOnly**.

**FE:** Swagger `/swagger`, OpenAPI `/swagger/v1/swagger.json`. Dưới đây là field JSON (camelCase).

## API

| Method | Path | Mô tả |
| ------ | ---- | ----- |
| GET | `/api/admin/categories` | Danh sách phân trang |
| GET | `/api/admin/categories/tree` | Cây danh mục (nested) |
| GET | `/api/admin/categories/{id}` | Chi tiết |
| POST | `/api/admin/categories` | Tạo |
| PUT | `/api/admin/categories/{id}` | Cập nhật |
| DELETE | `/api/admin/categories/{id}` | Xóa (soft) |

### Query — `GET .../categories`

| Param | Mặc định | Ghi chú |
| ----- | -------- | ------- |
| `page` | 1 | Phân trang |
| `pageSize` | 50 | |
| `parentId` | — | Lọc theo danh mục cha |
| `rootsOnly` | false | `true`: chỉ danh mục gốc |

### Body — `POST .../categories`

| Field | Kiểu | Bắt buộc | Ghi chú |
| ----- | ---- | -------- | ------- |
| `parentId` | number | Không | Nullable — gốc nếu null |
| `name` | string | Có | Max 500 |
| `slug` | string | Không | Để trống BE tự sinh từ `name` |
| `imageUrl` | string | Không | URL ảnh đại diện, max 2048 |

```json
{
  "parentId": null,
  "name": "Laptop",
  "slug": "laptop",
  "imageUrl": "https://res.cloudinary.com/.../cat.jpg"
}
```

### Body — `PUT .../categories/{id}`

| Field | Kiểu | Bắt buộc | Ghi chú |
| ----- | ---- | -------- | ------- |
| `parentId` | number | Không | |
| `name` | string | Có | |
| `slug` | string | Có | Bắt buộc khi update |
| `imageUrl` | string | Không | Không gửi hoặc `null` = giữ; `""` = xóa ảnh |

```json
{
  "parentId": 2,
  "name": "Laptop gaming",
  "slug": "laptop-gaming",
  "imageUrl": null
}
```

**404:** `{id}` không tồn tại khi GET/PUT/DELETE.

---

## Luồng UI gợi ý

### A) Cây danh mục

1. `GET /categories/tree` cho sidebar / tree một lần.
2. Hoặc `GET /categories` với `rootsOnly=true` rồi lazy-load con bằng `parentId`.

### B) Form tạo / sửa

1. Chọn **danh mục cha** (`parentId` nullable = root).
2. Ảnh: upload → `imageUrl` (xem `tra-cuu-sku-va-upload.md`).

### C) Xóa

1. Confirm modal → `DELETE`. Nếu còn sản phẩm / con, BE có thể trả 400 — hiển thị `message`.

---

## UX tối ưu

- Skeleton khi load cây; expand/collapse local state.
- Sau POST/PUT: invalidate cache danh mục + dropdown ở màn Sản phẩm.
