# Admin — Thanh toán (`/api/admin/payments`)

## Mục đích

Theo dõi **giao dịch thanh toán**, chi tiết, **ghi nhận thanh toán** và **hoàn tiền**. Thường gắn với hóa đơn / khách hàng.

**Thông báo CK từ B2B:** khi kế toán **xác nhận** thông báo chuyển khoản qua API riêng, BE tạo giao dịch thanh toán tương đương ghi nhận thủ công tại đây (method `BankTransfer`). Xem [thong-bao-chuyen-khoan.md](./thong-bao-chuyen-khoan.md).

**Auth:** **StaffAuthenticated**.

**FE:** Swagger `/swagger`, OpenAPI `/swagger/v1/swagger.json`. Field JSON (camelCase).

## API

| Method | Path | Mô tả |
| ------ | ---- | ----- |
| GET | `/api/admin/payments` | Danh sách phân trang + filter |
| GET | `/api/admin/payments/{id}` | Chi tiết |
| POST | `/api/admin/payments` | Ghi nhận thanh toán (thu tiền) |
| POST | `/api/admin/payments/refund` | Ghi nhận hoàn tiền (**ManagerOrAdmin**) |
| GET | `/api/admin/payments/transaction-types` | Các loại giao dịch |

### Query — `GET .../payments`

| Param | Mặc định | Ghi chú |
| ----- | -------- | ------- |
| `page` | 1 | |
| `pageSize` | 20 | |
| `customerId` | — | |
| `invoiceId` | — | |
| `transactionType` | — | |
| `paymentMethod` | — | |
| `fromDate`, `toDate` | — | |
| `search` | — | |

### Body — `POST .../payments` (ghi nhận thanh toán)

| Field | Kiểu | Bắt buộc | Ghi chú |
| ----- | ---- | -------- | ------- |
| `customerId` | number | Có | |
| `invoiceId` | number | Không | Gắn với hóa đơn nếu có |
| `amount` | number | Có | > 0 |
| `paymentMethod` | string | Có | |
| `paymentDate` | string (ISO 8601) | Có | |
| `referenceCode` | string | Không | Mã tham chiếu ngân hàng / chứng từ |
| `note` | string | Không | |

```json
{
  "customerId": 12,
  "invoiceId": 55,
  "amount": 15000000,
  "paymentMethod": "BankTransfer",
  "paymentDate": "2026-04-18T10:30:00.000Z",
  "referenceCode": "FT251234567",
  "note": "Thanh toán đợt 1"
}
```

### Body — `POST .../payments/refund` (hoàn tiền)

Cùng cấu trúc với ghi nhận thanh toán (BE xử lý loại giao dịch Refund).

| Field | Kiểu | Bắt buộc |
| ----- | ---- | -------- |
| `customerId` | number | Có |
| `invoiceId` | number | Không |
| `amount` | number | Có |
| `paymentMethod` | string | Có |
| `paymentDate` | string (ISO 8601) | Có |
| `referenceCode` | string | Không |
| `note` | string | Không |

```json
{
  "customerId": 12,
  "invoiceId": 55,
  "amount": 2000000,
  "paymentMethod": "BankTransfer",
  "paymentDate": "2026-04-18T14:00:00.000Z",
  "referenceCode": "HOAN-001",
  "note": "Hoàn một phần theo thỏa thuận"
}
```

---

## Luồng UI gợi ý

### A) Sổ quỹ / ngân hàng

1. Filter theo ngày + `paymentMethod`.
2. Row → chi tiết chứng từ, link sang hóa đơn / đơn nếu `data` có id.

### B) Ghi nhận thủ công

1. Từ chi tiết hóa đơn: form amount, method, reference → POST payments.
2. Refresh `invoice` và `customer.debt` nếu liên quan.

### C) Hoàn tiền

1. Flow riêng với confirm hai bước → `POST .../refund`.

---

## UX tối ưu

- Format tiền tệ theo locale VN.
- Hiển thị `transaction-types` từ API thay vì hard-code.
- Không cho double-submit khi ghi nhận số tiền lớn.
