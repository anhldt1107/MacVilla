# Customer — Hóa đơn (`/api/store/me/invoices`)

Auth: **CustomerAuthenticated**. Service share với B2B ([../b2b/cong-no-va-hoa-don.md](../b2b/cong-no-va-hoa-don.md)), nhưng B2C thường không có `contract`, `companyName`, `taxCode` — các field này có thể `null`.

## API

| Method | Path |
| ------ | ---- |
| GET | `/api/store/me/invoices?page&pageSize&status` |
| GET | `/api/store/me/invoices/{invoiceNumber}` |
| GET | `/api/store/me/invoices/{invoiceNumber}/pdf` |

### Query

| Param | Mặc định | Ghi chú |
| ----- | -------- | ------- |
| `page` | 1 | |
| `pageSize` | 20 | Clamp 1..50 |
| `status` | — | `Draft / Unpaid / PartiallyPaid / Paid / Overdue / Cancelled` |

### Response list — `PagedResultDto<StoreB2BInvoiceListItemDto>`

`items[]`:

| Field | Kiểu | Ghi chú |
| ----- | ---- | ------- |
| `id` | number | |
| `invoiceNumber` | string | |
| `issueDate` | ISO 8601 | |
| `dueDate` | ISO 8601 \| null | |
| `status` | string | Xem trên |
| `subTotal` | number \| null | Tiền trước thuế |
| `taxAmount` | number \| null | Tiền thuế VAT |
| `totalAmount` | number \| null | Tổng tiền |
| `paidAmount` | number | Số đã thanh toán |
| `remainingAmount` | number | Còn phải trả |
| `orderId`, `orderCode` | number\|null / string\|null | Đơn gốc |
| `contractId`, `contractNumber` | number\|null / string\|null | (B2C thường `null`) |
| `daysUntilDue` | number \| null | Âm nếu quá hạn |

### Response detail — `StoreB2BInvoiceDetailDto`

Bao gồm tất cả field list item (trừ `orderId/orderCode/contractId/contractNumber` — xuất hiện trong object lồng) cộng thêm:

| Field | Kiểu | Ghi chú |
| ----- | ---- | ------- |
| `taxCode` | string \| null | MST trên hóa đơn |
| `companyName` | string \| null | Tên công ty (B2C thường null) |
| `billingAddress` | string \| null | Địa chỉ xuất HĐ |
| `pdfUrl` | string \| null | URL PDF nếu đã phát hành |
| `order` | `StoreB2BInvoiceOrderDto` \| null | |
| `contract` | `StoreB2BInvoiceContractDto` \| null | |
| `payments[]` | `StoreB2BInvoicePaymentDto[]` | Lịch sử giao dịch thanh toán áp vào HĐ |
| `daysUntilDue` | number \| null | |

`order` (`StoreB2BInvoiceOrderDto`):

| Field | Kiểu |
| ----- | ---- |
| `id`, `orderCode` | number / string |
| `createdAt` | ISO 8601 |
| `orderStatus`, `paymentStatus` | string |
| `payableTotal` | number |

`contract` (`StoreB2BInvoiceContractDto`):

| Field | Kiểu |
| ----- | ---- |
| `id`, `contractNumber` | number / string |
| `status` | string |
| `validFrom`, `validTo` | ISO 8601 \| null |

`payments[]` (`StoreB2BInvoicePaymentDto`):

| Field | Kiểu |
| ----- | ---- |
| `id` | number |
| `amount` | number |
| `paymentMethod` | string \| null |
| `transactionType` | string \| null |
| `paymentDate` | ISO 8601 |
| `referenceCode`, `note` | string \| null |

### Response PDF — `GET /{invoiceNumber}/pdf`

```json
{ "pdfUrl": "https://res.cloudinary.com/.../invoice.pdf" }
```

Nếu chưa có file → envelope `success: false`, `data: null`, `message: "Hóa đơn chưa có file PDF"`.

## Luồng UI

1. Tab **Hóa đơn** trong account: list + filter `status`.
2. Chi tiết → hiển thị `order` + `payments[]`; badge `remainingAmount`.
3. Nút **Tải PDF** → `GET /{invoiceNumber}/pdf`; nếu có `pdfUrl` → mở tab mới / download.

## UX

- Chip màu theo `status` (Overdue đỏ).
- Format tiền VN; hiển thị `remainingAmount` rõ ràng.
- Link ngược: `order.orderCode` → [don-hang.md](./don-hang.md); mỗi `payment.id` → [thanh-toan-lich-su.md](./thanh-toan-lich-su.md).
