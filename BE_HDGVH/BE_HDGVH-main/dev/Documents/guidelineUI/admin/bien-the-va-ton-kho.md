# Admin — Biến thể & tồn kho theo SP (`/api/admin/products/.../variants`, `.../inventory`)

## Mục đích

- **Biến thể (SKU)** theo từng sản phẩm: CRUD.
- **Tồn kho** theo cặp `(productId, variantId)`: đọc / tạo / upsert.

**Auth:** biến thể **AdminOnly**; tồn kho **WarehouseStaff**.

**FE:** Swagger `/swagger`, OpenAPI `/swagger/v1/swagger.json`. Field JSON (camelCase).

## API — Biến thể

Base: `/api/admin/products/{productId}/variants`

| Method | Path | Mô tả |
| ------ | ---- | ----- |
| GET | `.../variants` | Danh sách SKU của SP |
| GET | `.../variants/{id}` | Chi tiết |
| POST | `.../variants` | Tạo |
| PUT | `.../variants/{id}` | Cập nhật (SKU unique) |
| DELETE | `.../variants/{id}` | Xóa (chặn nếu đã dùng trong đơn/báo giá) |

### Body — `POST` / `PUT .../variants`

| Field | Kiểu | Bắt buộc | Ghi chú |
| ----- | ---- | -------- | ------- |
| `sku` | string | Có | Max 450 |
| `variantName` | string | Có | Max 500 |
| `retailPrice` | number | Có | ≥ 0 |
| `costPrice` | number | Có | ≥ 0 |
| `weight` | number | Không | ≥ 0 |
| `dimensions` | string | Không | Max 500 |
| `imageUrl` | string | Không | Max 2000 |

```json
{
  "sku": "MBP14-M3-512-SG",
  "variantName": "14\" M3 512GB Space Gray",
  "retailPrice": 52000000,
  "costPrice": 48000000,
  "weight": 1.6,
  "dimensions": "31.2 x 22.1 x 1.6 cm",
  "imageUrl": "https://..."
}
```

*(Liên kết thuộc tính ↔ biến thể nếu có trong nghiệp vụ khác — kiểm tra thêm Swagger/service; body hiện tại không có `attributeValueIds`.)*

---

## API — Tồn kho (theo biến thể)

Base: `/api/admin/products/{productId}/variants/{variantId}/inventory`

| Method | Path | Mô tả |
| ------ | ---- | ----- |
| GET | `.../inventory` | Đọc tồn (**404** nếu chưa khởi tạo) |
| PUT | `.../inventory` | Upsert |
| POST | `.../inventory` | Tạo lần đầu (**409** nếu đã tồn tại) |

### Body — `PUT` / `POST .../inventory`

| Field | Kiểu | Bắt buộc | Ghi chú |
| ----- | ---- | -------- | ------- |
| `warehouseLocation` | string | Không | Max 500 |
| `quantityOnHand` | number | Có | ≥ 0 |
| `quantityReserved` | number | Có | ≥ 0 |

```json
{
  "warehouseLocation": "KHO-A-RACK-12",
  "quantityOnHand": 100,
  "quantityReserved": 5
}
```

Theo mô tả BE: **quantityAvailable** = onHand − reserved (phía response / tính server).

---

## Luồng UI gợi ý

### A) Tab “Biến thể”

1. `GET .../variants` → bảng SKU.
2. Thêm / sửa → POST/PUT.
3. Tồn kho: `GET .../inventory` (404 → form khởi tạo; ưu tiên **PUT** upsert).

### B) Nhập tồn nhanh

1. **PUT upsert** để tránh 404 + POST 409.
2. Hiển thị **đang giữ** vs **khả dụng** sau khi load `data`.

### C) Xóa biến thể

1. Confirm; lỗi ràng buộc → `message`, rollback UI.

---

## UX tối ưu

- Ẩn màn tồn với user không có **WarehouseStaff**.
- Validate `quantityReserved` ≤ `quantityOnHand` nếu nghiệp vụ yêu cầu.
- Sau chỉnh tồn: refresh tra cứu SKU (`tra-cuu-sku-va-upload.md`).
