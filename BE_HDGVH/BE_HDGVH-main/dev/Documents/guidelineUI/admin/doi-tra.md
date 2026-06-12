# Admin — Đổi / trả hàng (`/api/admin/returns`)

## Mục đích

Quản lý **phiếu đổi trả**: danh sách, chi tiết, tạo yêu cầu, **duyệt / từ chối** (Manager), **hoàn tất** sau thu hồi hàng và hoàn tiền.

**Auth:** **StaffAuthenticated** (thao tác duyệt/hoàn tất cần đúng vai trò nghiệp vụ).

**FE:** Swagger `/swagger`, OpenAPI `/swagger/v1/swagger.json`. Field JSON (camelCase).

## API

| Method | Path | Mô tả |
| ------ | ---- | ----- |
| GET | `/api/admin/returns` | Danh sách phân trang + filter |
| GET | `/api/admin/returns/{id}` | Chi tiết |
| GET | `/api/admin/returns/by-number/{ticketNumber}` | Chi tiết theo mã phiếu |
| POST | `/api/admin/returns` | Tạo yêu cầu |
| PUT | `/api/admin/returns/{id}/approve` | **ManagerOrAdmin** duyệt |
| PUT | `/api/admin/returns/{id}/reject` | **ManagerOrAdmin** từ chối |
| PUT | `/api/admin/returns/{id}/complete` | Hoàn tất (kho + hoàn tiền) |
| GET | `/api/admin/returns/statuses` | Trạng thái, loại phiếu, inventory actions |
| GET | `/api/admin/returns/types` | Return / Exchange |

### Query — `GET .../returns`

| Param | Mặc định | Ghi chú |
| ----- | -------- | ------- |
| `page` | 1 | |
| `pageSize` | 20 | |
| `status` | — | |
| `type` | — | Return / Exchange |
| `customerId` | — | |
| `orderId` | — | |
| `fromDate`, `toDate` | — | |
| `search` | — | |

### Body — `POST .../returns`

| Field | Kiểu | Bắt buộc | Ghi chú |
| ----- | ---- | -------- | ------- |
| `orderId` | number | Có | |
| `type` | string | Có | `Return` hoặc `Exchange` (default BE: `Return`) |
| `reason` | string | Không | |
| `customerNote` | string | Không | |
| `internalNote` | string | Không | |
| `items` | array | Có | Xem bảng dòng |

**`items[]`:**

| Field | Kiểu | Bắt buộc | Ghi chú |
| ----- | ---- | -------- | ------- |
| `variantIdReturned` | number | Có | Hàng trả |
| `variantIdExchanged` | number | Không | Chỉ khi `type` = Exchange |
| `quantity` | number | Có | |

```json
{
  "orderId": 900,
  "type": "Return",
  "reason": "Hàng không đúng mô tả",
  "customerNote": "Khách yêu cầu hoàn tiền",
  "internalNote": null,
  "items": [
    { "variantIdReturned": 101, "variantIdExchanged": null, "quantity": 1 }
  ]
}
```

### Body — `PUT .../{id}/approve`

| Field | Kiểu | Bắt buộc | Ghi chú |
| ----- | ---- | -------- | ------- |
| `refundAmount` | number | Có | Tổng hoàn (Return) |
| `internalNote` | string | Không | |

```json
{
  "refundAmount": 15000000,
  "internalNote": "Đã kiểm tra bill mua"
}
```

### Body — `PUT .../{id}/reject`

| Field | Kiểu | Bắt buộc |
| ----- | ---- | -------- |
| `rejectReason` | string | Không | Nên bắt buộc UI |

```json
{
  "rejectReason": "Quá hạn đổi trả theo policy"
}
```

### Body — `PUT .../{id}/complete`

| Field | Kiểu | Bắt buộc | Ghi chú |
| ----- | ---- | -------- | ------- |
| `items` | array | Có | Xử lý tồn theo từng dòng |
| `internalNote` | string | Không | |

**`items[]`:**

| Field | Kiểu | Bắt buộc | Ghi chú |
| ----- | ---- | -------- | ------- |
| `returnItemId` | number | Có | ID dòng trong phiếu |
| `inventoryAction` | string | Có | `Restock`, `Dispose`, `PendingInspection` |

```json
{
  "items": [
    { "returnItemId": 501, "inventoryAction": "Restock" }
  ],
  "internalNote": "Đã nhập lại kho A"
}
```

---

## Luồng UI gợi ý

### A) Khách yêu cầu

1. Form: chọn đơn, dòng hàng, lý do, loại đổi/ trả → POST.
2. Hiển thị mã phiếu cho khách tra cứu.

### B) Manager

1. Hàng đợi chờ duyệt → Approve (nhập `refundAmount`) hoặc Reject có `rejectReason`.

### C) Kho / hoàn tiền

1. Sau khi duyệt: checklist thu hồn → **Complete** với `items[].inventoryAction`.

---

## UX tối ưu

- Phân quyền UI: tab Manager chỉ hiện với role phù hợp.
- Hiển thị `types` từ API thay vì hard-code.
- Link sang đơn gốc và lịch sử thanh toán nếu hoàn tiền.
