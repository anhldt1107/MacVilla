# Admin — Báo giá (`/api/admin/quotes`)

## Mục đích

Vòng đời **báo giá B2B**: nháp, gửi duyệt, duyệt/từ chối, tiếp nhận, chuyển đơn, **giữ / trả tồn** khi khách chấp nhận.

**Auth:** **StaffAuthenticated** (một số thao tác cần đúng role nghiệp vụ — Manager duyệt, Sales tạo).

**FE:** schema đầy đủ trong Swagger (`/swagger`, `/swagger/v1/swagger.json`). Dưới đây là **tên field JSON** (camelCase) trùng với property C# sau khi serialize — không cần biết tên class DTO.

## API


| Method | Path                                                   | Mô tả                                                                         |
| ------ | ------------------------------------------------------ | ----------------------------------------------------------------------------- |
| GET    | `/api/admin/quotes`                                    | Danh sách phân trang                                                          |
| GET    | `/api/admin/quotes/{id}`                               | Chi tiết                                                                      |
| GET    | `/api/admin/quotes/by-code/{quoteCode}`                | Chi tiết theo mã                                                              |
| POST   | `/api/admin/quotes`                                    | Tạo báo giá (gán `salesId` từ token)                                          |
| PUT    | `/api/admin/quotes/{id}`                               | Cập nhật (**chỉ Draft**)                                                      |
| PUT    | `/api/admin/quotes/{id}/assign`                        | Tiếp nhận / gán Sales (Requested/CounterOffer → Draft); body tùy chọn xem dưới |
| PUT    | `/api/admin/quotes/{id}/return-to-draft`               | Đưa về nháp khi được phép                                                     |
| PUT    | `/api/admin/quotes/{id}/submit`                        | Draft → PendingApproval                                                       |
| PUT    | `/api/admin/quotes/{id}/approve`                       | **ManagerOrAdmin**: PendingApproval → Approved                                |
| PUT    | `/api/admin/quotes/{id}/reject`                        | **ManagerOrAdmin**: → Rejected + lý do                                        |
| POST   | `/api/admin/quotes/{id}/convert-to-order`              | CustomerAccepted → Converted; optional `contractId`                           |
| POST   | `/api/admin/quotes/{id}/reserve-inventory`             | Giữ tồn (CustomerAccepted), mỗi dòng RESERVE                                  |
| POST   | `/api/admin/quotes/{id}/release-inventory-reservation` | Trả giữ tồn (RELEASE)                                                         |
| GET    | `/api/admin/quotes/statuses`                           | Danh sách trạng thái báo giá                                                  |


### Body — `PUT .../quotes/{id}/assign`

JSON tùy chọn (có thể gửi `{}`):

| Field     | Kiểu | Ghi chú |
| --------- | ---- | ------- |
| `salesId` | int, optional | **Bỏ qua / null:** gán cho user đang gọi (Sales tiếp nhận). **Giá trị khác user hiện tại:** chỉ Manager hoặc admin (Sales → 403). User phải tồn tại (404). |


### Query — `GET .../quotes`


| Param                | Mặc định | Ghi chú |
| -------------------- | -------- | ------- |
| `page`               | 1        |         |
| `pageSize`           | 20       |         |
| `status`             | —        |         |
| `customerId`         | —        |         |
| `salesId`            | —        |         |
| `fromDate`, `toDate` | —        |         |
| `search`             | —        |         |


### Body — `POST .../quotes` (tạo báo giá)


| Field           | Kiểu              | Bắt buộc | Ghi chú                                                                  |
| --------------- | ----------------- | -------- | ------------------------------------------------------------------------ |
| `customerId`    | number            | Có       | Khách đã có trong hệ thống                                               |
| `lines`         | array             | Có       | Có thể rỗng `[]` tùy rule BE; mỗi phần tử xem bảng dòng                  |
| `discountType`  | string            | Không    | Theo nghiệp vụ (VD Percent, Fixed, … — đối chiếu Swagger / response mẫu) |
| `discountValue` | number            | Không    | Giá trị giảm tương ứng `discountType`                                    |
| `validUntil`    | string (ISO 8601) | Không    | Hạn hiệu lực báo giá                                                     |
| `notes`         | string            | Không    | Ghi chú nội bộ / cho khách                                               |


**Phần tử `lines[]`:**


