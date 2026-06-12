# Tích hợp FE — Dashboards nội bộ (Admin / Manager / Sales / StockManager)

Tài liệu **đứng độc lập** cho FE để gắn các API dashboard. Backend là ASP.NET Core (BE_API). Thay `{BASE_URL}` bằng origin BE (vd `https://api.example.com`).

Tất cả endpoint thuộc nhóm này nằm dưới prefix:

```
{BASE_URL}/api/admin/dashboard/...
```

> Mục tiêu: cung cấp dữ liệu **đã tính sẵn theo công thức** để FE chỉ vẽ chart, không phải tự tổng hợp lại từ list endpoint.

---

## 1. Auth & header


| Header          | Giá trị                                       |
| --------------- | --------------------------------------------- |
| `Authorization` | `Bearer <staffJwt>`                           |
| `Content-Type`  | `application/json` (không bắt buộc với `GET`) |


JWT lấy từ `POST /api/Auth/login` (nhân sự nội bộ).


| Policy gắn endpoint  | Role được vào                        |
| -------------------- | ------------------------------------ |
| `ManagerOrAdmin`     | Admin, Manager                       |
| `WarehouseStaff`     | Admin, Manager, StockManager, Worker |
| `StaffAuthenticated` | mọi nhân sự nội bộ đăng nhập         |


Nếu sai/thiếu quyền → HTTP `401`/`403`, envelope `success: false`.

---

## 2. Envelope chuẩn

Mọi response **bọc** bởi:

```json
{
  "success": true,
  "data": {},
  "message": "OK"
}
```

Khi lỗi:

```json
{
  "success": false,
  "data": null,
  "message": "Thông báo lỗi",
  "errorCode": "VALIDATION_ERROR",
  "errors": { "fieldName": ["Lỗi"] }
}
```

JSON property là **camelCase** (`System.Text.Json` dùng `JsonNamingPolicy.CamelCase`).

---

## 3. Quy ước dùng chung

### 3.1 Khoảng thời gian

- Query: `fromDate` (ISO 8601, vd `2026-04-01`), `toDate` (ISO 8601, vd `2026-04-30`).
- **Không truyền** → mặc định **30 ngày gần nhất** (server tự tính).
- `toDate` được làm tròn lên **end-of-day** ở server.

### 3.2 Granularity (timeseries)

- Query `granularity` ∈ `day | week | month`. Mặc định `day`.
- Server trả mảng `points` đã group sẵn theo timezone server (UTC).

### 3.3 Phân trang (cho endpoint table)

- Query `page` (default 1), `pageSize` (default 20, max 100).
- `data` có thể có dạng `{ items, totalCount, page, pageSize }` khi cần.

### 3.4 Refresh interval đề xuất


| Loại                                              | FE nên refresh                              |
| ------------------------------------------------- | ------------------------------------------- |
| KPI cards                                         | mỗi **5 phút**                              |
| Timeseries / pipeline / inventory trend           | mỗi **15–30 phút**                          |
| Table cảnh báo (low stock, late orders, expiring) | mỗi **5 phút** hoặc on-demand sau action    |
| Aging công nợ                                     | **on-demand** + sau khi verify chuyển khoản |


---

## 4. Domain 1 — Revenue / Cashflow `(/revenue/*)`

Policy: `ManagerOrAdmin`.


| #   | Method | URL                                                        | Mô tả                                |
| --- | ------ | ---------------------------------------------------------- | ------------------------------------ |
| 4.1 | GET    | `{BASE_URL}/api/admin/dashboard/revenue/overview`          | KPI cards                            |
| 4.2 | GET    | `{BASE_URL}/api/admin/dashboard/revenue/timeseries`        | Doanh thu theo thời gian             |
| 4.3 | GET    | `{BASE_URL}/api/admin/dashboard/revenue/by-payment-method` | Tỷ trọng theo phương thức thanh toán |
| 4.4 | GET    | `{BASE_URL}/api/admin/dashboard/revenue/by-channel`        | B2C vs B2B                           |


---

### 4.1 GET `/revenue/overview`

**Query:** `fromDate?`, `toDate?`.

**Công thức:**

- `totalIn = SUM(PaymentTransaction.Amount WHERE TransactionType ∈ {Payment, AdjustmentIncrease})`
- `totalOut = SUM(PaymentTransaction.Amount WHERE TransactionType ∈ {Refund, AdjustmentDecrease})`
- `netRevenue = totalIn − totalOut`
- `orderCount = COUNT(CustomerOrder WHERE OrderStatus ≠ Cancelled)`
- `aov = totalOrderValue / max(1, orderCount)` (Average Order Value)
- `refundRate = totalOut / max(1, totalIn)`

**Request mẫu:**

