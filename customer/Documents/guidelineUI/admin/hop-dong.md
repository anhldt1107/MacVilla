# Admin — Hợp đồng (`/api/admin/contracts`)

## Mục đích

Quản lý **hợp đồng** sau báo giá: tạo từ báo giá đã chấp thuận, chỉnh sửa nháp / chờ khách xác nhận, gửi khách, hủy. Hỗ trợ luồng B2B chặt chẽ trước khi chuyển đơn.

**Auth:** **StaffAuthenticated**.

**FE:** Swagger `/swagger`, OpenAPI `/swagger/v1/swagger.json`. Field JSON (camelCase).

## API


| Method | Path                                                       | Mô tả                                                               |
| ------ | ---------------------------------------------------------- | ------------------------------------------------------------------- |
| GET    | `/api/admin/contracts`                                     | Danh sách phân trang                                                |
| GET    | `/api/admin/contracts/{id}`                                | Chi tiết                                                            |
| GET    | `/api/admin/contracts/by-number/{contractNumber}`          | Chi tiết theo mã hợp đồng                                           |
| POST   | `/api/admin/contracts`                                     | Tạo từ báo giá (Approved hoặc CustomerAccepted)                     |
| PUT    | `/api/admin/contracts/{id}`                                | Cập nhật (Draft hoặc PendingConfirmation, trước khi khách xác nhận) |
| PUT    | `/api/admin/contracts/{id}/send-for-customer-confirmation` | Draft → PendingConfirmation                                         |
| PUT    | `/api/admin/contracts/{id}/cancel`                         | Hủy (theo `ContractStatuses`)                                       |
| GET    | `/api/admin/contracts/statuses`                            | Danh sách trạng thái                                                |


### Query — `GET .../contracts`


| Param        | Mặc định | Ghi chú |
| ------------ | -------- | ------- |
| `page`       | 1        |         |
| `pageSize`   | 20       |         |
| `status`     | —        |         |
| `customerId` | —        |         |
| `quoteId`    | —        |         |


### Body — `POST .../contracts`


| Field                         | Kiểu              | Bắt buộc | Ghi chú                                                                        |
| ----------------------------- | ----------------- | -------- | ------------------------------------------------------------------------------ |
| `quoteId`                     | number            | Có       | Báo giá Approved / CustomerAccepted                                            |
| `sendForCustomerConfirmation` | boolean           | Có       | `true`: gửi khách xác nhận (PendingConfirmation); `false`: nháp nội bộ (Draft) |
| `validFrom`                   | string (ISO 8601) | Không    |                                                                                |
| `validTo`                     | string (ISO 8601) | Không    |                                                                                |
| `paymentTerms`                | string            | Không    |                                                                                |
| `attachmentUrl`               | string            | Không    | Link file đính kèm                                                             |
| `notes`                       | string            | Không    |                                                                                |


```json
{
  "quoteId": 42,
  "sendForCustomerConfirmation": true,
  "validFrom": "2026-04-01T00:00:00.000Z",
  "validTo": "2026-12-31T23:59:59.000Z",
  "paymentTerms": "Thanh toán 30 ngày sau xuất HĐ",
  "attachmentUrl": "https://.../hop-dong.pdf",
  "notes": "Gửi kèm phụ lục A"
}
```

### Body — `PUT .../{id}`


| Field           | Kiểu              | Bắt buộc |
| --------------- | ----------------- | -------- |
| `validFrom`     | string (ISO 8601) | Không    |
| `validTo`       | string (ISO 8601) | Không    |
| `paymentTerms`  | string            | Không    |
| `attachmentUrl` | string            | Không    |
| `notes`         | string            | Không    |


```json
{
  "validTo": "2027-01-15T23:59:59.000Z",
  "paymentTerms": "Cập nhật: 45 ngày",
  "notes": "Sửa theo trao đổi email 10/4"
}
```

### Body — `PUT .../{id}/cancel`

Body optional; nên gửi lý do.


| Field    | Kiểu   | Bắt buộc |
| -------- | ------ | -------- |
| `reason` | string | Không    |


```json
{
  "reason": "Khách không ký trong hạn"
}
```

---

## Luồng UI gợi ý

### A) Từ báo giá đã duyệt

1. Nút “Tạo hợp đồng” trên chi tiết báo giá → POST với `quoteId`.
2. Chỉnh nội dung trong Draft → **Gửi khách xác nhận**.

### B) Theo dõi trạng thái

1. Dùng `GET .../statuses` để build filter + màu badge.
2. Khi khách xác nhận (luồng có thể qua portal khách — ngoài phạm vi admin API thuần), refresh chi tiết hợp đồng.

### C) Liên kết đơn / báo giá

1. `convert-to-order` trên báo giá có thể nhận `contractId` — UI nên chọn hợp đồng **Confirmed/Active** từ danh sách filter `customerId` / `quoteId`.

---

## UX tối ưu

- So sánh diff phiên bản hợp đồng (FE) nếu có nhiều lần chỉnh — BE không bắt buộc hỗ trợ versioning.
- PDF preview / tải (nếu BE lưu file URL).
- Confirm mạnh trước **Cancel**.

