# Manager — Hợp đồng (`/api/admin/contracts`)

## Mục đích

Manager kiểm tra, tạo (nếu cần), **gửi khách xác nhận** và **hủy** hợp đồng B2B. Chi tiết field: [../admin/hop-dong.md](../admin/hop-dong.md).

## Endpoint Manager dùng

Tất cả policy **StaffAuthenticated** (Manager dùng được). Hiện chưa có `approve/reject` nội bộ — workflow tiêu chuẩn: Sales tạo Draft → Manager xem / gửi xác nhận → khách confirm qua store.

| Method | Path | Ghi chú |
| ------ | ---- | ------- |
| GET | `/api/admin/contracts?status&customerId&quoteId` | Danh sách |
| GET | `/api/admin/contracts/{id}`, `/by-number/{contractNumber}` | Chi tiết |
| POST | `/api/admin/contracts` | Tạo hợp đồng (từ `quoteId`) |
| PUT | `/api/admin/contracts/{id}` | Sửa (Draft) |
| PUT | `/api/admin/contracts/{id}/send-for-customer-confirmation` | → PendingConfirmation |
| PUT | `/api/admin/contracts/{id}/cancel` | Hủy |
| GET | `/api/admin/contracts/statuses` | |

## Luồng UI

1. Tab **Chờ xử lý** (`status=Draft`): kiểm điều khoản / `validFrom`/`validTo` → `send-for-customer-confirmation`.
2. Tab **PendingConfirmation**: theo dõi khách confirm qua store ([../b2b/hop-dong.md](../b2b/hop-dong.md)).
3. Khi khách confirm → **Confirmed** → Sales có thể convert đơn ([../admin/bao-gia.md](../admin/bao-gia.md#convert-to-order)) với `contractId`.
4. Cần huỷ: `PUT /cancel` với body cancel DTO.

## UX

- Disable Sửa / Send khi `status !== "Draft"`.
- Liên kết ngược về báo giá nguồn (`quoteCode`) và sang đơn phát sinh.