```
GET /api/admin/dashboard/revenue/overview?fromDate=2026-04-01&toDate=2026-04-30
```

**Response mẫu:**

```json
{
  "success": true,
  "message": "OK",
  "data": {
    "fromDate": "2026-04-01T00:00:00Z",
    "toDate": "2026-04-30T23:59:59Z",
    "netRevenue": 187650000,
    "totalIn": 198500000,
    "totalOut": 10850000,
    "orderCount": 142,
    "cancelledOrderCount": 7,
    "totalOrderValue": 215000000,
    "averageOrderValue": 1514084.51,
    "refundRate": 0.0547,
    "newCustomerCount": 18
  }
}
```

**Chart gợi ý:** **6 KPI cards** (Net revenue, Total in, Total out, Orders, AOV, Refund rate).

---

### 4.2 GET `/revenue/timeseries`

**Query:** `fromDate?`, `toDate?`, `granularity` (`day` | `week` | `month`, default `day`).

**Công thức:** group `PaymentTransaction.PaymentDate` theo bucket; mỗi bucket trả `inAmount`, `outAmount`, `net = in − out`.

**Request mẫu:**

```
GET /api/admin/dashboard/revenue/timeseries?fromDate=2026-04-01&toDate=2026-04-30&granularity=day
```

**Response mẫu:**

```json
{
  "success": true,
  "message": "OK",
  "data": {
    "granularity": "day",
    "points": [
      { "bucket": "2026-04-01", "inAmount": 12500000, "outAmount": 0, "net": 12500000 },
      { "bucket": "2026-04-02", "inAmount":  8200000, "outAmount": 500000, "net":  7700000 },
      { "bucket": "2026-04-03", "inAmount":        0, "outAmount":      0, "net":        0 }
    ]
  }
}
```

**Chart gợi ý:** **Line chart** (3 series: in / out / net) hoặc **area chart** cho `net`. Trục X = `bucket`.

---

### 4.3 GET `/revenue/by-payment-method`

**Query:** `fromDate?`, `toDate?`.

**Công thức:** group `PaymentTransaction.PaymentMethod` (null → `Unknown`), tổng `Amount` theo `IsIncome`.

**Response mẫu:**

```json
{
  "success": true,
  "message": "OK",
  "data": {
    "buckets": [
      { "label": "BankTransfer", "amount": 120500000, "share": 0.6075 },
      { "label": "PayOS",        "amount":  62000000, "share": 0.3125 },
      { "label": "Cash",         "amount":  16000000, "share": 0.0807 },
      { "label": "Unknown",      "amount":         0, "share": 0.0000 }
    ],
    "total": 198500000
  }
}
```

**Chart gợi ý:** **Donut/Pie chart**. Tooltip dùng `share` × 100 → `%`.

---

### 4.4 GET `/revenue/by-channel`

**Query:** `fromDate?`, `toDate?`, `granularity?` (default `day`).

**Công thức:** join `CustomerOrder` ↔ `Customer.CustomerType`; group theo bucket + B2C/B2B; lấy `SUM(PayableTotal)` của đơn không Cancelled.

**Response mẫu:**

```json
{
  "success": true,
  "message": "OK",
  "data": {
    "granularity": "day",
    "points": [
      { "bucket": "2026-04-01", "b2c": 5200000, "b2b": 7300000 },
      { "bucket": "2026-04-02", "b2c": 4100000, "b2b":       0 }
    ],
    "totals": { "b2c": 92000000, "b2b": 123000000 }
  }
}
```

**Chart gợi ý:** **Stacked bar** (2 series B2C/B2B). Có thể kèm KPI 2 cột tổng B2C/B2B từ `totals`.

---

## 5. Domain 2 — AR / Công nợ `(/ar/*)`

Policy: `ManagerOrAdmin`.


| #   | Method | URL               | Mô tả                |
| --- | ------ | ----------------- | -------------------- |
| 5.1 | GET    | `/ar/summary`     | KPI tổng quan        |
| 5.2 | GET    | `/ar/aging`       | Chia bucket aging    |
| 5.3 | GET    | `/ar/top-debtors` | Top khách nợ         |
| 5.4 | GET    | `/ar/timeseries`  | Tổng dư nợ theo ngày |


**Công thức gốc cho mọi endpoint AR (mỗi hóa đơn):**

```
remaining = TotalAmount
          − SUM(PaymentTransaction.Amount WHERE TransactionType ∈ {Payment, AdjustmentIncrease})
          + SUM(PaymentTransaction.Amount WHERE TransactionType ∈ {Refund, AdjustmentDecrease})
```

Bỏ qua hóa đơn `Status ∈ {Paid, Cancelled, Draft}` khi tính dư nợ.

---

