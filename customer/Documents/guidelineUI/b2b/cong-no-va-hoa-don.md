# B2B Store — Công nợ & hóa đơn (`/api/store/b2b/...`)

## Mục đích

Doanh nghiệp xem **tổng quan công nợ** (dư nợ, quá hạn, sắp đến hạn), **danh sách / chi tiết hóa đơn**, và **URL PDF** hóa đơn nếu đã có file.

**Auth:** **CustomerAuthenticated**.

Controller gắn route base `**/api/store/b2b`** (không có segment `invoices` trong `[Route]` của class — path đầy đủ như bảng dưới).

**FE:** Swagger `/swagger`.

## API


| Method | Path                                          | Mô tả                        |
| ------ | --------------------------------------------- | ---------------------------- |
| GET    | `/api/store/b2b/debt/summary`                 | Tổng quan công nợ            |
| GET    | `/api/store/b2b/invoices`                     | Danh sách hóa đơn            |
| GET    | `/api/store/b2b/invoices/{invoiceNumber}`     | Chi tiết theo **số** hóa đơn |
| GET    | `/api/store/b2b/invoices/{invoiceNumber}/pdf` | Lấy URL PDF (nếu có)         |


### Query — `GET .../invoices`


| Param      | Mặc định | Ghi chú |
| ---------- | -------- | ------- |
| `page`     | 1        |         |
| `pageSize` | 20       |         |
| `status`   | —        |         |


---

## Response — `GET .../debt/summary` (`StoreB2BDebtSummaryDto`)


| Field               | Kiểu   | Ghi chú                                      |
| ------------------- | ------ | -------------------------------------------- |
| `totalDebtBalance`  | number | Số dư công nợ hiện tại                       |
| `overdueAmount`     | number | Tổng tiền quá hạn                            |
| `overdueCount`      | number | Số HĐ quá hạn                                |
| `dueSoonAmount`     | number | Sắp đến hạn (VD 7 ngày — theo BE)            |
| `dueSoonCount`      | number |                                              |
| `totalUnpaidAmount` | number | Chưa thanh toán (gồm quá hạn + chưa đến hạn) |
| `totalUnpaidCount`  | number |                                              |
| `paidCount`         | number | HĐ đã thanh toán đủ                          |


---

## Response — danh sách / chi tiết hóa đơn (khái quát)

- **List item** (`StoreB2BInvoiceListItemDto`): `invoiceNumber`, `issueDate`, `dueDate`, `status`, `subTotal`, `taxAmount`, `totalAmount`, `paidAmount`, `remainingAmount`, `orderId`, `orderCode`, `contractId`, `contractNumber`, `daysUntilDue`, …
- **Detail** (`StoreB2BInvoiceDetailDto`): thêm `taxCode`, `companyName`, `billingAddress`, `pdfUrl`, nested `order`, `contract`, `payments[]`, …

Chi tiết đủ field: xem schema Swagger.

---

## Response — `GET .../invoices/{invoiceNumber}/pdf`

- Nếu chưa có PDF: `success: false`, `data: null`, `message` kiểu “Hóa đơn chưa có file PDF”.
- Nếu có: `data.pdfUrl` (trong code BE trả object `{ PdfUrl }` — serialize camelCase `**pdfUrl`**).

---

## Luồng UI gợi ý

### A) Dashboard công nợ

1. Gọi `debt/summary` → card: tổng nợ, quá hạn, sắp đến hạn.
2. CTA “Xem hóa đơn chưa thanh toán” → filter list.

### B) Chi tiết hóa đơn

1. Hiển thị `remainingAmount`, `dueDate`, `daysUntilDue` (âm = quá hạn).
2. Nút “Tải PDF” → gọi endpoint pdf; nếu fail hiển thị `message`.

### C) Liên kết thanh toán

1. Từ chi tiết HĐ → nút “Thông báo chuyển khoản” tới `thanh-toan-va-chuyen-khoan.md` với `invoiceId` prefilled nếu có.

---

## UX tối ưu

- Màu cảnh báo theo `daysUntilDue`.
- Không embed PDF cross-origin nếu URL không cho phép — mở tab mới hoặc download.