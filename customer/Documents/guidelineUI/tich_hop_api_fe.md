# Tích hợp API cho FE — Header, request & response (chi tiết)

Bản mở rộng kèm **tham số từng lớp** (query / route / JSON body) và **shape `data`** sau khi parse envelope. Kịch bản nghiệp vụ: `[kich_ban_b2b_bao_gia_den_ket_thuc_don.md](kich_ban_b2b_bao_gia_den_ket_thuc_don.md)`. Chuẩn lỗi toàn cục: `[../../api_response_va_xu_ly_loi.md](../../api_response_va_xu_ly_loi.md)`.

**Quy ước:**

- `{base}` = URL gốc API (vd: `http://localhost:8080`).
- JSON dùng **camelCase** (theo serializer ASP.NET Core).
- Mọi response thành công từ controller theo pattern hiện tại: **HTTP 200** + body `ResponseDto` (`success`, `data`, `message`, …). Một số lỗi JWT trả **401** có thể không bọc `ResponseDto`.

---

## 1. Header chung


| Header          | Bắt buộc                | Giá trị                 |
| --------------- | ----------------------- | ----------------------- |
| `Content-Type`  | Có, với body JSON       | `application/json`      |
| `Accept`        | Khuyến nghị             | `application/json`      |
| `Authorization` | Có, với endpoint bảo vệ | `Bearer <access_token>` |


**Không dùng ché token:** JWT **staff** (`PrincipalKind: staff`) cho `api/admin/...` và `api/Auth/...`; JWT **customer** (`PrincipalKind: customer`) cho `api/store/b2b/...`.

---

## 2. Envelope response: `ResponseDto`

Mọi `200 OK` từ controller (pattern hiện tại) có dạng:


| Trường JSON | Kiểu      | Ý nghĩa                     |
| ----------- | --------- | --------------------------- |
| `success`   | `boolean` | `true` khi xử lý thành công |
| `data`      | `object`  | `array`                     |
| `message`   | `string`  | Thông báo tiếng Việt        |
| `errorCode` | `string`  | `null`                      |
| `errors`    | `object`  | `null`                      |
| `traceId`   | `string`  | `null`                      |
| `detail`    | `string`  | `null`                      |


**FE:** luôn `const json = await res.json(); if (!json.success) { /* message, errorCode, errors */ }`.

---

## 3. Lỗi: HTTP status + `errorCode` (handler)


| HTTP | `errorCode` (tiêu biểu)           | Khi nào                                             |
| ---- | --------------------------------- | --------------------------------------------------- |
| 400  | `BAD_REQUEST`, `VALIDATION_ERROR` | Tham số sai; validation model                       |
| 401  | (middleware)                      | Thiếu/sai JWT                                       |
| 403  | `FORBIDDEN`                       | Đủ JWT nhưng không đủ policy / quyền                |
| 404  | `NOT_FOUND`                       | `KeyNotFoundException`                              |
| 409  | `CONFLICT`                        | `InvalidOperationException` (nghiệp vụ, trạng thái) |
| 500  | `INTERNAL_ERROR`                  | Lỗi không map                                       |


Body lỗi (handler) vẫn là object cùng họ `ResponseDto` với `success: false`.

---

## 4. Khối dữ liệu phân trang: `PagedResultDto<T>`

Nằm trong `response.data` cho các API list:


| Trường       | Kiểu     | Ý nghĩa                       |
| ------------ | -------- | ----------------------------- |
| `items`      | `T[]`    | Danh sách phần tử             |
| `totalCount` | `number` | Tổng bản ghi (toàn bộ filter) |
| `page`       | `number` | Trang hiện tại (1-based)      |
| `pageSize`   | `number` | Kích thước trang              |


---

## 5. Đăng nhập & JWT

### 5.1 Nhân viên (staff)


|                   |                              |
| ----------------- | ---------------------------- |
| **Method + path** | `POST {base}/api/Auth/login` |
| **Auth**          | Không (AllowAnonymous)       |
| **Request body**  | Xem bảng                     |