### 5.1 GET `/ar/summary`

**Response mẫu:**

```json
{
  "success": true,
  "message": "OK",
  "data": {
    "totalUnpaidAmount": 75600000,
    "totalUnpaidCount": 23,
    "overdueAmount":    18500000,
    "overdueCount":      8,
    "dueSoonAmount":    12300000,
    "dueSoonCount":      4,
    "dueSoonWindowDays": 7
  }
}
```

**Chart gợi ý:** **4 KPI cards** (Unpaid, Overdue, Due soon, Window).

---

### 5.2 GET `/ar/aging`

Bucket phân theo `daysOverdue = (Now − DueDate)`:


| Bucket    | Quy ước                          |
| --------- | -------------------------------- |
| `Current` | chưa đến hạn (`daysOverdue ≤ 0`) |
| `1-30`    | 1 ≤ daysOverdue ≤ 30             |
| `31-60`   | 31 ≤ daysOverdue ≤ 60            |
| `61-90`   | 61 ≤ daysOverdue ≤ 90            |
| `>90`     | daysOverdue > 90                 |


**Response mẫu:**

```json
{
  "success": true,
  "message": "OK",
  "data": {
    "buckets": [
      { "label": "Current", "amount": 57100000, "invoiceCount": 15, "share": 0.7553 },
      { "label": "1-30",    "amount":  9000000, "invoiceCount":  4, "share": 0.1190 },
      { "label": "31-60",   "amount":  5500000, "invoiceCount":  2, "share": 0.0728 },
      { "label": "61-90",   "amount":  2500000, "invoiceCount":  1, "share": 0.0331 },
      { "label": ">90",     "amount":  1500000, "invoiceCount":  1, "share": 0.0198 }
    ],
    "total": 75600000
  }
}
```

**Chart gợi ý:** **Bar chart** (1 series `amount`) có nhãn bucket dọc theo trục X. Có thể overlay `invoiceCount` ở label.

---

### 5.3 GET `/ar/top-debtors`

**Query:** `limit?` (default 10, max 50).

**Response mẫu:**

```json
{
  "success": true,
  "message": "OK",
  "data": {
    "items": [
      {
        "customerId": 12,
        "customerName": "Công ty TNHH ABC",
        "customerType": "B2B",
        "remainingTotal": 18500000,
        "overdueAmount":   5500000,
        "invoiceCount":    3,
        "debtBalance":   18500000
      },
      {
        "customerId": 27,
        "customerName": "Công ty XYZ",
        "customerType": "B2B",
        "remainingTotal": 11200000,
        "overdueAmount":          0,
        "invoiceCount":    2,
        "debtBalance":   11200000
      }
    ]
  }
}
```

**Chart gợi ý:** **Horizontal bar** (`remainingTotal` theo khách) hoặc **Table** với cột màu cảnh báo `overdueAmount`.

---

### 5.4 GET `/ar/timeseries`

**Query:** `fromDate?`, `toDate?`, `granularity?` (`day|week|month`).

**Công thức:** snapshot tại cuối mỗi bucket: `SUM(remaining)` của các hóa đơn chưa đóng tới thời điểm đó.

**Response mẫu:**

```json
{
  "success": true,
  "message": "OK",
  "data": {
    "granularity": "day",
    "points": [
      { "bucket": "2026-04-01", "remainingTotal": 81000000, "overdueAmount": 15000000 },
      { "bucket": "2026-04-02", "remainingTotal": 79500000, "overdueAmount": 15800000 }
    ]
  }
}
```

**Chart gợi ý:** **Line chart** (2 series: total / overdue) — quan sát công nợ tăng/giảm.

---

## 6. Domain 3 — Sales pipeline `(/sales-pipeline/*)`

Policy: `ManagerOrAdmin`. Endpoint cá nhân (`?salesId=`) không phải Manager/Admin chỉ xem được dữ liệu chính mình.


| #   | Method | URL                             | Mô tả                       |
| --- | ------ | ------------------------------- | --------------------------- |
| 6.1 | GET    | `/sales-pipeline/funnel`        | Funnel theo `QuoteStatuses` |
| 6.2 | GET    | `/sales-pipeline/conversion`    | KPI conversion              |
| 6.3 | GET    | `/sales-pipeline/time-in-stage` | Avg ngày ở từng trạng thái  |
| 6.4 | GET    | `/sales-pipeline/expiring-soon` | Báo giá sắp hết hạn         |


---

### 6.1 GET `/sales-pipeline/funnel`

**Query:** `fromDate?`, `toDate?`, `salesId?`.

**Công thức:** count + sum `FinalAmount` theo trạng thái `Quote` trong khoảng. Trả theo thứ tự pipeline.

**Response mẫu:**

