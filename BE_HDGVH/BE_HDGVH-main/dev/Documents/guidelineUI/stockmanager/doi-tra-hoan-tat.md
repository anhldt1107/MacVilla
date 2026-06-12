# Stock Manager — Hoàn tất phiếu đổi / trả

Auth: **StaffAuthenticated** cho list / detail / complete; **ManagerOrAdmin** cho approve / reject (Stock không gọi).

## API Stock dùng


| Method | Path                                                                  | Ghi chú                                 |
| ------ | --------------------------------------------------------------------- | --------------------------------------- |
| GET    | `/api/admin/returns?status=Approved&page&pageSize&customerId&orderId` | Phiếu Manager đã duyệt, chờ kho thu hồi |
| GET    | `/api/admin/returns/{id}`, `/by-number/{ticketNumber}`                | Chi tiết                                |
| PUT    | `/api/admin/returns/{id}/complete`                                    | Hoàn tất phiếu (Stock Manager)          |
| GET    | `/api/admin/returns/statuses`, `/types`                               | Domain constants                        |


### Body — `PUT /{id}/complete` (`AdminReturnCompleteDto`)

Field tiêu biểu (chi tiết xem [admin/doi-tra.md](../admin/doi-tra.md)):


| Field          | Kiểu   | Bắt buộc | Ghi chú                                                    |
| -------------- | ------ | -------- | ---------------------------------------------------------- |
| `internalNote` | string | Không    | Ghi chú kho khi nhập lại                                   |
| `items[]`      | array  | Không    | Override `inventoryAction` cho từng item nếu khác mặc định |


`InventoryAction` áp cho từng item: VD `RestockOnHand` (nhập trở lại tồn bán), `Damaged` (hỏng — không nhập lại), `Discard`. Domain `InventoryActions.All` lấy từ `GET /returns/statuses`.

### Trạng thái

`ReturnTicketStatuses.CanComplete` chỉ chấp nhận `**ItemsReceived`**. Quy trình thường:

```
Approved → Processing → ItemsReceived → Completed
```

Stock Manager chuyển `Approved → Processing → ItemsReceived` (qua API status nếu có; nếu BE chỉ expose `complete`, gọi 1 lần và service tự xử lý).

---

## Luồng UI

### A) Queue phiếu chờ thu hồi

1. Tab "Cần xử lý": filter `status=Approved`.
2. Mở chi tiết → xem `items[]` (variant + quantity), `refundAmount`, `customerNote`.
3. Liên hệ khách / shipper thu hàng (ngoài hệ thống).

### B) Sau khi thu được hàng

1. Cập nhật `internalNote` (VD "Hàng nguyên hộp, không lỗi vật lý").
2. Chọn `inventoryAction` cho từng item:
  - `RestockOnHand` → BE sẽ tạo `InventoryTransaction` type IN gắn `referenceType=Return`.
  - `Damaged` → ghi nhận hỏng, không nhập lại.
3. `PUT /{id}/complete` → trạng thái `Completed`.

### C) Đối chiếu giao dịch kho

`GET /api/admin/inventory-transactions?referenceType=Return&referenceId=<ticketId>` → kiểm IN tự sinh.

## UX

- Stock không thấy nút Approve / Reject (ẩn hoàn toàn).
- Cảnh báo khi `inventoryAction=RestockOnHand` cho item `Damaged` → confirm hai bước.
- Sau Complete: refresh dashboard ([dashboard.md](./dashboard.md)) → `returnsAwaitingCompleteCount` giảm.