**Body (`LoginRequestDto`):**


| Field      | Kiểu     | Bắt buộc | Ghi chú |
| ---------- | -------- | -------- | ------- |
| `username` | `string` | Có       | max 100 |
| `password` | `string` | Có       |         |


`**data` (`LoginResponseDto`):**


| Field          | Kiểu                                  |
| -------------- | ------------------------------------- |
| `accessToken`  | `string`                              |
| `expiresAtUtc` | `string` (ISO 8601, `DateTimeOffset`) |
| `user`         | `AuthenticatedUserDto`                |


`**user` (`AuthenticatedUserDto`):**


| Field      | Kiểu     |
| ---------- | -------- |
| `id`       | `number` |
| `username` | `string` |
| `fullName` | `string` |
| `roleName` | `string` |


---

### 5.2 Khách B2B (store)


|                               |                                        |
| ----------------------------- | -------------------------------------- |
| **Method + path**             | `POST {base}/api/store/b2b/auth/login` |
| **Auth**                      | Không                                  |
| **Body (`StoreB2BLoginDto`)** |                                        |



| Field      | Kiểu     | Bắt buộc |
| ---------- | -------- | -------- |
| `email`    | `string` | Có       |
| `password` | `string` | Có       |


`**data` (`StoreB2BLoginResponseDto`):**


| Field          | Kiểu                 |
| -------------- | -------------------- |
| `accessToken`  | `string`             |
| `expiresAtUtc` | `string`             |
| `customer`     | `StoreB2BProfileDto` |


`**customer` (`StoreB2BProfileDto`):** `id`, `customerType`, `fullName`, `email`, `phone`, `companyName`, `taxCode`, `companyAddress`, `debtBalance`.

---

### 5.3 Đăng ký B2B


|                                  |                                           |
| -------------------------------- | ----------------------------------------- |
| **Method + path**                | `POST {base}/api/store/b2b/auth/register` |
| **Auth**                         | Không                                     |
| **Body (`StoreB2BRegisterDto`)** |                                           |



| Field            | Kiểu     | Bắt buộc   |
| ---------------- | -------- | ---------- |
| `fullName`       | `string` | Có         |
| `email`          | `string` | Có         |
| `phone`          | `string` | Có         |
| `password`       | `string` | Có (min 6) |
| `companyName`    | `string` | Có         |
| `taxCode`        | `string` | Không      |
| `companyAddress` | `string` | Không      |


`**data`:** cùng dạng đăng nhập thành công (token + profile) — xác nhận lại trên Swagger nếu service đổi.

---

### 5.4 Hồ sơ B2B (đã đăng nhập)


| Method + path                      | Auth                |
| ---------------------------------- | ------------------- |
| `GET {base}/api/store/b2b/auth/me` | Bearer **customer** |
| `PUT {base}/api/store/b2b/auth/me` | Bearer **customer** |


**PUT body (`StoreB2BUpdateDto`):** xem Swagger / `Dto/Store` (cập nhật hồ sơ doanh nghiệp).

---

## 6. Báo giá B2B — Store (`api/store/b2b/quotes`)

**Auth:** `Authorization: Bearer <customer_token>`  
**Policy:** `CustomerAuthenticated`

### 6.1 Gửi yêu cầu báo giá


|          |                                        |
| -------- | -------------------------------------- |
| **POST** | `{base}/api/store/b2b/quotes/requests` |


**Body (`StoreB2BQuoteRequestDto`):**


| Field   | Kiểu                            | Bắt buộc        |
| ------- | ------------------------------- | --------------- |
| `items` | `StoreB2BQuoteRequestItemDto[]` | Có (không rỗng) |
| `notes` | `string`                        | Không           |


`**items[]` (`StoreB2BQuoteRequestItemDto`):**