```json
{
  "success": true,
  "message": "OK",
  "data": {
    "steps": [
      { "status": "Requested",        "count": 50, "totalValue": 450000000 },
      { "status": "Draft",            "count": 38, "totalValue": 350000000 },
      { "status": "PendingApproval",  "count": 22, "totalValue": 210000000 },
      { "status": "Approved",         "count": 18, "totalValue": 175000000 },
      { "status": "CustomerAccepted", "count": 12, "totalValue": 130000000 },
      { "status": "Converted",        "count":  9, "totalValue": 105000000 }
    ]
  }
}
```

**Chart gợi ý:** **Funnel chart**. Nếu thư viện không hỗ trợ funnel → **Bar chart ngang** giảm dần.

---

### 6.2 GET `/sales-pipeline/conversion`

**Query:** `fromDate?`, `toDate?`, `salesId?`.

**Công thức:**

- `acceptRate = COUNT(Quote WHERE CustomerAcceptedAt IN range) / max(1, COUNT(Quote WHERE ApprovedAt IN range))`
- `conversionRate = COUNT(Quote WHERE Status = Converted IN range) / max(1, COUNT(Quote WHERE Status = Approved or later))`
- `avgTimeRequestedToApprovedDays = avg(ApprovedAt − CreatedAt)` (chỉ tính khi `ApprovedAt` không null)
- `avgTimeApprovedToAcceptedDays = avg(CustomerAcceptedAt − ApprovedAt)`

**Response mẫu:**

```json
{
  "success": true,
  "message": "OK",
  "data": {
    "acceptRate": 0.6667,
    "conversionRate": 0.5,
    "avgTimeRequestedToApprovedDays": 1.4,
    "avgTimeApprovedToAcceptedDays": 2.1,
    "approvedQuoteCount": 18,
    "acceptedQuoteCount": 12,
    "convertedQuoteCount": 9
  }
}
```

**Chart gợi ý:** **3 KPI cards (%)** + **2 KPI cards (số ngày)**. Optional **gauge** cho `conversionRate`.

---

### 6.3 GET `/sales-pipeline/time-in-stage`

**Query:** `fromDate?`, `toDate?`, `salesId?`.

**Công thức (chỉ dùng dữ liệu có sẵn trong `Quote`):**

- `Requested → Draft`: lùi sang tính bằng `Approved` first nếu không có log
- `Draft → PendingApproval`: cần lịch sử trạng thái (chưa có) → **trả null**
- `PendingApproval → Approved`: dùng `ApprovedAt − CreatedAt` (xấp xỉ, vì không có pendingAt)
- `Approved → CustomerAccepted`: `CustomerAcceptedAt − ApprovedAt`
- `CustomerAccepted → Converted`: `Order.CreatedAt − CustomerAcceptedAt` (join `CustomerOrder.QuoteId`)

**Response mẫu:**

```json
{
  "success": true,
  "message": "OK",
  "data": {
    "stages": [
      { "from": "PendingApproval",  "to": "Approved",         "avgDays": 1.4, "sampleSize": 18 },
      { "from": "Approved",         "to": "CustomerAccepted", "avgDays": 2.1, "sampleSize": 12 },
      { "from": "CustomerAccepted", "to": "Converted",        "avgDays": 0.6, "sampleSize":  9 }
    ]
  }
}
```

**Chart gợi ý:** **Bar chart ngang** (mỗi cột là 1 cặp from→to) — dễ thấy bottleneck.

---

### 6.4 GET `/sales-pipeline/expiring-soon`

**Query:** `days?` (default 7, max 60), `salesId?`.

**Logic:** liệt kê `Quote` `Approved` có `ValidUntil` trong vòng `days` ngày tới (inclusive Now).

**Response mẫu:**

```json
{
  "success": true,
  "message": "OK",
  "data": {
    "items": [
      {
        "quoteId": 142,
        "quoteCode": "QT-202604-0142",
        "customerName": "Công ty TNHH ABC",
        "salesId": 5,
        "salesName": "Trần Văn A",
        "finalAmount": 25000000,
        "validUntil": "2026-04-28T23:59:59Z",
        "daysUntilExpire": 3
      }
    ]
  }
}
```

**Chart gợi ý:** **Table cảnh báo** với cột màu (`daysUntilExpire ≤ 1` → đỏ).

---

## 7. Domain 4 — Inventory `(/inventory/*)`

Policy: `WarehouseStaff`.


