# Customer — Đổi / trả hàng (`/api/store/me/return-requests`)

Auth: **CustomerAuthenticated**. Service share với B2B ([../b2b/doi-tra-hang.md](../b2b/doi-tra-hang.md)).

## API


| Method | Path                                                      |
| ------ | --------------------------------------------------------- |
| GET    | `/api/store/me/return-requests?page&pageSize&status&type` |
| GET    | `/api/store/me/return-requests/{ticketNumber}`            |
| POST   | `/api/store/me/return-requests`                           |


### Body — `POST return-requests` (`StoreB2BReturnCreateDto`)


| Field          | Kiểu                            | Bắt buộc | Ghi chú                  |
| -------------- | ------------------------------- | -------- | ------------------------ |
| `orderId`      | number                          | Có       | Đơn đã giao, thuộc khách |
| `type`         | string                          | Có       | `Return` hoặc `Exchange` |
| `reason`       | string                          | Có       | Lý do đổi / trả          |
| `customerNote` | string                          | Không    |                          |
| `items[]`      | `StoreB2BReturnItemCreateDto[]` | Có       | Tối thiểu 1 dòng         |


`items[]` (`StoreB2BReturnItemCreateDto`):


| Field                | Kiểu   | Bắt buộc | Ghi chú                      |
| -------------------- | ------ | -------- | ---------------------------- |
| `variantIdReturned`  | number | Có       | SKU trả về                   |
| `variantIdExchanged` | number | Không    | Chỉ điền khi `type=Exchange` |
| `quantity`           | number | Có       | > 0                          |


```json
{
  "orderId": 321,
  "type": "Return",
  "reason": "Sản phẩm bị lỗi kỹ thuật",
  "customerNote": "Đã liên hệ hotline trước",
  "items": [
    { "variantIdReturned": 101, "quantity": 1 }
  ]
}
```

### Response — `StoreB2BReturnCreateResponseDto`


| Field          | Kiểu                            |
| -------------- | ------------------------------- |
| `id`           | number                          |
| `ticketNumber` | string                          |
| `type`         | string (`Return` / `Exchange`)  |
| `status`       | string (bắt đầu là `Requested`) |
| `createdAt`    | ISO 8601                        |
| `itemCount`    | number                          |
| `message`      | string                          |


### Response list — `PagedResultDto<StoreB2BReturnTicketListItemDto>`

`items[]`:


| Field                       | Kiểu            |
| --------------------------- | --------------- |
| `id`                        | number          |
| `ticketNumber`              | string          |
| `type`, `status`            | string          |
| `reason`                    | string | null   |
| `refundAmount`              | number          |
| `itemCount`                 | number          |
| `createdAt`                 | ISO 8601        |
| `approvedAt`, `completedAt` | ISO 8601 | null |
| `orderId`                   | number          |
| `orderCode`                 | string          |


### Response detail — `StoreB2BReturnTicketDetailDto`

Các field của list item + các field mở rộng:


| Field          | Kiểu                                                                                     |
| -------------- | ---------------------------------------------------------------------------------------- |
| `customerNote` | string | null                                                                            |
| `order`        | `StoreB2BReturnOrderDto` (`id`, `orderCode`, `createdAt`, `orderStatus`, `payableTotal`) |
| `items[]`      | `StoreB2BReturnItemDto[]`                                                                |


`items[]` (`StoreB2BReturnItemDto`):


| Field                                                          | Kiểu          |
| -------------------------------------------------------------- | ------------- |
| `id`, `variantIdReturned`                                      | number        |
| `skuReturned`, `variantNameReturned`, `productNameReturned`    | string        |
| `imageUrlReturned`                                             | string | null |
| `variantIdExchanged`                                           | number | null |
| `skuExchanged`, `variantNameExchanged`, `productNameExchanged` | string | null |
| `imageUrlExchanged`                                            | string | null |
| `quantity`                                                     | number        |


## Luồng UI

1. Từ **chi tiết đơn** (trạng thái Delivered / Completed) → nút **Đổi/Trả**.
2. Form chọn SKU từ `lines` + số lượng + type (`Return` / `Exchange`) + lý do → `POST return-requests`.
3. Tab **Đổi/trả của tôi**: theo dõi `status` (`Requested → Approved → Completed`, hoặc `Rejected`). Hiển thị `refundAmount` khi approved.

## UX

- Disable nút nếu đơn chưa Delivered hoặc đã quá thời hạn policy (client tự check).
- Nếu `type=Exchange`, yêu cầu chọn `variantIdExchanged` cùng sản phẩm hoặc tương đương (tuỳ policy).
- Hiển thị timeline phiếu (nếu BE bổ sung sau).