| Field       | Kiểu     | Bắt buộc |
| ----------- | -------- | -------- |
| `variantId` | `number` | Có       |
| `quantity`  | `number` | Có (> 0) |


`**data`:** `StoreB2BQuoteDetailDto` (chi tiết báo giá vừa tạo — xem 6.3).

---

### 6.2 Danh sách báo giá


|         |                               |
| ------- | ----------------------------- |
| **GET** | `{base}/api/store/b2b/quotes` |


**Query:**


| Param      | Kiểu     | Mặc định | Mô tả               |
| ---------- | -------- | -------- | ------------------- |
| `page`     | `number` | 1        |                     |
| `pageSize` | `number` | 20       |                     |
| `status`   | `string` | null     | Lọc theo trạng thái |


`**data`:** `PagedResultDto<StoreB2BQuoteListItemDto>`

`**StoreB2BQuoteListItemDto`:** `id`, `quoteCode`, `createdAt`, `status`, `lineCount`, `totalAmount`, `discountValue`, `discountType`, `finalAmount`, `validUntil`, `salesName`.

---

### 6.3 Chi tiết báo giá theo mã


|         |                                           |
| ------- | ----------------------------------------- |
| **GET** | `{base}/api/store/b2b/quotes/{quoteCode}` |


**Route:** `quoteCode` — `string` (mã báo giá).

`**data`:** `StoreB2BQuoteDetailDto`


| Field                  | Kiểu                     |
| ---------------------- | ------------------------ |
| `id`                   | `number`                 |
| `quoteCode`            | `string`                 |
| `createdAt`            | `string`                 |
| `status`               | `string`                 |
| `totalAmount`          | `number`                 |
| `discountType`         | `string`                 |
| `discountValue`        | `number`                 |
| `finalAmount`          | `number`                 |
| `validUntil`           | `string`                 |
| `notes`                | `string`                 |
| `customerNotes`        | `string`                 |
| `rejectReason`         | `string`                 |
| `customerRejectReason` | `string`                 |
| `approvedAt`           | `string`                 |
| `sales`                | `StoreB2BQuoteSalesDto`  |
| `lines`                | `StoreB2BQuoteLineDto[]` |


`**StoreB2BQuoteLineDto`:** `id`, `variantId`, `quantity`, `unitPrice`, `subTotal`, `currentSku`, `variantName`, `productName`, `imageUrl`.

---

### 6.4 Khách chấp nhận / từ chối / counter-offer


| Method + path                        | Body                           |
| ------------------------------------ | ------------------------------ |
| `POST .../quotes/{id}/accept`        | *(không body)*                 |
| `POST .../quotes/{id}/reject`        | `StoreB2BQuoteRejectDto`       |
| `POST .../quotes/{id}/counter-offer` | `StoreB2BQuoteCounterOfferDto` |


**Route:** `id` — `number` (PK báo giá, **không** phải `quoteCode`).

`**StoreB2BQuoteRejectDto`:**


| Field    | Kiểu     | Bắt buộc |
| -------- | -------- | -------- |
| `reason` | `string` | Không    |


`**StoreB2BQuoteCounterOfferDto`:**


| Field     | Kiểu                                 | Bắt buộc |
| --------- | ------------------------------------ | -------- |
| `message` | `string`                             | Có       |
| `items`   | `StoreB2BQuoteCounterOfferItemDto[]` | Không    |


`**StoreB2BQuoteCounterOfferItemDto`:** `variantId`, `desiredQuantity`, `desiredUnitPrice`.

`**data`:** `StoreB2BQuoteDetailDto` (cập nhật).

---

## 7. Hợp đồng B2B — Store (`api/store/b2b/contracts`)

**Auth:** Bearer **customer**

### 7.1 Danh sách

| **GET** | `{base}/api/store/b2b/contracts` |

**Query:** `page` (1), `pageSize` (20), `status` (optional).

