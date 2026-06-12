# Manager — Đổi trả & bảo hành

## Phạm vi

Manager **duyệt** đổi trả, theo dõi bảo hành. Thao tác `complete` đổi trả thuộc StockManager (kho nhận hàng). Field đầy đủ: [../admin/doi-tra.md](../admin/doi-tra.md), [../admin/bao-hanh.md](../admin/bao-hanh.md).

## Đổi trả — `/api/admin/returns`

| Method | Path | Policy |
| ------ | ---- | ------ |
| GET | `/api/admin/returns?status&customerId&orderId&search` | Staff |
| GET | `/api/admin/returns/{id}`, `/by-number/{ticketNumber}` | Staff |
| POST | `/api/admin/returns` | Staff |
| PUT | `/api/admin/returns/{id}/approve` | **ManagerOrAdmin** |
| PUT | `/api/admin/returns/{id}/reject` | **ManagerOrAdmin** |
| PUT | `/api/admin/returns/{id}/complete` | StockManager (Manager thường **không** trực tiếp) |
| GET | `/api/admin/returns/statuses`, `/types` | Staff |

### Body

- `approve`: `{ "refundAmount": 500000, "note": "..." }` (field theo [../admin/doi-tra.md](../admin/doi-tra.md)).
- `reject`: `{ "rejectReason": "Quá thời hạn policy" }`.

## Bảo hành — `/api/admin/warranty-tickets`, `/api/admin/warranty-claims`

| Method | Path | Policy |
| ------ | ---- | ------ |
| GET | `/api/admin/warranty-tickets?...` | Staff |
| GET | `/api/admin/warranty-tickets/{id}`, `/by-number/{ticketNumber}` | Staff |
| POST | `/api/admin/warranty-tickets` | Staff |
| POST | `/api/admin/warranty-tickets/{id}/claims` | Staff |
| GET | `/api/admin/warranty-tickets/statuses` | Staff |
| GET | `/api/admin/warranty-claims/{id}` | Staff |
| PUT | `/api/admin/warranty-claims/{id}/status` | Staff |

Hiện **không** có `approve/reject` riêng của Manager cho phiếu BH — Manager dùng `PUT claims/{id}/status` để điều hành trạng thái (`Pending → Approved → Processing → Repaired / Replaced / Rejected`, tùy domain).

## Luồng UI

### A) Hàng chờ đổi trả

1. Filter `status=Pending` → mở chi tiết → **Approve** (nhập `refundAmount`) hoặc **Reject** với lý do.
2. Sau Approve → StockManager nhận và `complete` qua màn kho.

### B) Hàng chờ bảo hành

1. List phiếu BH theo trạng thái → mở claims → cập nhật `status`.
2. Đồng bộ với xuất/nhập phụ tùng (nếu có) qua [kho-va-fulfillment.md](./kho-va-fulfillment.md).

## UX

- Ẩn **complete** khỏi Manager; hiển thị ở workspace kho.
- Cảnh báo `refundAmount` lớn hơn tổng tiền đơn / item đã trả → 409.
