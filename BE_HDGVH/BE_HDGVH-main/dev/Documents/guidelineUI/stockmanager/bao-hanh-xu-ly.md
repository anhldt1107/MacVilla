# Stock Manager — Xử lý bảo hành

Auth: **StaffAuthenticated**.

Field đầy đủ: [../admin/bao-hanh.md](../admin/bao-hanh.md).

## API

### Phiếu bảo hành — `/api/admin/warranty-tickets`


| Method | Path                                                          | Ghi chú                                 |
| ------ | ------------------------------------------------------------- | --------------------------------------- |
| GET    | `/api/admin/warranty-tickets?page&pageSize&status&customerId` | List                                    |
| GET    | `/api/admin/warranty-tickets/{id}`                            | Chi tiết theo ID                        |
| GET    | `/api/admin/warranty-tickets/by-number/{ticketNumber}`        | Chi tiết theo mã                        |
| POST   | `/api/admin/warranty-tickets`                                 | Tạo phiếu (thường khi nhận BH tại quầy) |
| POST   | `/api/admin/warranty-tickets/{id}/claims`                     | Thêm claim mới vào phiếu                |
| GET    | `/api/admin/warranty-tickets/statuses`                        | Constants                               |


### Claim — `/api/admin/warranty-claims`


| Method | Path                                     | Ghi chú                                |
| ------ | ---------------------------------------- | -------------------------------------- |
| GET    | `/api/admin/warranty-claims/{id}`        | Chi tiết claim                         |
| PUT    | `/api/admin/warranty-claims/{id}/status` | **Stock cập nhật tiến trình kỹ thuật** |


### Body — `PUT /warranty-claims/{id}/status` (`AdminWarrantyClaimUpdateStatusDto`)


| Field          | Kiểu     | Bắt buộc | Ghi chú                           |
| -------------- | -------- | -------- | --------------------------------- |
| `status`       | string   | Có       | Thuộc `WarrantyClaimStatuses.All` |
| `resolution`   | string   | Không    | Kết luận / hành động (sửa, thay)  |
| `resolvedDate` | ISO 8601 | Không    | Ngày hoàn tất                     |
| `note`         | string   | Không    | Ghi chú nội bộ                    |


### Quy luật trạng thái — `WarrantyClaimStatuses.CanTransition`

```
Pending_Check → Checking | Cancelled
Checking      → Confirmed_Defect | Rejected | Cancelled
Confirmed_Defect → Repairing | Cancelled
Repairing     → Waiting_Pickup
Waiting_Pickup → Completed
```

`CanUpdate` = không phải `Completed/Rejected/Cancelled`.

---

## Luồng UI

### A) Tiếp nhận

1. List phiếu `status=Active` + claim `status=Pending_Check` → bắt đầu kiểm tra.
2. `PUT /warranty-claims/{id}/status` → `Checking`.

### B) Sau kiểm tra

- Có lỗi: `Checking → Confirmed_Defect`.
- Không có lỗi / lỗi do người dùng: `Checking → Rejected` (kèm `resolution` giải thích).

### C) Sửa chữa / thay thế

1. `Confirmed_Defect → Repairing`.
2. Nếu cần linh kiện: tạo `InventoryTransaction` type `OUT` với `referenceType=Warranty`, `referenceId=<claimId>` ([ton-kho-va-giao-dich.md](./ton-kho-va-giao-dich.md)).
3. Sau khi hoàn tất sửa: `Repairing → Waiting_Pickup` + `resolution` + `resolvedDate`.

### D) Trả khách

1. Khi khách nhận hàng: `Waiting_Pickup → Completed`.
2. Refetch chi tiết để đảm bảo timeline + DB cập nhật.

## UX

- Hiển thị `claim.imagesUrl` (URL phẩy phẩy nhau) nếu khách gửi hình.
- Cấm sửa khi `CanUpdate=false` (status đã Completed/Rejected/Cancelled).
- Chip màu theo status; thanh tiến độ 6 bước.
- Khi tạo OUT cho linh kiện, prefill `referenceType=Warranty` + `referenceId=<claimId>`.