`**data`:** `PagedResultDto<StoreB2BContractListItemDto>` (`id`, `contractNumber`, `status`, `validFrom`, `validTo`, `signedDate`, `createdAt`, `quoteCode`, `totalAmount`, `orderCount`).

---

### 7.2 Chi tiết theo mã hợp đồng

| **GET** | `{base}/api/store/b2b/contracts/{contractNumber}` |

`**data`:** `StoreB2BContractDetailDto` — gồm `quote` (`StoreB2BContractQuoteDto` + `items`), `orders` (`StoreB2BContractOrderDto[]`), v.v. (xem `Dto/Store/StoreB2BContractDtos.cs`).

---

### 7.3 Khách xác nhận hợp đồng

| **POST** | `{base}/api/store/b2b/contracts/{id}/confirm` |

**Route:** `id` — PK hợp đồng (`number`).

**Body (`StoreB2BContractConfirmDto`):**


| Field   | Kiểu     | Bắt buộc |
| ------- | -------- | -------- |
| `notes` | `string` | Không    |


`**data`:** `StoreB2BContractDetailDto`.

---

## 8. Đơn hàng B2B — Store (`api/store/b2b/orders`)

**Auth:** Bearer **customer**


| Method + path                                        | Query / route                                      | `data`                                                                |
| ---------------------------------------------------- | -------------------------------------------------- | --------------------------------------------------------------------- |
| **GET** `/api/store/b2b/orders`                      | `page`, `pageSize`, `orderStatus`, `paymentStatus` | `PagedResultDto<StoreB2BOrderListItemDto>`                            |
| **GET** `/api/store/b2b/orders/{orderCode}`          | `orderCode` string                                 | `StoreB2BOrderDetailDto`                                              |
| **GET** `/api/store/b2b/orders/{orderCode}/timeline` |                                                    | `StoreB2BOrderTimelineDto` (`orderCode`, `currentStatus`, `events[]`) |


`**StoreB2BOrderTimelineEventDto`:** `eventType`, `status`, `description`, `timestamp`, `notes`.

---

## 9. Báo giá — Admin (`api/admin/quotes`)

**Auth:** Bearer **staff** (`StaffAuthenticated`)

### 9.1 Danh sách

| **GET** | `{base}/api/admin/quotes` |

**Query:**


| Param        | Kiểu                 | Mô tả                          |
| ------------ | -------------------- | ------------------------------ |
| `page`       | `number`             | mặc định 1                     |
| `pageSize`   | `number`             | mặc định 20                    |
| `status`     | `string?`            |                                |
| `customerId` | `number?`            |                                |
| `salesId`    | `number?`            |                                |
| `fromDate`   | `string?` (ISO date) |                                |
| `toDate`     | `string?`            |                                |
| `search`     | `string?`            | Mã / tên / SĐT / công ty / MST |


`**data`:** `PagedResultDto<AdminQuoteListItemDto>` (xem `Dto/Admin/AdminQuoteDtos.cs`).

---

### 9.2 Chi tiết

| **GET** | `{base}/api/admin/quotes/{id}` |
| **GET** | `{base}/api/admin/quotes/by-code/{quoteCode}` |

`**data`:** `AdminQuoteDetailDto` (customer, sales, manager, `lines[]`, …).

---

### 9.3 Tạo / cập nhật / luồng duyệt


| Method   | Path                                     | Body                                   |
| -------- | ---------------------------------------- | -------------------------------------- |
| **POST** | `/api/admin/quotes`                      | `AdminQuoteCreateDto`                  |
| **PUT**  | `/api/admin/quotes/{id}`                 | `AdminQuoteUpdateDto`                  |
| **PUT**  | `/api/admin/quotes/{id}/assign`          | *(empty)* — gán Sales = user JWT       |
| **PUT**  | `/api/admin/quotes/{id}/return-to-draft` | *(empty)*                              |
| **PUT**  | `/api/admin/quotes/{id}/submit`          | *(empty)*                              |
| **PUT**  | `/api/admin/quotes/{id}/approve`         | *(empty)* — Manager từ JWT             |
| **PUT**  | `/api/admin/quotes/{id}/reject`          | `AdminQuoteRejectDto` (`rejectReason`) |