| #   | Method | URL                             | Mô tả                        |
| --- | ------ | ------------------------------- | ---------------------------- |
| 7.1 | GET    | `/inventory/overview`           | KPI tồn                      |
| 7.2 | GET    | `/inventory/low-stock`          | SKU dưới ngưỡng              |
| 7.3 | GET    | `/inventory/days-of-cover`      | Ngày tồn còn bán             |
| 7.4 | GET    | `/inventory/reserve-ratio`      | Tỷ lệ giữ hàng               |
| 7.5 | GET    | `/inventory/transactions-trend` | Giao dịch kho theo thời gian |
| 7.6 | GET    | `/inventory/top-moving`         | SKU bán chạy                 |


---

### 7.1 GET `/inventory/overview`

**Công thức:**

- `skuActiveCount = COUNT(DISTINCT VariantId trong Inventory join ProductVariant join Product WHERE Product.Status = Active)`
- `lowStockCount = COUNT(Inventory WHERE QuantityAvailable ≤ COALESCE(ReorderPoint, defaultThreshold))`
- `totalReserved = SUM(QuantityReserved)`
- `totalOnHand = SUM(QuantityOnHand)`
- `totalOnHandValue = SUM(QuantityOnHand * Variant.CostPrice)` (giá trị tồn theo giá vốn)

**Response mẫu:**

```json
{
  "success": true,
  "message": "OK",
  "data": {
    "skuActiveCount": 540,
    "lowStockCount": 22,
    "totalOnHand": 8540,
    "totalReserved": 312,
    "totalOnHandValue": 1820500000,
    "defaultThreshold": 10
  }
}
```

**Chart gợi ý:** **5 KPI cards**.

---

### 7.2 GET `/inventory/low-stock`

**Query:** `threshold?` (default 10, max 1000), `take?` (default 100, max 500), `windowDays?` (default 30) — dùng để tính `daysOfCover` đính kèm.

**Response mẫu:**

```json
{
  "success": true,
  "message": "OK",
  "data": {
    "items": [
      {
        "variantId": 102,
        "sku": "SOFA-RED-1M2",
        "variantName": "Sofa đỏ 1m2",
        "productId": 15,
        "productName": "Sofa Bộ 3",
        "warehouseLocation": "K1-A2",
        "quantityOnHand":   8,
        "quantityReserved": 5,
        "quantityAvailable": 3,
        "reorderPoint": 10,
        "safetyStock": 5,
        "effectiveLowStockThreshold": 10,
        "daysOfCover": 1.8
      }
    ]
  }
}
```

**Chart gợi ý:** **Table** sort theo `daysOfCover` tăng dần; row đỏ khi `quantityAvailable ≤ safetyStock`.

---

### 7.3 GET `/inventory/days-of-cover`

**Query:** `windowDays?` (default 30, max 180), `take?` (default 30, max 200).

**Công thức:**

- `avgDailyOut = SUM(InventoryTransaction.Quantity WHERE Type=OUT AND Timestamp ∈ window) / windowDays`
- `daysOfCover = QuantityAvailable / max(1, avgDailyOut)` (làm tròn 1 chữ số). Nếu `avgDailyOut = 0` → `daysOfCover = null` (FE hiển thị `—`).

**Response mẫu:**

```json
{
  "success": true,
  "message": "OK",
  "data": {
    "windowDays": 30,
    "items": [
      { "variantId": 102, "sku": "SOFA-RED-1M2", "quantityAvailable": 3,  "avgDailyOut": 1.7, "daysOfCover": 1.8 },
      { "variantId": 110, "sku": "BED-WHT-1M6", "quantityAvailable": 12, "avgDailyOut": 0.4, "daysOfCover": 30.0 },
      { "variantId": 111, "sku": "TBL-OAK-S",   "quantityAvailable": 5,  "avgDailyOut": 0.0, "daysOfCover": null }
    ]
  }
}
```

**Chart gợi ý:** **Horizontal bar** (X = `daysOfCover`) — sort tăng dần để thấy SKU sắp hết. Có thể hiển thị **heatmap** nếu nhiều SKU.

---

### 7.4 GET `/inventory/reserve-ratio`

**Query:** `take?` (default 30).

**Công thức:** `ratio = QuantityReserved / max(1, QuantityOnHand)`. Sort giảm dần.

**Response mẫu:**

```json
{
  "success": true,
  "message": "OK",
  "data": {
    "items": [
      { "variantId": 102, "sku": "SOFA-RED-1M2", "quantityOnHand": 8, "quantityReserved": 5, "ratio": 0.625 },
      { "variantId": 130, "sku": "WD-OAK-1M",   "quantityOnHand": 6, "quantityReserved": 3, "ratio": 0.5 }
    ]
  }
}
```

**Chart gợi ý:** **Horizontal bar** (X = `ratio` × 100%) — phát hiện SKU bị giữ quá nhiều.

---

### 7.5 GET `/inventory/transactions-trend`

**Query:** `fromDate?`, `toDate?`, `granularity?` (`day|week|month`).

