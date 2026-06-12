# Admin — Fulfillment / phiếu xuất kho (`/api/admin/fulfillments`, `/api/admin/orders/.../fulfillments`)

## Mục đích

Quản lý **phiếu xuất kho**: danh sách, chi tiết, tạo theo đơn, đổi trạng thái, gán worker. Hỗ trợ vận hành kho sau khi đơn ở trạng thái phù hợp.

**Auth:** **`GET`** (danh sách, chi tiết, `statuses`) — **`StaffAuthenticated`** (Sales xem được). **`POST`** tạo phiếu theo đơn, **`PUT`** status / assign — **`WarehouseStaff`**.

**FE:** Swagger `/swagger`, OpenAPI `/swagger/v1/swagger.json`. Field JSON (camelCase).

## API — Phiếu (global)

Base: `/api/admin/fulfillments`

| Method | Path | Policy | Mô tả |
| ------ | ---- | ------ | ----- |
| GET | `/api/admin/fulfillments` | StaffAuthenticated | Danh sách phân trang |
| GET | `/api/admin/fulfillments/{id}` | StaffAuthenticated | Chi tiết phiếu + đơn |
| PUT | `/api/admin/fulfillments/{id}/status` | WarehouseStaff | Cập nhật trạng thái |
| PUT | `/api/admin/fulfillments/{id}/assign` | WarehouseStaff | Gán worker |
| GET | `/api/admin/fulfillments/statuses` | StaffAuthenticated | Enum / danh sách trạng thái |

### Query — `GET .../fulfillments`

| Param | Mặc định | Ghi chú |
| ----- | -------- | ------- |
| `page` | 1 | |
| `pageSize` | 20 | |
| `status` | — | Lọc trạng thái phiếu |
| `orderId` | — | Lọc theo đơn |
| `assignedWorkerId` | — | Lọc theo người được gán |

### Body — `PUT .../{id}/status`

| Field | Kiểu | Bắt buộc | Ghi chú |
| ----- | ---- | -------- | ------- |
| `status` | string | Có | Pending → Picking → Packed → Shipped |
| `notes` | string | Không | Max 1000 |

```json
{
  "status": "Picking",
  "notes": "Đang lấy hàng kệ B12"
}
```

### Body — `PUT .../{id}/assign`

| Field | Kiểu | Bắt buộc |
| ----- | ---- | -------- |
| `workerId` | number | Có | ID nhân viên kho |

```json
{
  "workerId": 7
}
```

---

## API — Tạo phiếu theo đơn

Base: `/api/admin/orders/{orderId}/fulfillments`

| Method | Path | Policy | Mô tả |
| ------ | ---- | ------ | ----- |
| POST | `.../fulfillments` | WarehouseStaff | Tạo phiếu xuất cho đơn |

### Body — `POST .../fulfillments`

| Field | Kiểu | Bắt buộc | Ghi chú |
| ----- | ---- | -------- | ------- |
| `ticketType` | string | Không | Max 100 |
| `notes` | string | Không | Max 1000 |

```json
{
  "ticketType": "Standard",
  "notes": "Gói hàng cẩn thận"
}
```

Người tạo phiếu BE lấy từ JWT.

---

## Luồng UI gợi ý

### A) Hàng đợi kho

1. Tab “Chờ xử lý”: filter `status=Pending` (hoặc tương đương).
2. Row → chi tiết; nút **Gán tôi** → `assign` với worker = current user nếu BE cho phép.

### B) Chi tiết đơn → tạo phiếu

1. Từ màn đơn (`don-hang.md`), khi trạng thái cho phép xuất → `POST /orders/{orderId}/fulfillments`.
2. Chuyển sang màn fulfillment chi tiết để **Picking → Packed → Shipped**.

### C) Đồng bộ trạng thái

1. Sau `Shipped`, có thể cần đồng bộ với trạng thái đơn (theo nghiệp vụ BE — kiểm tra response đơn).

---

## UX tối ưu

- Kanban theo `status` nếu team kho quen visual.
- SLA badge (thời gian từ tạo phiếu).
- Lỗi 401 “không xác định user”: đảm bảo token có claim `sub` parse được sang int (theo code BE).
