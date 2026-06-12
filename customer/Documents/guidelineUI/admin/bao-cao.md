# Admin — Báo cáo / Dashboard (`/api/admin/reports`)

## Mục đích

Cung cấp số liệu tổng quan cho **Manager / Admin**: doanh thu & đơn theo thời gian, cảnh báo SKU tồn thấp, xếp hạng Sales theo doanh thu.

**Auth:** **ManagerOrAdmin** — Sales / Worker / StockManager gọi sẽ **403**.

**FE:** Swagger `/swagger`, OpenAPI `/swagger/v1/swagger.json`. Field JSON (camelCase).

## API

| Method | Path | Mô tả |
| ------ | ---- | ----- |
| GET | `/api/admin/reports/sales-overview` | Tổng quan kinh doanh |
| GET | `/api/admin/reports/low-stock` | SKU tồn khả dụng thấp |
| GET | `/api/admin/reports/top-sales` | Top Sales theo doanh thu |

---

### `GET /sales-overview`

Query:

| Param | Mặc định | Ghi chú |
| ----- | -------- | ------- |
| `fromDate` | — | ISO 8601; `toDate` lấy tới hết ngày |
| `toDate` | — | |

Response `data`:

| Field | Kiểu | Ghi chú |
| ----- | ---- | ------- |
| `fromDate`, `toDate` | string \| null | Khoảng thực áp dụng (`toDate` đã mở rộng hết ngày) |
| `netRevenue` | number | Thu ròng = `Payment + AdjustmentIncrease` − `Refund − AdjustmentDecrease` |
| `totalPaymentIn` | number | Tổng thu |
| `totalPaymentOut` | number | Tổng hoàn / điều chỉnh giảm |
| `totalOrderValue` | number | Tổng `payableTotal` của đơn (không tính Cancelled) |
| `orderCount` | number | Đơn (không tính Cancelled) |
| `cancelledOrderCount` | number | Đơn bị hủy |
| `newCustomerCount` | number | Khách mới trong khoảng |
| `quotePendingApprovalCount` | number | Báo giá chờ duyệt (toàn hệ thống, không lọc theo thời gian) |
| `transferNotificationPendingCount` | number | Thông báo CK Pending chờ đối soát (toàn hệ thống) |
| `invoicesOverdueCount` | number | HĐ quá hạn còn dư nợ |
| `totalUnpaidInvoiceAmount` | number | Tổng dư nợ HĐ chưa thanh toán đủ |

---

### `GET /low-stock`

| Param | Mặc định | Ghi chú |
| ----- | -------- | ------- |
| `threshold` | 10 | `QuantityAvailable <= threshold` |
| `take` | 100 | Clamp 1..500 |

`data`: mảng item

| Field | Kiểu |
| ----- | ---- |
| `variantId`, `sku`, `variantName`, `productId`, `productName` | number / string |
| `warehouseLocation` | string \| null |
| `quantityOnHand`, `quantityReserved`, `quantityAvailable` | number |

---

### `GET /top-sales`

| Param | Mặc định | Ghi chú |
| ----- | -------- | ------- |
| `fromDate`, `toDate` | — | |
| `limit` | 10 | Clamp 1..100 |

`data`: mảng

| Field | Kiểu |
| ----- | ---- |
| `salesId` | number |
| `fullName`, `email`, `phone` | string |
| `orderCount` | number |
| `totalRevenue` | number | Tổng `payableTotal` |

---

## Luồng UI gợi ý

### A) Trang dashboard Manager

1. Chọn preset khoảng ngày (Hôm nay / Tuần / Tháng này / Quý / Custom) → 1 lần gọi `sales-overview`.
2. Widget KPI: `netRevenue`, `orderCount`, `newCustomerCount`, badge `quotePendingApprovalCount` (link sang [bao-gia.md](./bao-gia.md?status=PendingApproval)), badge `transferNotificationPendingCount` (link [thong-bao-chuyen-khoan.md](./thong-bao-chuyen-khoan.md)).
3. Widget công nợ: `invoicesOverdueCount`, `totalUnpaidInvoiceAmount`.

### B) Cảnh báo kho

1. Trang **Tồn thấp**: filter `threshold`, mặc định 10.
2. Hành động: link sang [giao-dich-kho.md](./giao-dich-kho.md) (nhập kho) hoặc [fulfillment.md](./fulfillment.md) khi cần.

### C) KPI nhân viên

1. `top-sales` filter theo tháng → bảng xếp hạng.
2. Click row có thể filter `GET /api/admin/orders?salesId=<..>` để xem đơn.

## UX

- Cache dashboard ngắn (VD 30s) để tránh spam khi Manager chuyển khoảng nhanh.
- Đỏ/vàng/xanh theo `netRevenue` so với kỳ trước (client tính).
