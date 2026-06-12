# B2B Store — Hợp đồng (`/api/store/b2b/contracts`)

## Mục đích

Doanh nghiệp xem **danh sách / chi tiết hợp đồng** của mình và **xác nhận hợp đồng** khi ở trạng thái chờ khách (`PendingConfirmation` → `Confirmed` theo mô tả controller).

**Auth:** **CustomerAuthenticated**.

**FE:** Swagger `/swagger`. Field JSON (camelCase).

## API


| Method | Path                                        | Mô tả                         |
| ------ | ------------------------------------------- | ----------------------------- |
| GET    | `/api/store/b2b/contracts`                  | Danh sách phân trang          |
| GET    | `/api/store/b2b/contracts/{contractNumber}` | Chi tiết theo **mã** hợp đồng |
| POST   | `/api/store/b2b/contracts/{id}/confirm`     | Khách xác nhận                |


### Query — `GET .../contracts`


| Param      | Mặc định | Ghi chú        |
| ---------- | -------- | -------------- |
| `page`     | 1        |                |
| `pageSize` | 20       |                |
| `status`   | —        | Lọc trạng thái |


---

## Body — `POST .../contracts/{id}/confirm`

Body **optional** (`StoreB2BContractConfirmDto` có thể null).


| Field   | Kiểu   | Bắt buộc | Ghi chú              |
| ------- | ------ | -------- | -------------------- |
| `notes` | string | Không    | Ghi chú khi xác nhận |


```json
{
  "notes": "Xác nhận theo email pháp chế ngày 18/04/2026"
}
```

Hoặc gửi body rỗng `{}` / không gửi body tùy client (BE chấp nhận `dto` null).

---

## Luồng UI gợi ý

### A) Danh sách hợp đồng

1. Filter `status` = chờ xác nhận / đang hiệu lực (theo preset UI).
2. Click row → chi tiết theo `contractNumber` (path param là string).

### B) Xem trước đính kèm

1. Chi tiết có `attachmentUrl` → nút mở PDF / tải về (tab mới).

### C) Xác nhận

1. Confirm hai bước → `POST .../confirm` với `notes` tùy chọn.
2. Refresh chi tiết; hiển thị `customerConfirmedAt` nếu có trong `data`.

---

## UX tối ưu

- Hiển thị rõ **mã báo giá gốc** (`quoteCode` trong list/detail) để user đối chiếu.
- Nếu BE trả lỗi trạng thái không cho phép confirm: toast + không đổi optimistic UI.