`**AdminQuoteCreateDto`:** `customerId`, `lines[]` (`variantId`, `quantity`, `unitPrice?`), `discountType?`, `discountValue?`, `validUntil?`, `notes?`.

`**AdminQuoteUpdateDto`:** `lines[]` (`id?`, `variantId`, `quantity`, `unitPrice?`), `discountType?`, `discountValue?`, `validUntil?`, `notes?`.

`**data`:** `AdminQuoteDetailDto` hoặc sau convert là `AdminOrderDetailDto` (mục 9.5).

---

### 9.4 Giữ / trả tồn (RESERVE / RELEASE)


| Method   | Path                                                   | Body      | Auth ghi chú                                                                                                   |
| -------- | ------------------------------------------------------ | --------- | -------------------------------------------------------------------------------------------------------------- |
| **POST** | `/api/admin/quotes/{id}/reserve-inventory`             | *(empty)* | Staff JWT; endpoint giao dịch kho cần user có policy **WarehouseStaff** để `CreateTransactionAsync` thành công |
| **POST** | `/api/admin/quotes/{id}/release-inventory-reservation` | *(empty)* | Tương tự                                                                                                       |


`**data`:** `AdminQuoteDetailDto`.

---

### 9.5 Chuyển thành đơn

| **POST** | `{base}/api/admin/quotes/{id}/convert-to-order` |

**Body (`AdminQuoteConvertToOrderDto`):**


| Field               | Kiểu     | Bắt buộc                                                                           |
| ------------------- | -------- | ---------------------------------------------------------------------------------- |
| `shippingAddressId` | `number` | Có                                                                                 |
| `paymentMethod`     | `string` | Có                                                                                 |
| `note`              | `string` | Không                                                                              |
| `contractId`        | `number` | Không — bắt buộc nghiệp vụ nếu đơn phải gắn hợp đồng đã **Confirmed** / **Active** |


`**data`:** `AdminOrderDetailDto`

**Các field chính (`AdminOrderDetailDto`):** `id`, `orderCode`, `createdAt`, `orderStatus`, `paymentStatus`, `paymentMethod`, `merchandiseTotal`, `discountTotal`, `payableTotal`, `customer`, `shippingAddress`, `voucher`, `sales`, `lines[]`, `quoteId`, `contractId`, `payOsPaymentLinkId`, `payOsCheckoutUrl`, `payOsLinkExpiresAt`.

---

### 9.6 Trạng thái báo giá (meta)

| **GET** | `{base}/api/admin/quotes/statuses` |

`**data`:** `{ "statuses": string[] }` — giá trị = `QuoteStatuses.All`.

---

## 10. Hợp đồng — Admin (`api/admin/contracts`)

**Auth:** Bearer **staff**

### 10.1 Danh sách

| **GET** | `{base}/api/admin/contracts` |

**Query:** `page`, `pageSize`, `status`, `customerId`, `quoteId`.

`**data`:** `PagedResultDto<AdminContractListItemDto>`.

---

### 10.2 Chi tiết

| **GET** | `{base}/api/admin/contracts/{id}` |
| **GET** | `{base}/api/admin/contracts/by-number/{contractNumber}` |

`**data`:** `AdminContractDetailDto` (`id`, `contractNumber`, `status`, `quoteId`, `quoteCode`, `customerId`, `customerName`, `signedDate`, `validFrom`, `validTo`, `paymentTerms`, `attachmentUrl`, `notes`, `customerConfirmedAt`, `createdAt`).

---

### 10.3 Tạo / sửa / gửi khách / hủy