**Công thức:** group `InventoryTransaction.Timestamp` theo bucket; mỗi bucket trả tổng quantity theo từng `TransactionType` (`IN`, `OUT`, `RESERVE`, `RELEASE`, `ADJUST`).

**Response mẫu:**

```json
{
  "success": true,
  "message": "OK",
  "data": {
    "granularity": "day",
    "points": [
      { "bucket": "2026-04-01", "in": 120, "out": 45, "reserve": 12, "release": 3, "adjust": 0 },
      { "bucket": "2026-04-02", "in":   0, "out": 23, "reserve":  6, "release": 1, "adjust": 2 }
    ]
  }
}
```

**Chart gợi ý:** **Stacked bar** (5 series). Có thể overlay line `out` để dễ nhìn.

---

### 7.6 GET `/inventory/top-moving`

**Query:** `fromDate?`, `toDate?`, `limit?` (default 10, max 100).

**Công thức:** `SUM(InventoryTransaction.Quantity WHERE Type=OUT AND Timestamp ∈ range)` group theo `VariantId`, sort giảm dần.

**Response mẫu:**

```json
{
  "success": true,
  "message": "OK",
  "data": {
    "items": [
      { "variantId": 102, "sku": "SOFA-RED-1M2", "productName": "Sofa Bộ 3", "totalOut": 51 },
      { "variantId": 110, "sku": "BED-WHT-1M6", "productName": "Giường WHT", "totalOut": 22 }
    ]
  }
}
```

**Chart gợi ý:** **Bar chart ngang** + **table** đi kèm.

---

## 8. Domain 5 — Operations / Fulfillment `(/operations/*)`

Policy: `WarehouseStaff` (read), một số SLA chỉ ManagerOrAdmin nếu chứa giá trị tiền.


| #   | Method | URL                                    | Mô tả                     |
| --- | ------ | -------------------------------------- | ------------------------- |
| 8.1 | GET    | `/operations/order-status-breakdown`   | Donut tiến độ đơn         |
| 8.2 | GET    | `/operations/fulfillment-status`       | Donut phiếu xuất          |
| 8.3 | GET    | `/operations/sla-confirmed-to-shipped` | KPI + histogram thời gian |
| 8.4 | GET    | `/operations/late-orders`              | Đơn trễ                   |


---

### 8.1 GET `/operations/order-status-breakdown`

**Query:** `fromDate?`, `toDate?`.

**Response mẫu:**

```json
{
  "success": true,
  "message": "OK",
  "data": {
    "buckets": [
      { "label": "New",             "count":  3, "share": 0.0210 },
      { "label": "AwaitingPayment", "count":  4, "share": 0.0280 },
      { "label": "Confirmed",       "count": 22, "share": 0.1538 },
      { "label": "Processing",      "count": 18, "share": 0.1259 },
      { "label": "ReadyToShip",     "count":  8, "share": 0.0559 },
      { "label": "Shipped",         "count": 15, "share": 0.1049 },
      { "label": "Delivered",       "count": 25, "share": 0.1748 },
      { "label": "Completed",       "count": 40, "share": 0.2797 },
      { "label": "Cancelled",       "count":  8, "share": 0.0559 }
    ],
    "total": 143
  }
}
```

**Chart gợi ý:** **Donut chart** + bảng nhỏ % bên cạnh.

---

### 8.2 GET `/operations/fulfillment-status`

**Query:** `fromDate?`, `toDate?`.

**Response mẫu:**

```json
{
  "success": true,
  "message": "OK",
  "data": {
    "buckets": [
      { "label": "Pending",   "count": 12, "share": 0.16 },
      { "label": "Picking",   "count": 18, "share": 0.24 },
      { "label": "Packed",    "count": 10, "share": 0.13 },
      { "label": "Shipped",   "count": 30, "share": 0.40 },
      { "label": "Cancelled", "count":  5, "share": 0.07 }
    ],
    "total": 75
  }
}
```

**Chart gợi ý:** **Donut**; FE map tên trạng thái sang nhãn tiếng Việt theo phụ lục §11.

---

### 8.3 GET `/operations/sla-confirmed-to-shipped`

**Query:** `fromDate?`, `toDate?`.

**Công thức:** với mỗi đơn `Shipped` trong range:

```
hours = (FulfillmentTicket.UpdatedAt khi chuyển sang Shipped)
        − (CustomerOrder.CreatedAt khi đã ở trạng thái Confirmed/Processing/...)
```

*Khi chưa có cột timestamp riêng cho từng status, server dùng xấp xỉ `Order.CreatedAt → first FulfillmentTicket.UpdatedAt với Status=Shipped`.*

