# Manager — Duyệt báo giá (`/api/admin/quotes`)

## Mục đích

Manager **duyệt / từ chối** báo giá đã được Sales submit. Các thao tác soạn báo giá thuộc Sales ([../sales/bao-gia.md](../sales/bao-gia.md)).

Field đầy đủ: [../admin/bao-gia.md](../admin/bao-gia.md).

## Endpoint Manager dùng

| Method | Path | Policy | Ghi chú |
| ------ | ---- | ------ | ------- |
| GET | `/api/admin/quotes?status=PendingApproval&...` | Staff | Hàng đợi duyệt |
| GET | `/api/admin/quotes/{id}`, `/by-code/{quoteCode}` | Staff | Chi tiết |
| PUT | `/api/admin/quotes/{id}/approve` | **ManagerOrAdmin** | PendingApproval → Approved |
| PUT | `/api/admin/quotes/{id}/reject` | **ManagerOrAdmin** | PendingApproval → Rejected + lý do |
| PUT | `/api/admin/quotes/{id}/return-to-draft` | Staff | Trả Sales sửa lại |
| GET | `/api/admin/quotes/statuses` | Staff | |

## Body

### `PUT /{id}/reject` — `AdminQuoteRejectDto`

| Field | Kiểu | Bắt buộc | Ghi chú |
| ----- | ---- | -------- | ------- |
| `rejectReason` | string | Nên bắt buộc phía UI | Ghi chú Manager |

```json
{ "rejectReason": "Giá vượt ngưỡng duyệt tháng này" }
```

## Luồng UI

1. **Hàng đợi duyệt** — filter `status=PendingApproval`, sort theo `createdAt` giảm dần.
2. Mở chi tiết → xem `lines`, chiết khấu, `validUntil`, ghi chú Sales.
3. **Approve** → `PUT /{id}/approve` → khách store B2B nhận thông báo phản hồi.
4. **Reject** với `rejectReason` → Sales sẽ dùng `return-to-draft` để sửa lại và submit lại.

## UX

- Disable nút Approve/Reject nếu `status !== "PendingApproval"`.
- Hiển thị thông tin Sales người soạn, thời gian submit.
- Cảnh báo khi tổng báo giá vượt ngưỡng / dưới giá vốn (client tính từ `lines`).
