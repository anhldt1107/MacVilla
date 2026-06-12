# Admin — Chiến dịch & voucher (`/api/admin/campaigns`, `/api/admin/vouchers`)

## Mục đích

Quản lý **chiến dịch khuyến mãi** và **voucher** (tạo, sửa, trạng thái). Chi tiết chiến dịch thường kèm danh sách voucher.

**Auth:** **AdminOnly** (cả hai nhóm endpoint).

**FE:** Swagger `/swagger`, OpenAPI `/swagger/v1/swagger.json`. Field JSON (camelCase).

---

## Phần 1 — Chiến dịch (`/api/admin/campaigns`)

| Method | Path | Mô tả |
| ------ | ---- | ----- |
| GET | `/api/admin/campaigns` | Danh sách phân trang |
| GET | `/api/admin/campaigns/{id}` | Chi tiết + danh sách voucher |
| POST | `/api/admin/campaigns` | Tạo |
| PUT | `/api/admin/campaigns/{id}` | Cập nhật |
| DELETE | `/api/admin/campaigns/{id}` | Xóa (nếu voucher chưa được dùng) |

### Query — `GET .../campaigns`

| Param | Mặc định | Ghi chú |
| ----- | -------- | ------- |
| `page` | 1 | |
| `pageSize` | 50 | |
| `status` | — | |

### Body — `POST .../campaigns`

| Field | Kiểu | Bắt buộc | Ghi chú |
| ----- | ---- | -------- | ------- |
| `name` | string | Có | Max 500 |
| `description` | string | Không | Max 2000 |
| `startDate` | string (ISO 8601) | Không | |
| `endDate` | string (ISO 8601) | Không | |
| `status` | string | Không | Active, Inactive, Expired — mặc định Active |

```json
{
  "name": "Tết 2026",
  "description": "Giảm cho đơn từ 5 triệu",
  "startDate": "2026-01-01T00:00:00.000Z",
  "endDate": "2026-01-31T23:59:59.000Z",
  "status": "Active"
}
```

### Body — `PUT .../campaigns/{id}`

| Field | Kiểu | Bắt buộc |
| ----- | ---- | -------- |
| `name` | string | Có |
| `description` | string | Không |
| `startDate` | string (ISO 8601) | Không |
| `endDate` | string (ISO 8601) | Không |
| `status` | string | Có |

```json
{
  "name": "Tết 2026 (gia hạn)",
  "description": "Kéo dài đến hết 15/2",
  "startDate": "2026-01-01T00:00:00.000Z",
  "endDate": "2026-02-15T23:59:59.000Z",
  "status": "Active"
}
```

---

## Phần 2 — Voucher (`/api/admin/vouchers`)

| Method | Path | Mô tả |
| ------ | ---- | ----- |
| GET | `/api/admin/vouchers` | Danh sách phân trang |
| POST | `/api/admin/vouchers` | Tạo voucher |
| PUT | `/api/admin/vouchers/{id}` | Cập nhật |
| PUT | `/api/admin/vouchers/{id}/status` | Kích hoạt / hết hạn |

### Query — `GET .../vouchers`

| Param | Mặc định | Ghi chú |
| ----- | -------- | ------- |
| `page` | 1 | |
| `pageSize` | 50 | |
| `campaignId` | — | Lọc theo chiến dịch |
| `status` | — | |

### Body — `POST .../vouchers`

| Field | Kiểu | Bắt buộc | Ghi chú |
| ----- | ---- | -------- | ------- |
| `campaignId` | number | Có | |
| `code` | string | Có | Mã voucher, max 100 |
| `discountType` | string | Có | `Percentage` hoặc `FixedAmount` |
| `discountValue` | number | Có | > 0 |
| `minOrderValue` | number | Có | ≥ 0 (mặc định form: 0) |
| `maxDiscountAmount` | number | Không | Trần giảm khi Percentage |
| `usageLimit` | number | Không | ≥ 1 nếu có |
| `status` | string | Không | Active / Inactive / Expired |

```json
{
  "campaignId": 3,
  "code": "TET2026-500K",
  "discountType": "FixedAmount",
  "discountValue": 500000,
  "minOrderValue": 5000000,
  "maxDiscountAmount": null,
  "usageLimit": 100,
  "status": "Active"
}
```

### Body — `PUT .../vouchers/{id}`

Giống POST; **`status` bắt buộc** khi update (theo DTO BE).

### Body — `PUT .../vouchers/{id}/status`

| Field | Kiểu | Bắt buộc |
| ----- | ---- | -------- |
| `status` | string | Có | Active, Inactive, Expired |

```json
{
  "status": "Inactive"
}
```

---

## Luồng UI gợi ý

### A) Tạo chiến dịch mới

1. Form chiến dịch (thời gian, loại giảm, điều kiện) → POST campaigns.
2. Tab “Voucher”: tạo lẻ hoặc import mã (theo khả năng BE) qua POST vouchers với `campaignId`.

### B) Theo dõi usage

1. Chi tiết campaign `GET /{id}` để xem voucher và trạng thái.

### C) Đổi trạng thái voucher nhanh

1. Toggle hoặc action menu → `PUT .../status`.

---

## UX tối ưu

- Ẩn toàn bộ menu module này với user không phải admin (403).
- Cảnh báo khi xóa campaign có voucher đã phát hành.
- Copy mã voucher (clipboard) từ bảng chi tiết.
