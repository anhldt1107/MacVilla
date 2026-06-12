# Sales — Hóa đơn, thanh toán & công nợ (read-only)

## Mục đích

Sales **tra cứu** hóa đơn, lịch sử thanh toán, và thông báo chuyển khoản của khách mình chăm sóc để tư vấn và chốt đơn. **Không** trực tiếp ghi nhận thanh toán, hoàn tiền hay verify/reject thông báo CK — những thao tác đó thuộc **kế toán / Manager** ([../admin/thanh-toan.md](../admin/thanh-toan.md), [../admin/thong-bao-chuyen-khoan.md](../admin/thong-bao-chuyen-khoan.md)).

**Auth:** **StaffAuthenticated**.

## API Sales sử dụng (chỉ GET)

### Hóa đơn — `/api/admin/invoices`

| Method | Path | Sales dùng khi |
| ------ | ---- | -------------- |
| GET | `/api/admin/invoices?customerId&status&orderId&search` | Tra cứu HĐ của khách / theo đơn |
| GET | `/api/admin/invoices/{id}`, `/by-number/{invoiceNumber}` | Chi tiết + `pdfUrl` nếu có |

Field / trạng thái: [../admin/hoa-don.md](../admin/hoa-don.md).

### Thanh toán — `/api/admin/payments`

| Method | Path | Sales dùng khi |
| ------ | ---- | -------------- |
| GET | `/api/admin/payments?customerId&invoiceId&transactionType&paymentMethod&fromDate&toDate&search` | Xem dòng tiền của khách / đơn |
| GET | `/api/admin/payments/{id}` | Chi tiết giao dịch |
| GET | `/api/admin/payments/transaction-types` | Danh sách loại giao dịch |

**Không dùng cho Sales:** `POST /api/admin/payments`, `POST /api/admin/payments/refund` (kế toán).

### Thông báo chuyển khoản — `/api/admin/transfer-notifications`

| Method | Path | Sales dùng khi |
| ------ | ---- | -------------- |
| GET | `/api/admin/transfer-notifications?status=Pending&customerId=<..>` | Theo dõi khách đã gửi báo CK chưa |
| GET | `/api/admin/transfer-notifications/{id}` | Chi tiết (chứng từ, `processNote`) |
| GET | `/api/admin/transfer-notifications/statuses` | |

**Không dùng cho Sales:** `POST /{id}/verify`, `POST /{id}/reject` (kế toán).

## Luồng UI gợi ý

### A) Tư vấn khách về tình trạng thanh toán

1. Từ **chi tiết đơn** ([don-hang.md](./don-hang.md)) → tab **Thanh toán**: gọi `GET /payments?invoiceId=<..>` / `GET /invoices/{id}`.
2. Hiển thị **đã trả / còn lại**, `dueDate`, badge quá hạn.

### B) Theo dõi khách CK nhưng kế toán chưa verify

1. Dashboard có card **“Thông báo CK Pending của khách tôi”** → `GET /transfer-notifications?status=Pending&customerId=<..>`.
2. Nếu chờ quá lâu → nhắc kế toán qua kênh nội bộ (không gọi verify).

### C) Công nợ

- Xem `GET /api/admin/customers/{id}/debt` ([khach-hang.md](./khach-hang.md)) trước khi chốt báo giá lớn.

## UX

- Chuyển tab nhanh giữa **Đơn → Hóa đơn → Thanh toán** trong cùng profile khách.
- Nút **“Nhắc kế toán”** chỉ là UI nội bộ (VD tạo note), **không** gọi API verify.
- Format tiền tệ VN; hiển thị `overdueDays` nếu có.
