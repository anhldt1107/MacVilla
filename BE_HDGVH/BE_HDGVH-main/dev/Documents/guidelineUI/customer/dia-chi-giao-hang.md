# Customer — Địa chỉ giao hàng (`/api/store/me/addresses`)

Dùng chung B2C / B2B. Chi tiết field: [../b2b/dia-chi-giao-hang.md](../b2b/dia-chi-giao-hang.md).

## API

| Method | Path |
| ------ | ---- |
| GET | `/api/store/me/addresses` |
| POST | `/api/store/me/addresses` |
| PUT | `/api/store/me/addresses/{id}` |
| DELETE | `/api/store/me/addresses/{id}` |
| POST | `/api/store/me/addresses/{id}/set-default` |

**Auth:** **CustomerAuthenticated**.

## Luồng UI

1. Trang checkout — chọn địa chỉ mặc định hoặc thêm mới inline.
2. Trang "Sổ địa chỉ" trong account — CRUD đầy đủ.

## UX

- Mark badge "Mặc định".
- Khi xóa địa chỉ đã dùng trong đơn cũ — BE thường cho phép (chỉ FK lỏng).
