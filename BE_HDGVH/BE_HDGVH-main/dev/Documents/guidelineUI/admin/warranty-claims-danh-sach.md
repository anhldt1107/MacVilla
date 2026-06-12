# Admin — Danh sách yêu cầu bảo hành / claim (`GET /api/admin/warranty-claims`)

Tài liệu tích hợp cho màn **hàng đợi xử lý bảo hành** (danh sách `WarrantyClaim` phân trang, lọc theo trạng thái / khách / phiếu / đơn / tìm kiếm).

---

## 1. Tổng quan


| Thuộc tính | Giá trị                                                   |
| ---------- | --------------------------------------------------------- |
| **Method** | `GET`                                                     |
| **Path**   | `/api/admin/warranty-claims`                              |
| **Auth**   | Bắt buộc — JWT **staff**, policy `**StaffAuthenticated`** |
| **Body**   | Không                                                     |


**Base URL:** theo môi trường (VD `http://localhost:8080`).  
**Envelope:** `ResponseDto` — `success`, `data`, `message` (và có thể `errorCode`, `errors` khi lỗi).

---

## 2. Request

### 2.1. URL ví dụ

**Hàng chờ xử lý** (loại claim đã `Completed` / `Rejected` / `Cancelled`):

```http
GET /api/admin/warranty-claims?onlyOpen=true&page=1&pageSize=20 HTTP/1.1
Host: localhost:8080
Authorization: Bearer <staff_jwt>
Accept: application/json
```

**Chỉ claim đang chờ kiểm tra:**

```http
GET /api/admin/warranty-claims?status=Pending_Check&page=1&pageSize=20 HTTP/1.1
```

### 2.2. Headers


| Header          | Bắt buộc | Ghi chú                                           |
| --------------- | -------- | ------------------------------------------------- |
| `Authorization` | **Có**   | `Bearer <access_token>` — `POST /api/Auth/login`. |
| `Accept`        | Không    | Khuyến nghị: `application/json`                   |


### 2.3. Query parameters


