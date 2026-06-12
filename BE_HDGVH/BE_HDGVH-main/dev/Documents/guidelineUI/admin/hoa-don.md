# Admin — Hóa đơn (`/api/admin/invoices`)

## Mục đích

Xem và quản lý **hóa đơn**: danh sách lọc theo trạng thái, khách, đơn, ngày, tìm kiếm; chi tiết; các thao tác nghiệp vụ bổ sung (xem Swagger đầy đủ cho PUT/POST nếu controller mở rộng).

**Auth:** **StaffAuthenticated**.

**FE:** Swagger `/swagger`, OpenAPI `/swagger/v1/swagger.json`. Field JSON (camelCase).

## API


| Method | Path                                            | Mô tả                                 |
| ------ | ----------------------------------------------- | ------------------------------------- |
| GET    | `/api/admin/invoices`                           | Danh sách phân trang                  |
| GET    | `/api/admin/invoices/{id}`                      | Chi tiết theo ID                      |
| GET    | `/api/admin/invoices/by-number/{invoiceNumber}` | Chi tiết theo số hóa đơn              |
| POST   | `/api/admin/invoices`                           | Tạo hóa đơn VAT mới                   |
| PUT    | `/api/admin/invoices/{id}`                      | Cập nhật thông tin xuất VAT           |
| POST   | `/api/admin/invoices/{id}/cancel`               | Hủy hóa đơn (body optional: `reason`) |
| GET    | `/api/admin/invoices/statuses`                  | Danh sách trạng thái hóa đơn          |


### Body — `POST .../invoices`


| Field            | Kiểu              | Bắt buộc | Ghi chú |
| ---------------- | ----------------- | -------- | ------- |
| `customerId`     | number            | Có       |         |
| `orderId`        | number            | Không    |         |
| `contractId`     | number            | Không    |         |
| `taxCode`        | string            | Không    | Xuất HĐ |
| `companyName`    | string            | Không    |         |
| `billingAddress` | string            | Không    |         |
| `subTotal`       | number            | Có       |         |
| `taxAmount`      | number            | Không    |         |
| `dueDate`        | string (ISO 8601) | Không    |         |


```json
{
  "customerId": 12,
  "orderId": 900,
  "contractId": 3,
  "taxCode": "0123456789",
  "companyName": "Công ty ABC",
  "billingAddress": "123 Đường X",
  "subTotal": 100000000,
  "taxAmount": 10000000,
  "dueDate": "2026-05-01T00:00:00.000Z"
}
```

### Body — `PUT .../{id}`


| Field            | Kiểu              | Bắt buộc |
| ---------------- | ----------------- | -------- |
| `taxCode`        | string            | Không    |
| `companyName`    | string            | Không    |
| `billingAddress` | string            | Không    |
| `dueDate`        | string (ISO 8601) | Không    |
| `pdfUrl`         | string            | Không    |


```json
{
  "taxCode": "0123456789",
  "companyName": "Công ty ABC — chi nhánh HN",
  "billingAddress": "Địa chỉ mới",
  "dueDate": "2026-06-01T00:00:00.000Z",
  "pdfUrl": "https://.../invoice.pdf"
}
```

### Body — `POST .../{id}/cancel`


| Field    | Kiểu   | Bắt buộc |
| -------- | ------ | -------- |
| `reason` | string | Không    |


```json
{
  "reason": "Sai thông tin xuất VAT"
}
```

### Query — `GET .../invoices`


| Param                          | Mặc định | Ghi chú |
| ------------------------------ | -------- | ------- |
| `page`                         | 1        |         |
| `pageSize`                     | 20       |         |
| `status`                       | —        |         |
| `customerId`                   | —        |         |
| `orderId`                      | —        |         |
| `fromDueDate`, `toDueDate`     | —        |         |
| `fromIssueDate`, `toIssueDate` | —        |         |
| `search`                       | —        |         |


---

## Luồng UI gợi ý

### A) Công nợ & hạn thanh toán

1. Filter `fromDueDate`/`toDueDate` = tuần này → ưu tiên hóa đơn sắp đến hạn.
2. Row click → chi tiết: dòng hàng, đã thanh toán, còn lại.

### B) Liên kết thanh toán

1. Từ chi tiết hóa đơn, nút “Ghi nhận thanh toán” → điều hướng flow `thanh-toan.md` với `invoiceId` prefilled.

### C) Từ đơn hàng

1. Tab “Hóa đơn” trên chi tiết đơn (nếu BE trả nested) hoặc filter `orderId`.

---

## UX tối ưu

- Badge màu theo `status` + countdown due date.
- Export danh sách (client) sau khi user chọn page size phù hợp hoặc gọi nhiều trang (cẩn trọng tải).