Histogram theo bucket giờ: `0–24`, `24–48`, `48–72`, `72–168`, `>168`.

**Response mẫu:**

```json
{
  "success": true,
  "message": "OK",
  "data": {
    "avgHours": 39.5,
    "p50Hours": 32.0,
    "p90Hours": 86.0,
    "sampleSize": 80,
    "histogram": [
      { "label": "0-24",   "count": 25 },
      { "label": "24-48",  "count": 32 },
      { "label": "48-72",  "count": 12 },
      { "label": "72-168", "count":  9 },
      { "label": ">168",   "count":  2 }
    ]
  }
}
```

**Chart gợi ý:** **3 KPI cards** (avg / p50 / p90) + **Histogram bar**.

---

### 8.4 GET `/operations/late-orders`

**Query:** `slaHours?` (default 72, max 720).

**Logic:** đơn ở `Confirmed/Processing/ReadyToShip` đã quá `slaHours` kể từ `CreatedAt` mà chưa `Shipped`.

**Response mẫu:**

```json
{
  "success": true,
  "message": "OK",
  "data": {
    "slaHours": 72,
    "items": [
      {
        "orderId": 901,
        "orderCode": "ORD-202604-0901",
        "customerName": "Công ty XYZ",
        "orderStatus": "Processing",
        "createdAt":   "2026-04-19T10:22:00Z",
        "elapsedHours": 145.2,
        "salesName":   "Lê Thị B"
      }
    ]
  }
}
```

**Chart gợi ý:** **Table cảnh báo**, sort `elapsedHours` giảm dần; cột màu khi vượt 2× SLA.

---

## 9. Domain 6 — Sales performance `(/sales-performance/*)`

Policy: `ManagerOrAdmin`. Endpoint cá nhân `per-sales-detail` cho phép Sales tự xem (so sánh `salesId` với JWT).


| #   | Method | URL                                            | Mô tả              |
| --- | ------ | ---------------------------------------------- | ------------------ |
| 9.1 | GET    | `/sales-performance/top-sales`                 | Mirror endpoint cũ |
| 9.2 | GET    | `/sales-performance/per-sales-detail`          | KPI cá nhân        |
| 9.3 | GET    | `/sales-performance/quote-conversion-by-sales` | So sánh conversion |


---

### 9.1 GET `/sales-performance/top-sales`

**Query:** `fromDate?`, `toDate?`, `limit?` (default 10).

**Response mẫu:**

```json
{
  "success": true,
  "message": "OK",
  "data": {
    "items": [
      { "salesId": 5, "fullName": "Trần Văn A", "orderCount": 18, "totalRevenue": 92000000 },
      { "salesId": 7, "fullName": "Lê Thị B",   "orderCount": 12, "totalRevenue": 71000000 }
    ]
  }
}
```

**Chart gợi ý:** **Horizontal bar** + **Table**.

---

### 9.2 GET `/sales-performance/per-sales-detail`

**Query:** `salesId` (bắt buộc), `fromDate?`, `toDate?`.

**Công thức:**

- `quoteCount = COUNT(Quote WHERE SalesId = salesId AND CreatedAt ∈ range)`
- `approvedCount = COUNT(Quote ... AND ApprovedAt IN range)`
- `acceptedCount = COUNT(Quote ... AND CustomerAcceptedAt IN range)`
- `convertedCount = COUNT(Quote ... AND Status = Converted IN range)`
- `conversionRate = convertedCount / max(1, approvedCount)`
- `revenueContribution = SUM(CustomerOrder.PayableTotal WHERE SalesId = salesId AND OrderStatus ≠ Cancelled IN range)`
- `orderCount = COUNT(CustomerOrder ... ≠ Cancelled IN range)`

**Response mẫu:**

```json
{
  "success": true,
  "message": "OK",
  "data": {
    "salesId": 5,
    "fullName": "Trần Văn A",
    "quoteCount": 22,
    "approvedCount": 15,
    "acceptedCount": 11,
    "convertedCount": 9,
    "conversionRate": 0.6,
    "orderCount": 18,
    "revenueContribution": 92000000
  }
}
```

**Chart gợi ý:** **6 KPI cards** + 1 **gauge** cho `conversionRate`.

---

### 9.3 GET `/sales-performance/quote-conversion-by-sales`

**Query:** `fromDate?`, `toDate?`.

**Response mẫu:**

```json
{
  "success": true,
  "message": "OK",
  "data": {
    "items": [
      { "salesId": 5, "fullName": "Trần Văn A", "approvedCount": 15, "convertedCount":  9, "conversionRate": 0.6 },
      { "salesId": 7, "fullName": "Lê Thị B",   "approvedCount": 10, "convertedCount":  4, "conversionRate": 0.4 }
    ]
  }
}
```

