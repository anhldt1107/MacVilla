# B2B Store — Đổi / trả hàng (`/api/store/b2b/return-exchange-requests`)

## Mục đích

Doanh nghiệp xem **phiếu đổi / trả** của mình và **tạo yêu cầu mới** (trả hàng hoặc đổi hàng) kèm danh sách biến thể & số lượng.

**Auth:** **CustomerAuthenticated**.

**FE:** Swagger `/swagger`. Field JSON (camelCase).

## API


| Method | Path                                                     | Mô tả                  |
| ------ | -------------------------------------------------------- | ---------------------- |
| GET    | `/api/store/b2b/return-exchange-requests`                | Danh sách phân trang   |
| GET    | `/api/store/b2b/return-exchange-requests/{ticketNumber}` | Chi tiết theo mã phiếu |
| POST   | `/api/store/b2b/return-exchange-requests`                | Tạo yêu cầu            |


### Query — `GET .../return-exchange-requests`


| Param      | Mặc định | Ghi chú               |
| ---------- | -------- | --------------------- |
| `page`     | 1        |                       |
| `pageSize` | 20       |                       |
| `status`   | —        |                       |
| `type`     | —        | `Return` / `Exchange` |


---

## Body — `POST .../return-exchange-requests`

`StoreB2BReturnCreateDto`:


| Field          | Kiểu   | Bắt buộc | Ghi chú                                                                   |
| -------------- | ------ | -------- | ------------------------------------------------------------------------- |
| `orderId`      | number | Có       | Đơn cần đổi/trả                                                           |
| `type`         | string | Có       | `Return` hoặc `Exchange` (DTO mặc định C# là `Return` — nên gửi explicit) |
| `reason`       | string | Có       | Lý do                                                                     |
| `customerNote` | string | Không    |                                                                           |
| `items`        | array  | Có       | Ít nhất 1 dòng                                                            |


`**items[]` (`StoreB2BReturnItemCreateDto`):**


| Field                | Kiểu   | Bắt buộc | Ghi chú                                  |
| -------------------- | ------ | -------- | ---------------------------------------- |
| `variantIdReturned`  | number | Có       | Hàng trả                                 |
| `variantIdExchanged` | number | Không    | Bắt buộc nghiệp vụ khi `type` = Exchange |
| `quantity`           | number | Có       |                                          |


```json
{
  "orderId": 900,
  "type": "Return",
  "reason": "Giao nhầm màu theo đơn",
  "customerNote": "Đề nghị hoàn tiền trong 7 ngày",
  "items": [
    {
      "variantIdReturned": 101,
      "variantIdExchanged": null,
      "quantity": 1
    }
  ]
}
```

Ví dụ **đổi hàng**:

```json
{
  "orderId": 900,
  "type": "Exchange",
  "reason": "Cần đổi sang SKU cấu hình cao hơn",
  "customerNote": null,
  "items": [
    {
      "variantIdReturned": 101,
      "variantIdExchanged": 105,
      "quantity": 1
    }
  ]
}
```

### Response — `data` (`StoreB2BReturnCreateResponseDto`)


| Field          | Kiểu              |
| -------------- | ----------------- |
| `id`           | number            |
| `ticketNumber` | string            |
| `type`         | string            |
| `status`       | string            |
| `createdAt`    | string (ISO 8601) |
| `itemCount`    | number            |
| `message`      | string            |


---

## Luồng UI gợi ý

### A) Chọn đơn & dòng hàng

1. Chỉ cho chọn đơn **đủ điều kiện** (theo BE); map `orderLine.variantId` → `variantIdReturned`.

### B) Exchange

1. Khi `type=Exchange`, bắt buộc chọn `variantIdExchanged` trên UI cho từng dòng.

### C) Theo dõi

1. Sau POST, redirect chi tiết theo `ticketNumber` hoặc `id`.

---

## UX tối ưu

- So sánh giá / chênh lệch Exchange (nếu BE trả thêm — xem chi tiết GET).
- Step wizard: Chọn đơn → chọn hàng → lý do → xác nhận.

