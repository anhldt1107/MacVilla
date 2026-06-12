# Admin — Thông báo chuyển khoản B2B (`/api/admin/transfer-notifications`)

## Mục đích

Kế toán / admin **đối soát** các thông báo “đã chuyển khoản” do khách B2B gửi qua store (`POST /api/store/b2b/payments/notify-transfer`). Từ đây có thể **xem danh sách**, **chi tiết**, **xác nhận** (ghi nhận thanh toán + trạng thái Verified) hoặc **từ chối** (Rejected, không tạo giao dịch thanh toán).

**Auth:** **StaffAuthenticated** cho list/detail; **ManagerOrAdmin** cho `verify` / `reject`. JWT staff — không dùng token khách.

**FE:** Swagger `/swagger`, OpenAPI `/swagger/v1/swagger.json`. Field JSON (camelCase).

**Luồng tổng thể:** khách B2B gửi thông báo CK → bản ghi `Pending` → admin verify/reject → nếu verify: tạo `PaymentTransaction` (method `BankTransfer`), cập nhật hóa đơn (nếu có) và **công nợ B2B** tương tự ghi nhận thanh toán thủ công ([thanh-toan.md](./thanh-toan.md)). Chi tiết phía store: [../b2b/thanh-toan-va-chuyen-khoan.md](../b2b/thanh-toan-va-chuyen-khoan.md).

---

## API


| Method | Path                                            | Mô tả                         |
| ------ | ----------------------------------------------- | ----------------------------- |
| GET    | `/api/admin/transfer-notifications`             | Danh sách phân trang + filter |
| GET    | `/api/admin/transfer-notifications/statuses`    | Các giá trị `status` hợp lệ   |
| GET    | `/api/admin/transfer-notifications/{id}`        | Chi tiết (có `processNote`)   |
| POST   | `/api/admin/transfer-notifications/{id}/verify` | Xác nhận đối soát (**ManagerOrAdmin**) |
| POST   | `/api/admin/transfer-notifications/{id}/reject` | Từ chối (**ManagerOrAdmin**) |


---

### Query — `GET .../transfer-notifications`


| Param                | Mặc định | Ghi chú                                                                                            |
| -------------------- | -------- | -------------------------------------------------------------------------------------------------- |
| `page`               | 1        |                                                                                                    |
| `pageSize`           | 20       | BE clamp tối đa 100                                                                                |
| `status`             | —        | `Pending`, `Verified`, `Rejected` (so khớp không phân biệt hoa thường)                             |
| `customerId`         | —        |                                                                                                    |
| `fromDate`, `toDate` | —        | Lọc theo `createdAt` của thông báo; `toDate` là cận trên theo ngày (exclusive end-of-day+1 như BE) |


### Response list — `data` (`PagedResultDto`)

Các phần tử `items[]` có dạng (list + detail dùng chung phần lớn field; detail thêm `processNote`):


| Field             | Kiểu                     | Ghi chú                                                      |
| ----------------- | ------------------------ | ------------------------------------------------------------ |
| `id`              | number                   |                                                              |
| `customerId`      | number                   |                                                              |
| `customerName`    | string                   |                                                              |
| `companyName`     | string | null            |                                                              |
| `invoiceId`       | number | null            |                                                              |
| `invoiceNumber`   | string | null            |                                                              |
| `referenceCode`   | string                   | Mã tham chiếu ngân hàng                                      |
| `amount`          | number                   |                                                              |
| `note`            | string | null            | Nội dung khách gửi kèm                                       |
| `attachmentUrl`   | string | null            | Chứng từ / biên lai                                          |
| `status`          | string                   | `Pending` / `Verified` / `Rejected`                          |
| `createdAt`       | string (ISO 8601)        |                                                              |
| `processedBy`     | number | null            | User id staff xử lý                                          |
| `processedByName` | string | null            |                                                              |
| `processedAt`     | string (ISO 8601) | null |                                                              |
| `processNote`     | string | null            | **Chỉ chi tiết** GET `{id}`; ghi chú kế toán / lý do từ chối |


### `GET .../statuses`

`data.statuses`: mảng string cố định `["Pending","Verified","Rejected"]` — dùng cho dropdown filter.

---

### Body — `POST .../transfer-notifications/{id}/verify`

Tất cả field **không bắt buộc** (có thể gửi `{}` hoặc body rỗng nếu client cho phép).


| Field         | Kiểu   | Bắt buộc | Ghi chú                                                                       |
| ------------- | ------ | -------- | ----------------------------------------------------------------------------- |
| `processNote` | string | Không    | Tối đa 2000 ký tự; lưu vào thông báo và ghép vào ghi chú giao dịch thanh toán |


```json
{
  "processNote": "Đã khớp sao kê ngày 18/04/2026"
}
```

**Điều kiện nghiệp vụ (lỗi thường gặp):**

- Chỉ trạng thái `**Pending`** mới verify được.
- `amount` trên thông báo phải > 0.
- Nếu có `invoiceId`: hóa đơn phải tồn tại, thuộc đúng `customerId` của thông báo, và trạng thái hóa đơn cho phép nhận thanh toán (cùng quy tắc với [thanh-toan.md](./thanh-toan.md)).
- JWT phải có `sub` hoặc `NameIdentifier` parse được sang **số** (user id); nếu không → lỗi xác thực người xử lý.

Sau verify: có thêm một dòng trong **thanh toán admin** (`GET /api/admin/payments`) với `paymentMethod` = `BankTransfer`.

---

### Body — `POST .../transfer-notifications/{id}/reject`


| Field    | Kiểu   | Bắt buộc | Ghi chú                                  |
| -------- | ------ | -------- | ---------------------------------------- |
| `reason` | string | Có       | Tối đa 2000 ký tự; lưu vào `processNote` |


```json
{
  "reason": "Không tìm thấy giao dịch trùng mã tham chiếu trên sao kê"
}
```

Validation lỗi có thể trả **400** với `data` chứa `ModelState` (pattern hiện tại của controller).

Chỉ `**Pending`** mới reject được.

---

## Luồng UI gợi ý

### A) Hàng đợi đối soát

1. Mặc định filter `status=Pending` (hoặc tab “Chờ xử lý”).
2. Cột: khách, số tiền, mã ref, HĐ (nếu có), ngày gửi, xem chứng từ (`attachmentUrl`).
3. Row → chi tiết → nút **Xác nhận** / **Từ chối** (confirm dialog, nhập `processNote` / `reason`).

### B) Sau khi verify

1. Refresh chi tiết thông báo; có thể deep-link sang [hoa-don.md](./hoa-don.md) / thanh toán nếu có `invoiceId`.
2. Công nợ khách B2B đã được BE cập nhật — refresh màn hình khách hàng nếu đang mở.

### C) Báo cáo / lịch sử

1. Filter `status=Verified` hoặc `Rejected`, khoảng `fromDate`–`toDate`.
2. Export (nếu có) theo `items` từ API.

---

## UX tối ưu

- Hiển thị badge màu theo `status`; dùng `GET .../statuses` thay vì hard-code.
- Không double-submit verify/reject.
- Copy nhanh `referenceCode` để đối chiếu ngân hàng.
- Với verify: cảnh báo rõ “Thao tác này sẽ ghi nhận thanh toán và không tự hoàn tác qua API này” (hoàn tiền nếu sai là luồng khác — [thanh-toan.md](./thanh-toan.md)).