| Field       | Kiểu   | Bắt buộc | Ghi chú                                               |
| ----------- | ------ | -------- | ----------------------------------------------------- |
| `variantId` | number | Có       | Biến thể (SKU)                                        |
| `quantity`  | number | Có       | Số lượng                                              |
| `unitPrice` | number | Không    | Nếu bỏ, BE thường lấy giá bán lẻ hiện tại của variant |


```json
{
  "customerId": 12,
  "lines": [
    { "variantId": 101, "quantity": 2, "unitPrice": 15000000 },
    { "variantId": 102, "quantity": 1 }
  ],
  "discountType": "Percent",
  "discountValue": 5,
  "validUntil": "2026-05-01T00:00:00.000Z",
  "notes": "Báo giá theo đơn hàng tháng 4"
}
```

### Body — `PUT .../quotes/{id}` (cập nhật, chỉ khi Draft)


| Field           | Kiểu              | Bắt buộc | Ghi chú                                                                                 |
| --------------- | ----------------- | -------- | --------------------------------------------------------------------------------------- |
| `lines`         | array             | Có       | Mỗi dòng có thể có `id` (dòng đã tồn tại) hoặc chỉ `variantId` cho dòng mới — xem ví dụ |
| `discountType`  | string            | Không    |                                                                                         |
| `discountValue` | number            | Không    |                                                                                         |
| `validUntil`    | string (ISO 8601) | Không    |                                                                                         |
| `notes`         | string            | Không    |                                                                                         |


**Phần tử `lines[]`:**


| Field       | Kiểu   | Bắt buộc | Ghi chú                                  |
| ----------- | ------ | -------- | ---------------------------------------- |
| `id`        | number | Không    | Có = cập nhật dòng cũ; không = thêm dòng |
| `variantId` | number | Có       |                                          |
| `quantity`  | number | Có       |                                          |
| `unitPrice` | number | Không    |                                          |


```json
{
  "lines": [
    { "id": 55, "variantId": 101, "quantity": 3, "unitPrice": 14800000 },
    { "variantId": 103, "quantity": 1 }
  ],
  "discountType": null,
  "discountValue": null,
  "validUntil": "2026-05-15T23:59:59.000Z",
  "notes": "Đã chỉnh số lượng theo khách"
}
```

### Body — `PUT .../{id}/reject`


| Field          | Kiểu   | Bắt buộc | Ghi chú                                    |
| -------------- | ------ | -------- | ------------------------------------------ |
| `rejectReason` | string | Không    | Nên bắt buộc phía UI để Manager nhập lý do |


```json
{
  "rejectReason": "Giá vượt ngưỡng duyệt tháng 4"
}
```

### Body — `POST .../{id}/convert-to-order`


| Field               | Kiểu   | Bắt buộc | Ghi chú                                            |
| ------------------- | ------ | -------- | -------------------------------------------------- |
| `shippingAddressId` | number | Có       | Địa chỉ giao của khách                             |
| `paymentMethod`     | string | Có       | Theo domain (Swagger / enum BE)                    |
| `note`              | string | Không    | Ghi chú đơn                                        |
| `contractId`        | number | Không    | Hợp đồng đã Confirmed/Active, cùng báo giá & khách |


```json
{
  "shippingAddressId": 8,
  "paymentMethod": "BankTransfer",
  "note": "Giao trong giờ hành chính",
  "contractId": 3
}
```

---

## Luồng UI gợi ý

### A) Sales — nháp

1. Tạo mới → chỉnh dòng → **Submit** khi sẵn sàng.
2. Nếu báo giá từ khách (Requested): **Assign** để nhận về Draft.

### B) Manager — duyệt

1. Hàng đợi `PendingApproval` → Approve hoặc Reject (bắt buộc lý do).

### C) Khách chấp nhận → kho

1. Trạng thái **CustomerAccepted**: nút **Giữ tồn** → gọi `reserve-inventory`; nút **Trả giữ** khi hủy deal.
2. **Chuyển đơn** → `convert-to-order` (có/không `contractId`).

---

## UX tối ưu

- Wizard trạng thái (read-only cho user không đủ quyền).
- Hiển thị rõ ai là Sales / Manager nếu response `data` có các field tương ứng (vd. `sales`, `manager`).
- Sau reserve/release: toast + refresh tồn (tra cứu SKU).

