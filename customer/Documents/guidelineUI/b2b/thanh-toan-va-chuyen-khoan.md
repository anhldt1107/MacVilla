# B2B Store — Thanh toán & thông báo CK (`/api/store/b2b/payments`)

## Mục đích

Doanh nghiệp xem **lịch sử thanh toán** (phân trang, lọc), **chi tiết một giao dịch**, và **gửi thông báo đã chuyển khoản** (ref, số tiền, chứng từ, gắn hóa đơn nếu có).

**Auth:** **CustomerAuthenticated**.

**FE:** Swagger `/swagger`. Field JSON (camelCase).

## API


| Method | Path                                      | Mô tả                           |
| ------ | ----------------------------------------- | ------------------------------- |
| GET    | `/api/store/b2b/payments`                 | Lịch sử thanh toán (phân trang) |
| GET    | `/api/store/b2b/payments/{id}`            | Chi tiết theo **ID** giao dịch  |
| POST   | `/api/store/b2b/payments/notify-transfer` | Thông báo đã CK                 |


### Query — `GET .../payments`


| Param                | Mặc định | Ghi chú          |
| -------------------- | -------- | ---------------- |
| `page`               | 1        |                  |
| `pageSize`           | 20       |                  |
| `invoiceId`          | —        | Lọc theo hóa đơn |
| `transactionType`    | —        |                  |
| `fromDate`, `toDate` | —        |                  |


---

## Body — `POST .../payments/notify-transfer`

`StoreB2BNotifyTransferRequestDto`:


| Field           | Kiểu   | Bắt buộc | Ghi chú                 |
| --------------- | ------ | -------- | ----------------------- |
| `referenceCode` | string | Có       | Mã tham chiếu ngân hàng |
| `amount`        | number | Có       | Số tiền CK              |
| `note`          | string | Không    | Nội dung CK / ghi chú   |
| `attachmentUrl` | string | Không    | Ảnh biên lai, chứng từ  |
| `invoiceId`     | number | Không    | Gắn thanh toán vào HĐ   |


```json
{
  "referenceCode": "FT251099988877",
  "amount": 25000000,
  "note": "Thanh toán HĐ INV-2026-001",
  "attachmentUrl": "https://res.cloudinary.com/.../bienlai.jpg",
  "invoiceId": 55
}
```

### Response — `data` (`StoreB2BNotifyTransferResponseDto`)


| Field           | Kiểu              |
| --------------- | ----------------- |
| `id`            | number            |
| `amount`        | number            |
| `referenceCode` | string            |
| `note`          | string            |
| `createdAt`     | string (ISO 8601) |
| `status`        | string            |
| `message`       | string            |


Envelope `ResponseDto` cũng có `message` — có thể trùng nội dung hướng dẫn; ưu tiên hiển thị thông điệp thân thiện cho user.

**Phía admin (đối soát):** sau khi khách gửi thông báo, kế toán dùng API `GET`/`POST` tại `/api/admin/transfer-notifications` — mô tả tích hợp UI: [../admin/thong-bao-chuyen-khoan.md](../admin/thong-bao-chuyen-khoan.md).

---

## Luồng UI gợi ý

### A) Sau khi CK tại ngân hàng

1. Form: ref + amount + upload chứng từ (upload dùng API khác nếu có — thường lấy URL) → `notify-transfer`.
2. Hiển thị trạng thái `status` / `message` từ `data`.

### B) Lịch sử

1. Bảng có link tới chi tiết `GET /payments/{id}`.
2. Filter theo khoảng ngày + `invoiceId`.

---

## UX tối ưu

- Validate `amount` > 0 phía client.
- Mask một phần `referenceCode` nếu hiển thị công khai (tùy policy).
- Tránh double-submit POST notify.

