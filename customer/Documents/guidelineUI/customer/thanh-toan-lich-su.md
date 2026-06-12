# Customer — Lịch sử thanh toán (`/api/store/me/payments`)

Auth: **CustomerAuthenticated**. Khác với `/api/store/payments/payos/`* (tạo link PayOS) — route này **chỉ tra cứu** `PaymentTransaction`. Service share với B2B.

## API


| Method | Path                                                                             |
| ------ | -------------------------------------------------------------------------------- |
| GET    | `/api/store/me/payments?page&pageSize&invoiceId&transactionType&fromDate&toDate` |
| GET    | `/api/store/me/payments/{id}`                                                    |


### Query


| Param                | Mặc định | Ghi chú                                                            |
| -------------------- | -------- | ------------------------------------------------------------------ |
| `page`               | 1        |                                                                    |
| `pageSize`           | 20       |                                                                    |
| `invoiceId`          | —        | Lọc theo hóa đơn                                                   |
| `transactionType`    | —        | `Payment` / `Refund` / `AdjustmentIncrease` / `AdjustmentDecrease` |
| `fromDate`, `toDate` | —        | ISO 8601                                                           |


### Response list — `PagedResultDto<StoreB2BPaymentListItemDto>`

`items[]`:


| Field             | Kiểu     | Ghi chú |
| ----------------- | -------- | ------- |
| `id`              | number   |         |
| `amount`          | number   |         |
| `paymentMethod`   | string   | null    |
| `transactionType` | string   | null    |
| `paymentDate`     | ISO 8601 |         |
| `referenceCode`   | string   | null    |
| `note`            | string   | null    |
| `invoiceId`       | number   | null    |
| `invoiceNumber`   | string   | null    |


### Response detail — `StoreB2BPaymentDetailDto`

Bao gồm toàn bộ field của list item (trừ `invoiceId`, `invoiceNumber`) + object `invoice`:


| Field                              | Kiểu                        | Ghi chú |
| ---------------------------------- | --------------------------- | ------- |
| `id`, `amount`                     | number                      |         |
| `paymentMethod`, `transactionType` | string                      | null    |
| `paymentDate`                      | ISO 8601                    |         |
| `referenceCode`, `note`            | string                      | null    |
| `invoice`                          | `StoreB2BPaymentInvoiceDto` | null    |


`invoice` (`StoreB2BPaymentInvoiceDto`):


| Field           | Kiểu     |
| --------------- | -------- |
| `id`            | number   |
| `invoiceNumber` | string   |
| `issueDate`     | ISO 8601 |
| `dueDate`       | ISO 8601 |
| `status`        | string   |
| `totalAmount`   | number   |


## Luồng UI

1. Tab **Thanh toán** / **Ví của tôi** → list theo `fromDate` / `toDate`.
2. Click row → chi tiết giao dịch; nếu `invoice` ≠ null → link sang [hoa-don.md](./hoa-don.md).

## UX

- Icon phân biệt "Thu" vs "Hoàn": dựa trên `transactionType` (`Payment` / `AdjustmentIncrease` → thu; `Refund` / `AdjustmentDecrease` → chi).
- Format tiền VN; tổng theo khoảng thời gian (client tự tính nếu muốn).