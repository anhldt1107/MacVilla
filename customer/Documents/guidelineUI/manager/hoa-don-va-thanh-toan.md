# Manager — Hóa đơn, thanh toán, đối soát CK

## Phạm vi

Manager kiểm tra **hóa đơn**, **ghi nhận thanh toán / hoàn tiền**, **đối soát thông báo CK B2B**. Field đầy đủ: [../admin/hoa-don.md](../admin/hoa-don.md), [../admin/thanh-toan.md](../admin/thanh-toan.md), [../admin/thong-bao-chuyen-khoan.md](../admin/thong-bao-chuyen-khoan.md).

## Hóa đơn — `/api/admin/invoices`

Auth: **StaffAuthenticated**.

| Method | Path |
| ------ | ---- |
| GET | `/api/admin/invoices?status&customerId&orderId&search` |
| GET | `/api/admin/invoices/{id}`, `/by-number/{invoiceNumber}` |
| POST | `/api/admin/invoices` (tạo HĐ) |
| PUT | `/api/admin/invoices/{id}` (sửa Draft/Unpaid) |
| POST | `/api/admin/invoices/{id}/cancel` |
| GET | `/api/admin/invoices/statuses` |

## Thanh toán — `/api/admin/payments`

| Method | Path | Policy |
| ------ | ---- | ------ |
| GET | `/api/admin/payments?...` | Staff |
| GET | `/api/admin/payments/{id}` | Staff |
| POST | `/api/admin/payments` | Staff |
| POST | `/api/admin/payments/refund` | **ManagerOrAdmin** |
| GET | `/api/admin/payments/transaction-types` | Staff |

**Manager** thường là người **duyệt hoàn tiền** — double confirm trên UI trước khi POST.

## Thông báo CK

Auth list/detail: **Staff**; `verify` / `reject`: **ManagerOrAdmin**.

| Method | Path |
| ------ | ---- |
| GET | `/api/admin/transfer-notifications?status=Pending&customerId&fromDate&toDate` |
| GET | `/api/admin/transfer-notifications/{id}` |
| POST | `/api/admin/transfer-notifications/{id}/verify` |
| POST | `/api/admin/transfer-notifications/{id}/reject` |
| GET | `/api/admin/transfer-notifications/statuses` |

### Verify

- Body `{ "processNote": "..." }` (tuỳ chọn).
- BE tạo `PaymentTransaction` method `BankTransfer` (+ cập nhật HĐ, công nợ B2B) và đánh dấu thông báo `Verified`.

### Reject

- Body bắt buộc `{ "reason": "..." }`. Chỉ Pending mới reject được.

## Luồng UI

### A) Hàng chờ đối soát

1. Dashboard card **“CK Pending”** → list mặc định `status=Pending`.
2. Bảng cột: khách, số tiền, mã ref, chứng từ, nút **Xem** → dialog với nút **Xác nhận** / **Từ chối**.

### B) Hoàn tiền

1. Từ chi tiết đơn / HĐ: click **Hoàn tiền** (chỉ Manager thấy).
2. Nhập `amount`, `paymentMethod`, `referenceCode`, `note`, `paymentDate` → `POST /payments/refund`.

### C) Tra cứu

- Filter theo `customerId` + `fromDate`/`toDate` + `transactionType` cho lịch sử tiền tệ của khách.

## UX

- Cảnh báo `amount` vượt `paid total` (BE sẽ 400) trước khi gửi refund.
- Nếu khách đã CK nhưng kế toán chưa có tài khoản thực, Manager có thể **Reject** thông báo với lý do.