**Chart gợi ý:** **Bar chart so sánh** (Y = `conversionRate %`) — kèm tooltip số quote.

---

## 10. Bảng tổng hợp endpoint (1 trang)


| Domain     | URL                                                                | Phương pháp | Chart           |
| ---------- | ------------------------------------------------------------------ | ----------- | --------------- |
| Revenue    | `/api/admin/dashboard/revenue/overview`                            | GET         | KPI             |
| Revenue    | `/api/admin/dashboard/revenue/timeseries`                          | GET         | Line/Area       |
| Revenue    | `/api/admin/dashboard/revenue/by-payment-method`                   | GET         | Donut           |
| Revenue    | `/api/admin/dashboard/revenue/by-channel`                          | GET         | Stacked bar     |
| AR         | `/api/admin/dashboard/ar/summary`                                  | GET         | KPI             |
| AR         | `/api/admin/dashboard/ar/aging`                                    | GET         | Bar             |
| AR         | `/api/admin/dashboard/ar/top-debtors`                              | GET         | Bar/Table       |
| AR         | `/api/admin/dashboard/ar/timeseries`                               | GET         | Line            |
| Pipeline   | `/api/admin/dashboard/sales-pipeline/funnel`                       | GET         | Funnel          |
| Pipeline   | `/api/admin/dashboard/sales-pipeline/conversion`                   | GET         | KPI/Gauge       |
| Pipeline   | `/api/admin/dashboard/sales-pipeline/time-in-stage`                | GET         | Bar             |
| Pipeline   | `/api/admin/dashboard/sales-pipeline/expiring-soon`                | GET         | Table           |
| Inventory  | `/api/admin/dashboard/inventory/overview`                          | GET         | KPI             |
| Inventory  | `/api/admin/dashboard/inventory/low-stock`                         | GET         | Table           |
| Inventory  | `/api/admin/dashboard/inventory/days-of-cover`                     | GET         | Bar/Heatmap     |
| Inventory  | `/api/admin/dashboard/inventory/reserve-ratio`                     | GET         | Bar             |
| Inventory  | `/api/admin/dashboard/inventory/transactions-trend`                | GET         | Stacked bar     |
| Inventory  | `/api/admin/dashboard/inventory/top-moving`                        | GET         | Bar/Table       |
| Operations | `/api/admin/dashboard/operations/order-status-breakdown`           | GET         | Donut           |
| Operations | `/api/admin/dashboard/operations/fulfillment-status`               | GET         | Donut           |
| Operations | `/api/admin/dashboard/operations/sla-confirmed-to-shipped`         | GET         | KPI + Histogram |
| Operations | `/api/admin/dashboard/operations/late-orders`                      | GET         | Table           |
| Sales perf | `/api/admin/dashboard/sales-performance/top-sales`                 | GET         | Bar/Table       |
| Sales perf | `/api/admin/dashboard/sales-performance/per-sales-detail`          | GET         | KPI/Gauge       |
| Sales perf | `/api/admin/dashboard/sales-performance/quote-conversion-by-sales` | GET         | Bar             |


---

## 11. Phụ lục — enum trạng thái

### Order

`New`, `AwaitingPayment`, `Confirmed`, `Processing`, `ReadyToShip`, `Shipped`, `Delivered`, `Completed`, `Cancelled`.

### Quote

`Requested`, `Draft`, `PendingApproval`, `Approved`, `Rejected`, `CustomerAccepted`, `CustomerRejected`, `CounterOffer`, `Converted`, `Expired`.

### Invoice

`Draft`, `Unpaid`, `PartiallyPaid`, `Paid`, `Overdue`, `Cancelled`.

### Fulfillment

`Pending`, `Picking`, `Packed`, `Shipped`, `Cancelled`.

### Inventory transaction

`IN`, `OUT`, `ADJUST`, `RESERVE`, `RELEASE`.

### Payment transaction

`Payment`, `Refund`, `AdjustmentIncrease`, `AdjustmentDecrease`.

---

## 12. Lưu ý chung khi tích hợp

- Tất cả số tiền là **VND** (không decimal nhỏ).
- Format **ngày**: ISO 8601 UTC (`...Z`).
- Khi không có dữ liệu, mảng `points`/`items` rỗng (`[]`), KPI số có thể `0`/`null`.
- FE nên hiển thị **placeholder “—”** khi field trả `null` (vd `daysOfCover`).
- `share`/`rate` trả dạng **0–1** (FE × 100 nếu cần `%`).
- Các endpoint **idempotent** (read-only); có thể cache phía FE 30 giây để tránh trùng request lúc rebuild dashboard.

*Tài liệu này độc lập; cập nhật song song khi BE thêm endpoint hoặc đổi schema.*