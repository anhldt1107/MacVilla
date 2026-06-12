# Admin — Giao dịch kho (`/api/admin/inventory-transactions`)

## Mục đích

Xem **lịch sử giao dịch kho** toàn hệ thống (phân trang, lọc) và **tạo giao dịch** thủ công (nhập / xuất / điều chỉnh / giữ / trả giữ).

**Auth:** **WarehouseStaff**.

**FE:** Swagger `/swagger`, OpenAPI `/swagger/v1/swagger.json`. Query/body dùng tên camelCase.

## API


| Method | Path                                     | Mô tả                         |
| ------ | ---------------------------------------- | ----------------------------- |
| GET    | `/api/admin/inventory-transactions`      | Danh sách phân trang + filter |
| GET    | `/api/admin/inventory-transactions/{id}` | Chi tiết                      |
| POST   | `/api/admin/inventory-transactions`      | Tạo giao dịch                 |


### Query — `GET .../inventory-transactions`


| Param                | Mặc định | Ghi chú                 |
| -------------------- | -------- | ----------------------- |
| `page`               | 1        |                         |
| `pageSize`           | 50       |                         |
| `variantId`          | —        | Lọc theo biến thể       |
| `type`               | —        | Loại giao dịch (string) |
| `fromDate`, `toDate` | —        | Khoảng thời gian        |


### Body — `POST .../inventory-transactions`

`InventoryTransactionCreateDto`:

```json
{
  "variantId": 42,
  "transactionType": "IN",
  "quantity": 10,
  "referenceType": "PurchaseOrder",
  "referenceId": "PO-2026-001",
  "notes": "Nhập hàng đợt Tết"
}
```


| Field                           | Ghi chú                                                               |
| ------------------------------- | --------------------------------------------------------------------- |
| `transactionType`               | **IN**, **OUT**, **ADJUST**, **RESERVE**, **RELEASE** (theo mô tả BE) |
| `quantity`                      | Dương cho IN/RESERVE; âm cho OUT/RELEASE; ADJUST có thể ±             |
| `referenceType` / `referenceId` | Optional, chứng từ tham chiếu                                         |
| `notes`                         | Optional, max 1000 ký tự                                              |


BE gắn **người thực hiện** từ JWT (`sub` / `NameIdentifier`); thiếu user → lỗi unauthorized phía service.

---

## Luồng UI gợi ý

### A) Nhật ký kho

1. Mặc định 7 ngày gần nhất (`fromDate`/`toDate`).
2. Click row → drawer chi tiết `GET /{id}`.

### B) Phiếu nhập/xuất tay

1. Wizard: chọn SKU (tra cứu từ `/api/admin/variants`) → chọn loại → nhập số lượng + chứng từ.
2. Submit POST → toast + refresh list.

### C) Liên kết báo giá

Giữ / trả giữ tồn có thể đi qua luồng báo giá (`reserve-inventory` / `release-inventory-reservation`); màn này dùng cho **audit** và thao tác **manual**.

---

## UX tối ưu

- Export CSV (FE build từ trang đã load) nếu cần đối soát — không bắt buộc có API.
- Màu badge theo `transactionType` (IN xanh, OUT đỏ, …).
- Double-submit guard trên POST.

