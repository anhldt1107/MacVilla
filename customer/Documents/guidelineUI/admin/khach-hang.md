# Admin — Khách hàng (`/api/admin/customers`)

## Mục đích

Quản lý **khách B2C/B2B**: danh sách, chi tiết, tạo/sửa, **lịch sử đơn**, **công nợ B2B** và điều chỉnh công nợ.

**Auth:** **StaffAuthenticated**.

**FE:** Swagger `/swagger`, OpenAPI `/swagger/v1/swagger.json`. Field JSON (camelCase).

## API

| Method | Path | Mô tả |
| ------ | ---- | ----- |
| GET | `/api/admin/customers` | Danh sách phân trang + filter |
| GET | `/api/admin/customers/{id}` | Chi tiết |
| POST | `/api/admin/customers` | Tạo khách (Sales nhập) |
| PUT | `/api/admin/customers/{id}` | Cập nhật (B2B: companyName, taxCode, …) |
| GET | `/api/admin/customers/{id}/orders` | Lịch sử đơn |
| GET | `/api/admin/customers/{id}/debt` | Thông tin công nợ B2B |
| POST | `/api/admin/customers/{id}/debt/adjust` | Điều chỉnh công nợ (**ManagerOrAdmin**) |
| GET | `/api/admin/customers/types` | Loại khách (B2C, B2B) |

### Query — `GET .../customers`

| Param | Mặc định | Ghi chú |
| ----- | -------- | ------- |
| `page` | 1 | |
| `pageSize` | 20 | |
| `customerType` | — | Theo `types` |
| `hasDebt` | — | `true` / `false` lọc B2B có nợ |
| `search` | — | Tìm kiếm |

### Query — `GET .../customers/{id}/orders`

| Param | Mặc định |
| ----- | -------- |
| `page` | 1 |
| `pageSize` | 20 |

### Body — `POST .../customers`

| Field | Kiểu | Bắt buộc | Ghi chú |
| ----- | ---- | -------- | ------- |
| `customerType` | string | Có | VD `B2C`, `B2B` — lấy gợi ý từ `GET .../types` |
| `fullName` | string | Có | |
| `email` | string | Không | |
| `phone` | string | Có | |
| `companyName` | string | Không | B2B |
| `taxCode` | string | Không | B2B |
| `companyAddress` | string | Không | B2B |

```json
{
  "customerType": "B2B",
  "fullName": "Nguyễn Văn A",
  "email": "a@congty.vn",
  "phone": "0909123456",
  "companyName": "Công ty TNHH ABC",
  "taxCode": "0123456789",
  "companyAddress": "123 Đường X, Q.1, TP.HCM"
}
```

### Body — `PUT .../customers/{id}`

Tất cả field **optional** (chỉ gửi field cần đổi):

| Field | Kiểu |
| ----- | ---- |
| `customerType` | string |
| `fullName` | string |
| `email` | string |
| `phone` | string |
| `companyName` | string |
| `taxCode` | string |
| `companyAddress` | string |

```json
{
  "phone": "0910987654",
  "companyAddress": "Địa chỉ mới"
}
```

### Body — `POST .../debt/adjust`

| Field | Kiểu | Bắt buộc | Ghi chú |
| ----- | ---- | -------- | ------- |
| `amount` | number | Có | Dương: tăng nợ; âm: giảm nợ / ghi nhận thanh toán công nợ |
| `reason` | string | Không | Nên bắt buộc phía UI |

```json
{
  "amount": -5000000,
  "reason": "Khách chuyển kho thanh toán công nợ đợt 1"
}
```

---

## Luồng UI gợi ý

### A) CRM mini

1. Danh sách với chip **B2B** / **B2C**; filter `hasDebt` cho kế toán.
2. Drawer chi tiết: tab Thông tin | Đơn hàng | Công nợ (chỉ B2B).

### B) Tạo khách tại quầy

1. Form rút gọn → POST → dùng `id` cho luồng báo giá / đơn.

### C) Điều chỉnh nợ

1. Chỉ role được phép (theo policy nội bộ); luôn nhập `reason` khi điều chỉnh nợ.

---

## UX tối ưu

- Mask/hiển thị SĐT, MST hợp lý theo policy bảo mật.
- Sau `debt/adjust`: refetch `debt` + badge danh sách.
- Link nhanh “Tạo báo giá” từ chi tiết khách (prefill `customerId`).