| Param              | Kiểu     | Mặc định | Mô tả                                                                                                                                                             |
| ------------------ | -------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `page`             | integer  | `1`      | Trang (≥ 1).                                                                                                                                                      |
| `pageSize`         | integer  | `20`     | Kích thước trang, **tối đa 100**.                                                                                                                                 |
| `status`           | string   | —        | Lọc **một** trạng thái chính xác (so khớng **không phân biệt hoa thường**). Giá trị hợp lệ: xem [mục 4](#4-giá-trị-status-tham-chiếu).                            |
| `onlyOpen`         | boolean  | `false`  | `true`: chỉ claim **chưa kết thúc** — loại `Completed`, `Rejected`, `Cancelled` (dùng làm **hàng chờ xử lý**). Kết hợp với `status` thì áp dụng **cả hai** (AND). |
| `customerId`       | integer  | —        | Lọc theo khách của phiếu bảo hành.                                                                                                                                |
| `warrantyTicketId` | integer  | —        | Lọc theo ID phiếu `WarrantyTicket`.                                                                                                                               |
| `orderId`          | integer  | —        | Lọc theo đơn gắn trên phiếu (`WarrantyTicket.OrderId`).                                                                                                           |
| `fromDate`         | datetime | —        | `CreatedAt` của claim **≥** `fromDate`.                                                                                                                           |
| `toDate`           | datetime | —        | `CreatedAt` **<** `toDate` ngày **kế** (BE dùng `toDate.Date + 1 ngày` — tức bao trọn ngày `toDate`).                                                             |
| `search`           | string   | —        | Chuỗi con (không phân biệt hoa thường) trong: mã phiếu, SKU, mô tả lỗi, mã đơn, tên khách.                                                                        |


---

## 3. Response thành công (HTTP 200)


| Field (root) | Kiểu    | Ghi chú                                           |
| ------------ | ------- | ------------------------------------------------- |
| `success`    | boolean | `true`                                            |
| `data`       | object  | `PagedResultDto<AdminWarrantyClaimListItemDto>`   |
| `message`    | string  | VD: *"Lấy danh sách yêu cầu bảo hành thành công"* |


### 3.1. Object `data`


| Field        | Kiểu JSON | Mô tả                                        |
| ------------ | --------- | -------------------------------------------- |
| `items`      | array     | Danh sách claim (mục 3.2).                   |
| `totalCount` | number    | Tổng bản ghi khớp filter (trước phân trang). |
| `page`       | number    | Trang hiện tại.                              |
| `pageSize`   | number    | Kích thước trang.                            |


### 3.2. Phần tử `items[]` — `AdminWarrantyClaimListItemDto`


| Field               | Kiểu              | Mô tả                                                             |
| ------------------- | ----------------- | ----------------------------------------------------------------- |
| `id`                | number            | ID claim — dùng cho `PUT /api/admin/warranty-claims/{id}/status`. |
| `warrantyTicketId`  | number            | ID phiếu bảo hành.                                                |
| `ticketNumber`      | string            | Mã phiếu.                                                         |
| `customerId`        | number            | Khách.                                                            |
| `customerName`      | string            | Tên khách.                                                        |
| `customerPhone`     | string | null     | SĐT.                                                              |
| `orderId`           | number | null     | Đơn (nếu phiếu có gắn đơn).                                       |
| `orderCode`         | string | null     | Mã đơn.                                                           |
| `variantId`         | number            | Biến thể.                                                         |
| `sku`               | string            | SKU.                                                              |
| `variantName`       | string            | Tên biến thể.                                                     |
| `productName`       | string            | Tên sản phẩm.                                                     |
| `status`            | string            | Trạng thái claim.                                                 |
| `createdAt`         | string (ISO 8601) | Thời điểm tạo claim.                                              |
| `estimatedCost`     | number            | Chi phí dự kiến.                                                  |
| `defectDescription` | string | null     | Mô tả lỗi.                                                        |


### 3.3. Ví dụ JSON response

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 42,
        "warrantyTicketId": 7,
        "ticketNumber": "WT-202604-00012",
        "customerId": 3,
        "customerName": "Công ty ABC",
        "customerPhone": "0909123456",
        "orderId": 100,
        "orderCode": "ORD-202604-001",
        "variantId": 55,
        "sku": "SKU-X-01",
        "variantName": "Đen",
        "productName": "Ghế xoay",
        "status": "Pending_Check",
        "createdAt": "2026-04-18T09:30:00Z",
        "estimatedCost": 0,
        "defectDescription": "Bánh xe kêu"
      }
    ],
    "totalCount": 1,
    "page": 1,
    "pageSize": 20
  },
  "message": "Lấy danh sách yêu cầu bảo hành thành công",
  "errorCode": null,
  "errors": null
}
```

---

## 4. Giá trị `status` (tham chiếu)

Cùng domain với `GET /api/admin/warranty-tickets/statuses` — claim:


| Giá trị            | Ghi chú ngắn    |
| ------------------ | --------------- |
| `Pending_Check`    | Chờ kiểm tra    |
| `Checking`         | Đang kiểm tra   |
| `Confirmed_Defect` | Đã xác nhận lỗi |
| `Repairing`        | Đang sửa        |
| `Waiting_Pickup`   | Chờ khách nhận  |
| `Completed`        | Hoàn thành      |
| `Rejected`         | Từ chối         |
| `Cancelled`        | Đã hủy          |


---

## 5. Lỗi thường gặp


| HTTP    | Nguyên nhân               |
| ------- | ------------------------- |
| **401** | Thiếu / hết hạn JWT staff |


Không có body validation cho GET; `page` / `pageSize` được chuẩn hóa phía server.

---

## 6. Luồng FE gợi ý

1. Màn **hàng đợi**: `GET .../warranty-claims?onlyOpen=true&page=&pageSize=`.
2. Chọn dòng → `PUT /api/admin/warranty-claims/{id}/status` — xem [warranty-claim-cap-nhat-trang-thai.md](./warranty-claim-cap-nhat-trang-thai.md).
3. Cần đủ field / claim kèm ảnh: `GET /api/admin/warranty-claims/{id}`.
4. Ngữ cảnh phiếu + toàn bộ claim: `GET /api/admin/warranty-tickets/{id}` hoặc `by-number/...` — [bao-hanh.md](./bao-hanh.md).

