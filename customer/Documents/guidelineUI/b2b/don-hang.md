# B2B Store — Đơn hàng (`/api/store/b2b/orders`)

## Mục đích

Doanh nghiệp xem **đơn hàng của mình** (danh sách, chi tiết theo mã, **timeline** sự kiện: đơn / fulfillment / thanh toán tùy implement BE).

**Auth:** **CustomerAuthenticated**.

**FE:** Swagger `/swagger`.

## API


| Method | Path                                         | Mô tả                    |
| ------ | -------------------------------------------- | ------------------------ |
| GET    | `/api/store/b2b/orders`                      | Danh sách phân trang     |
| GET    | `/api/store/b2b/orders/{orderCode}`          | Chi tiết theo **mã đơn** |
| GET    | `/api/store/b2b/orders/{orderCode}/timeline` | Timeline đơn hàng        |


### Query — `GET .../orders`


| Param           | Mặc định | Ghi chú |
| --------------- | -------- | ------- |
| `page`          | 1        |         |
| `pageSize`      | 20       |         |
| `orderStatus`   | —        |         |
| `paymentStatus` | —        |         |


---

## Response — `data` chi tiết đơn (khái quát)

Theo `StoreB2BOrderDetailDto` (đọc Swagger để đủ field). Các nhóm chính:


| Nhóm      | Field gợi ý                                                               | Ghi chú                                                    |
| --------- | ------------------------------------------------------------------------- | ---------------------------------------------------------- |
| Tổng quan | `orderCode`, `orderStatus`, `paymentStatus`, `paymentMethod`, `createdAt` |                                                            |
| Tiền      | `merchandiseTotal`, `discountTotal`, `payableTotal`                       |                                                            |
| Liên kết  | `quoteCode`, `quoteId`, `contractNumber`, `contractId`                    | Có thể null                                                |
| Giao hàng | `shippingAddress`                                                         | Object địa chỉ                                             |
| Sales     | `sales`                                                                   | Người phụ trách                                            |
| Dòng hàng | `lines[]`                                                                 | `variantId`, `sku`, `quantity`, `unitPrice`, `subTotal`, … |
| Xuất kho  | `fulfillments[]`                                                          | Phiếu xuất kho nếu có                                      |


---

## Response — `data` timeline (`StoreB2BOrderTimelineDto`)


| Field           | Kiểu   |
| --------------- | ------ |
| `orderCode`     | string |
| `currentStatus` | string |
| `events`        | array  |


`**events[]` (`StoreB2BOrderTimelineEventDto`):**


| Field         | Kiểu              | Ghi chú                        |
| ------------- | ----------------- | ------------------------------ |
| `eventType`   | string            | VD Order, Fulfillment, Payment |
| `status`      | string            |                                |
| `description` | string            |                                |
| `timestamp`   | string (ISO 8601) |                                |
| `notes`       | string            | null                           |


---

## Luồng UI gợi ý

### A) Danh sách đơn

1. Filter theo `orderStatus` / `paymentStatus`; preset “Đang xử lý”, “Chưa thanh toán”.
2. Row → chi tiết `GET /{orderCode}`.

### B) Timeline

1. Tab “Tiến độ” → `GET .../timeline` → render vertical timeline từ `events`.

### C) Liên kết báo giá / hợp đồng

1. Từ chi tiết đơn, deep link sang `bao-gia.md` / `hop-dong.md` nếu có `quoteCode` / `contractNumber`.

---

## UX tối ưu

- Skeleton timeline; sort `events` theo `timestamp` nếu BE không đảm bảo thứ tự.
- `orderCode` trong URL phải encode nếu có ký tự đặc biệt.

