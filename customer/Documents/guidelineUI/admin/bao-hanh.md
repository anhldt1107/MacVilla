# Admin — Bảo hành (`/api/admin/warranty-tickets`, `/api/admin/warranty-claims`)

## Mục đích

Quản lý **phiếu bảo hành** (tạo, tra cứu, yêu cầu bảo hành) và **cập nhật trạng thái yêu cầu** (claim) qua API riêng.

**Auth:** **StaffAuthenticated**.

**FE:** Swagger `/swagger`, OpenAPI `/swagger/v1/swagger.json`. Field JSON (camelCase).

---

## Phần 1 — Phiếu bảo hành (`/api/admin/warranty-tickets`)

| Method | Path | Mô tả |
| ------ | ---- | ----- |
| GET | `/api/admin/warranty-tickets` | Danh sách phân trang |
| GET | `/api/admin/warranty-tickets/{id}` | Chi tiết |
| GET | `/api/admin/warranty-tickets/by-number/{ticketNumber}` | Chi tiết theo mã phiếu |
| POST | `/api/admin/warranty-tickets` | Tạo phiếu (thường khi giao hàng thành công) |
| POST | `/api/admin/warranty-tickets/{id}/claims` | Tạo yêu cầu bảo hành cho phiếu |
| GET | `/api/admin/warranty-tickets/statuses` | Trạng thái phiếu + trạng thái claim |

### Query — `GET .../warranty-tickets`

| Param | Mặc định | Ghi chú |
| ----- | -------- | ------- |
| `page` | 1 | |
| `pageSize` | 20 | |
| `status` | — | |
| `customerId` | — | |
| `orderId` | — | |
| `fromDate`, `toDate` | — | |
| `search` | — | |

### Body — `POST .../warranty-tickets`

| Field | Kiểu | Bắt buộc | Ghi chú |
| ----- | ---- | -------- | ------- |
| `customerId` | number | Có | |
| `orderId` | number | Không | |
| `contractId` | number | Không | |
| `validUntil` | string (ISO 8601) | Không | Bỏ trống: BE mặc định 12 tháng từ ngày tạo |

```json
{
  "customerId": 12,
  "orderId": 900,
  "contractId": null,
  "validUntil": "2028-04-18T00:00:00.000Z"
}
```

### Body — `POST .../warranty-tickets/{id}/claims`

| Field | Kiểu | Bắt buộc | Ghi chú |
| ----- | ---- | -------- | ------- |
| `variantId` | number | Có | |
| `defectDescription` | string | Không | |
| `imagesUrl` | string | Không | Nhiều URL cách nhau `,` hoặc `;` |
| `estimatedCost` | number | Có | Có thể 0 |
| `note` | string | Không | |

```json
{
  "variantId": 101,
  "defectDescription": "Màn loang sáng góc trái",
  "imagesUrl": "https://a.jpg,https://b.jpg",
  "estimatedCost": 500000,
  "note": "Khách mang trực tiếp"
}
```

---

## Phần 2 — Yêu cầu bảo hành (`/api/admin/warranty-claims`)

| Method | Path | Mô tả |
| ------ | ---- | ----- |
| GET | `/api/admin/warranty-claims/{id}` | Chi tiết yêu cầu |
| PUT | `/api/admin/warranty-claims/{id}/status` | Cập nhật trạng thái claim |

### Body — `PUT .../warranty-claims/{id}/status`

| Field | Kiểu | Bắt buộc | Ghi chú |
| ----- | ---- | -------- | ------- |
| `status` | string | Có | Luồng: Pending_Check → Checking → Confirmed_Defect → Repairing → Waiting_Pickup → Completed |
| `estimatedCost` | number | Không | Cập nhật dự kiến |
| `resolution` | string | Không | Kết quả khi xong / từ chối |
| `note` | string | Không | |

```json
{
  "status": "Repairing",
  "estimatedCost": 800000,
  "resolution": null,
  "note": "Đang chờ linh kiện"
}
```

---

## Luồng UI gợi ý

### A) Lễ tân / CS — tiếp nhận

1. Tìm phiếu theo mã hoặc SĐT khách (`search`).
2. Tạo **claim** mới từ phiếu đang hiệu lực.

### B) Kỹ thuật — xử lý

1. Màn hàng đợi claim theo `status`.
2. Cập nhật từng bước qua `PUT .../status` với `resolution` / `note` khi cần.

### C) Từ đơn giao thành công

1. Shortcut “Tạo phiếu bảo hành” với `orderId` + dòng hàng đã giao.

---

## UX tối ưu

- Timeline trực quan cho claim status.
- `GET .../statuses` để đồng bộ label với BE.
- In phiếu biên nhận bàn giao (FE).
