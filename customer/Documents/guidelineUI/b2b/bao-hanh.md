# B2B Store — Bảo hành (`/api/store/b2b/warranty-tickets`)

## Mục đích

Doanh nghiệp xem **phiếu bảo hành** của mình (danh sách, chi tiết theo mã) và **tạo yêu cầu bảo hành** (claim) — có thể gắn theo phiếu BH sẵn có hoặc theo **đơn hàng** nếu chưa có phiếu.

**Auth:** **CustomerAuthenticated**.

**FE:** Swagger `/swagger`. Field JSON (camelCase).

## API


| Method | Path                                             | Mô tả                    |
| ------ | ------------------------------------------------ | ------------------------ |
| GET    | `/api/store/b2b/warranty-tickets`                | Danh sách phân trang     |
| GET    | `/api/store/b2b/warranty-tickets/{ticketNumber}` | Chi tiết theo mã phiếu   |
| POST   | `/api/store/b2b/warranty-tickets`                | Tạo yêu cầu bảo hành mới |


### Query — `GET .../warranty-tickets`


| Param      | Mặc định | Ghi chú |
| ---------- | -------- | ------- |
| `page`     | 1        |         |
| `pageSize` | 20       |         |
| `status`   | —        |         |


---

## Body — `POST .../warranty-tickets`

`StoreB2BWarrantyClaimCreateDto`:


| Field               | Kiểu   | Bắt buộc      | Ghi chú                                                                                                                   |
| ------------------- | ------ | ------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `warrantyTicketId`  | number | Một trong hai | Phải có `**warrantyTicketId`** *hoặc* `**orderId`** (BE báo lỗi nếu cả hai đều thiếu)                                     |
| `orderId`           | number | Một trong hai | Nếu gửi `orderId`: BE tìm phiếu BH theo đơn; nếu chưa có thì **tạo phiếu mới** (mặc định hiệu lực 12 tháng) rồi gắn claim |
| `variantId`         | number | Có            | Sản phẩm cần BH                                                                                                           |
| `defectDescription` | string | Có            | Mô tả lỗi                                                                                                                 |
| `imagesUrl`         | string | Không         | Nhiều URL cách nhau dấu **phẩy**                                                                                          |


```json
{
  "orderId": 900,
  "variantId": 101,
  "defectDescription": "Thiết bị không lên nguồn sau 1 tuần sử dụng",
  "imagesUrl": "https://cdn.example.com/a.jpg,https://cdn.example.com/b.jpg"
}
```

Hoặc khi đã biết ID phiếu:

```json
{
  "warrantyTicketId": 15,
  "variantId": 101,
  "defectDescription": "Lỗi màn hình đốm sáng",
  "imagesUrl": null
}
```

### Response — `data` (`StoreB2BWarrantyClaimResponseDto`)


| Field               | Kiểu              |
| ------------------- | ----------------- |
| `id`                | number            |
| `warrantyTicketId`  | number            |
| `ticketNumber`      | string            |
| `variantId`         | number            |
| `sku`               | string            |
| `variantName`       | string            |
| `defectDescription` | string            |
| `status`            | string            |
| `createdAt`         | string (ISO 8601) |
| `message`           | string            |


Envelope có thể dùng `message` riêng; UI có thể ưu tiên `data.message` cho toast.

---

## Response — chi tiết phiếu (khái quát)

`StoreB2BWarrantyTicketDetailDto`: `ticketNumber`, `issueDate`, `validUntil`, `status`, `isValid`, `daysRemaining`, `order`, `contract`, `claims[]` (mỗi claim: `defectDescription`, `imagesUrl`, `status`, …).

---

## Luồng UI gợi ý

### A) Danh sách phiếu

1. Filter `status`; badge `pendingClaimCount` từ list item nếu cần.

### B) Tạo yêu cầu từ đơn

1. Từ chi tiết đơn (`don-hang.md`) → chọn dòng hàng → prefill `orderId` + `variantId`.
2. Upload ảnh → ghép `imagesUrl` hoặc gửi một URL.

### C) Theo dõi claim

1. Chi tiết phiếu → bảng `claims` với trạng thái.

---

## UX tối ưu

- Textarea `defectDescription` với đếm ký tự; cảnh báo nếu thiếu ảnh minh chứng (nghiệp vụ).
- Hiển thị `isValid` / `daysRemaining` nổi bật trên chi tiết.

