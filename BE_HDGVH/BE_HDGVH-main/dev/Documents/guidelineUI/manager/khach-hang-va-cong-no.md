# Manager — Khách hàng & công nợ (`/api/admin/customers`)

## Phạm vi

Tra cứu khách, xem công nợ, **điều chỉnh công nợ** (`debt/adjust`) — thuộc Manager/Admin. Field đầy đủ: [../admin/khach-hang.md](../admin/khach-hang.md).

## API

| Method | Path | Policy |
| ------ | ---- | ------ |
| GET | `/api/admin/customers?...` | Staff |
| GET | `/api/admin/customers/{id}` | Staff |
| POST | `/api/admin/customers` | Staff |
| PUT | `/api/admin/customers/{id}` | Staff |
| GET | `/api/admin/customers/{id}/orders` | Staff |
| GET | `/api/admin/customers/{id}/debt` | Staff |
| POST | `/api/admin/customers/{id}/debt/adjust` | **ManagerOrAdmin** |
| GET | `/api/admin/customers/types` | Staff |

## Body — `POST /{id}/debt/adjust`

Tham khảo [../admin/khach-hang.md](../admin/khach-hang.md):

```json
{
  "amount": -500000,
  "reason": "Khuyến mãi cuối năm – giảm công nợ",
  "referenceCode": "KM2026-001"
}
```

- `amount` dương → **tăng nợ** (tạo `AdjustmentIncrease`).
- `amount` âm → **giảm nợ / thanh toán** (tạo `AdjustmentDecrease` hoặc tương đương theo BE).

## Luồng UI

1. Tab **Công nợ** ở profile khách: card tổng + danh sách HĐ quá hạn (qua `GET /api/admin/invoices?status=Overdue&customerId=...`).
2. Nút **Điều chỉnh công nợ** (chỉ Manager/Admin) → form `amount`, `reason`, `referenceCode`.
3. Sau khi điều chỉnh → refetch `debt` + HĐ liên quan.

## UX

- Bắt buộc `reason`; log audit phía client (và BE nếu có).
- Cảnh báo khi `amount` lớn (ngưỡng team cấu hình).
- Không cho Sales mở dialog này — UI ẩn khi `roleName !== "Manager" && "admin"`.