| Method   | Path                                                       | Body                                 |
| -------- | ---------------------------------------------------------- | ------------------------------------ |
| **POST** | `/api/admin/contracts`                                     | `AdminContractCreateDto`             |
| **PUT**  | `/api/admin/contracts/{id}`                                | `AdminContractUpdateDto`             |
| **PUT**  | `/api/admin/contracts/{id}/send-for-customer-confirmation` | *(empty)*                            |
| **PUT**  | `/api/admin/contracts/{id}/cancel`                         | `AdminContractCancelDto` (`reason?`) |


`**AdminContractCreateDto`:**


| Field                         | Kiểu      | Bắt buộc                                                         |
| ----------------------------- | --------- | ---------------------------------------------------------------- |
| `quoteId`                     | `number`  | Có                                                               |
| `sendForCustomerConfirmation` | `boolean` | Có — `true` → tạo ở **PendingConfirmation**, `false` → **Draft** |
| `validFrom`                   | `string`  | `null`                                                           |
| `validTo`                     | `string`  | `null`                                                           |
| `paymentTerms`                | `string`  | Không                                                            |
| `attachmentUrl`               | `string`  | Không                                                            |
| `notes`                       | `string`  | Không                                                            |


`**AdminContractUpdateDto`:** `validFrom`, `validTo`, `paymentTerms`, `attachmentUrl`, `notes` (tất cả optional; logic chỉnh sửa theo trạng thái — xem service).

`**data`:** `AdminContractDetailDto`.

---

### 10.4 Meta trạng thái

| **GET** | `{base}/api/admin/contracts/statuses` |

`**data`:** `string[]` trực tiếp — `ContractStatuses.All`.

---

## 11. Đơn hàng — Admin (`api/admin/orders`)

**Auth:** Bearer **staff**

### 11.1 Danh sách

| **GET** | `{base}/api/admin/orders` |

**Query:** `page`, `pageSize`, `orderStatus`, `paymentStatus`, `customerId`, `salesId`, `fromDate`, `toDate`, `search`.

`**data`:** `PagedResultDto<AdminOrderListItemDto>`.

---

### 11.2 Chi tiết

| **GET** | `{base}/api/admin/orders/{id}` |
| **GET** | `{base}/api/admin/orders/by-code/{orderCode}` |

`**data`:** `AdminOrderDetailDto` (mục 9.5).

---

### 11.3 Tạo đơn / cập nhật trạng thái / hủy / gán sales


| Method   | Path                                    | Body                               |
| -------- | --------------------------------------- | ---------------------------------- |
| **POST** | `/api/admin/orders`                     | `AdminOrderCreateDto`              |
| **PUT**  | `/api/admin/orders/{id}/status`         | `AdminOrderUpdateStatusDto`        |
| **PUT**  | `/api/admin/orders/{id}/payment-status` | `AdminOrderUpdatePaymentStatusDto` |
| **POST** | `/api/admin/orders/{id}/cancel`         | `AdminOrderCancelDto`              |
| **PUT**  | `/api/admin/orders/{id}/assign-sales`   | `AdminOrderAssignSalesDto`         |


`**AdminOrderUpdateStatusDto`:** `status` (string — giá trị trong `OrderStatuses`), `note?`.

`**AdminOrderUpdatePaymentStatusDto`:** `paymentStatus`, `note?`.

`**AdminOrderCancelDto`:** `cancelReason?`.

`**AdminOrderAssignSalesDto`:** `salesId`.

`**data`:** `AdminOrderDetailDto`.

---

### 11.4 Meta

| **GET** | `{base}/api/admin/orders/statuses` |

`**data`:** `{ "orderStatuses": string[], "paymentStatuses": string[] }` — lần lượt `OrderStatuses.All`, `PaymentStatuses.All`.

---

## 12. Fulfillment & tồn kho (WarehouseStaff)

**Auth:** Bearer **staff** với role thuộc **WarehouseStaff** (`admin`, `Manager`, `StockManager`, `Worker`).

### 12.1 Danh sách phiếu

| **GET** | `{base}/api/admin/fulfillments` |

