# Manager — Báo cáo / Dashboard (`/api/admin/reports`)

Auth: **ManagerOrAdmin**.

Chi tiết field đầy đủ: [../admin/bao-cao.md](../admin/bao-cao.md). File này nhấn trọng điểm Manager.

## API

| Method | Path | Ý nghĩa |
| ------ | ---- | ------- |
| GET | `/api/admin/reports/sales-overview?fromDate&toDate` | KPI tổng quan |
| GET | `/api/admin/reports/low-stock?threshold&take` | Cảnh báo tồn thấp |
| GET | `/api/admin/reports/top-sales?fromDate&toDate&limit` | Xếp hạng Sales |

## Widget dashboard gợi ý

1. **KPI hôm nay / tuần / tháng** — `sales-overview` với preset:
   - `netRevenue`, `totalOrderValue`, `orderCount`, `newCustomerCount`.
   - Card “cần xử lý”: `quotePendingApprovalCount` (link [bao-gia.md](./bao-gia.md)), `transferNotificationPendingCount` (link [hoa-don-va-thanh-toan.md](./hoa-don-va-thanh-toan.md#thông-báo-ck)), `invoicesOverdueCount`.

2. **Tồn thấp** — `low-stock?threshold=10` (hoặc tuỳ thiết lập) → bảng SKU, cột cuối có nút **“Nhập kho”** dẫn sang [kho-va-fulfillment.md](./kho-va-fulfillment.md).

3. **Top Sales** — bar chart từ `top-sales?limit=10` theo tháng hiện tại; click vào Sales mở list `orders?salesId=<..>`.

## So sánh kỳ trước

BE chưa trả số liệu kỳ trước; FE tự gọi 2 lần với 2 khoảng và tính chênh lệch.

## UX

- Cache 30s/phân đoạn để tránh spam khi đổi nhanh preset.
- Reuse list staff cho tooltip/avatar top-sales từ [nhan-su-va-phan-cong.md](./nhan-su-va-phan-cong.md).