**Query:** `page`, `pageSize`, `status`, `orderId`, `assignedWorkerId`.

`**data`:** `PagedResultDto<FulfillmentListItemDto>` (`id`, `orderId`, `orderCode`, `ticketType`, `status`, `createdAt`, `updatedAt`, `assignedWorkerId`, `assignedWorkerName`, `createdBy`, `createdByName`, `customerName`, `customerPhone`).

---

### 12.2 Chi tiết phiếu

| **GET** | `{base}/api/admin/fulfillments/{id}` |

`**data`:** `FulfillmentDetailDto` (gồm `order` kiểu `FulfillmentOrderDto` + `lines`, `customer`, `shippingAddress`).

---

### 12.3 Cập nhật trạng thái / gán worker

| **PUT** | `{base}/api/admin/fulfillments/{id}/status` | Body: `FulfillmentUpdateStatusDto` |
| **PUT** | `{base}/api/admin/fulfillments/{id}/assign` | Body: `FulfillmentAssignWorkerDto` |

`**FulfillmentUpdateStatusDto`:**


| Field    | Kiểu     | Bắt buộc                                          |
| -------- | -------- | ------------------------------------------------- |
| `status` | `string` | Có — `Pending` → `Picking` → `Packed` → `Shipped` |
| `notes`  | `string` | Không                                             |


`**FulfillmentAssignWorkerDto`:** `workerId` (number, required).

`**data`:** `FulfillmentDetailDto`.

---

### 12.3b Meta trạng thái phiếu

| **GET** | `{base}/api/admin/fulfillments/statuses` |

`**data`:** `string[]` — `FulfillmentStatuses.All`.

---

### 12.4 Tạo phiếu cho đơn

| **POST** | `{base}/api/admin/orders/{orderId}/fulfillments` |

**Body (`FulfillmentCreateDto`):** `ticketType?`, `notes?`.

`**data`:** `FulfillmentDetailDto`.

---

### 12.5 Tồn kho theo variant


| Method   | Path                                                             | Body                               |
| -------- | ---------------------------------------------------------------- | ---------------------------------- |
| **GET**  | `/api/admin/products/{productId}/variants/{variantId}/inventory` | —                                  |
| **PUT**  | cùng path                                                        | `InventoryUpsertDto`               |
| **POST** | cùng path                                                        | `InventoryUpsertDto` (tạo lần đầu) |


`**InventoryUpsertDto`:** `quantityOnHand`, `quantityReserved`, `warehouseLocation?` — `quantityAvailable` được tính = onHand − reserved (server).

---

### 12.6 Lịch sử giao dịch kho

| **GET** | `{base}/api/admin/inventory-transactions` | Query: `page`, `pageSize`, `variantId`, `type`, `fromDate`, `toDate` |
| **GET** | `{base}/api/admin/inventory-transactions/{id}` | |
| **POST** | `{base}/api/admin/inventory-transactions` | `InventoryTransactionCreateDto` |

`**InventoryTransactionCreateDto`:** `variantId`, `transactionType` (`IN`  `OUT`  `ADJUST`  `RESERVE`  `RELEASE`), `quantity`, `referenceType?`, `referenceId?`, `notes?`.

---

## 13. Swagger & DTO nguồn

- **Swagger UI:** `{base}/swagger` — schema đầy đủ, thử request kèm Bearer.
- **Mã nguồn DTO:** thư mục `Dto/Store`, `Dto/Admin`, `Dto/Fulfillment`, `Dto/Inventory`, `Dto/InventoryTransaction`, `Dto/Auth`.

---

## 14. Liên kết nội bộ

- Kịch bản UI luồng B2B: `[kich_ban_b2b_bao_gia_den_ket_thuc_don.md](kich_ban_b2b_bao_gia_den_ket_thuc_don.md)`  
- Response & lỗi: `[../../api_response_va_xu_ly_loi.md](../../api_response_va_xu_ly_loi.md)`