# Sales — Hợp đồng B2B (`/api/admin/contracts`)

## Mục đích

Sales lập **hợp đồng** từ báo giá **Approved** / **CustomerAccepted** (nếu nghiệp vụ B2B yêu cầu), **gửi khách xác nhận** qua cổng store, theo dõi trạng thái và **hủy** nếu cần.

**Auth:** **StaffAuthenticated** (Sales).

Bảng field đầy đủ: [../admin/hop-dong.md](../admin/hop-dong.md).

## API Sales sử dụng

| Method | Path | Sales dùng khi |
| ------ | ---- | -------------- |
| GET | `/api/admin/contracts?status&customerId&quoteId` | Danh sách theo khách / báo giá |
| GET | `/api/admin/contracts/{id}`, `/by-number/{contractNumber}` | Chi tiết |
| POST | `/api/admin/contracts` | Tạo hợp đồng từ `quoteId`, điều khoản, `validFrom`/`validTo`, file đính kèm |
| PUT | `/api/admin/contracts/{id}` | Sửa (**Draft**) |
| PUT | `/api/admin/contracts/{id}/send-for-customer-confirmation` | Draft → **PendingConfirmation** |
| PUT | `/api/admin/contracts/{id}/cancel` | Hủy (theo điều kiện trạng thái) |
| GET | `/api/admin/contracts/statuses` | Tải `ContractStatuses` |

**Không dùng:** với các hợp đồng không thuộc khách mình phụ trách — team nên quy ước filter `customerId` / `salesId` phía UI (BE chưa chặn).

## Body `POST /contracts` (rút gọn)

| Field | Kiểu | Bắt buộc | Ghi chú |
| ----- | ---- | -------- | ------- |
| `quoteId` | number | Có | Báo giá nguồn |
| `sendForCustomerConfirmation` | boolean | Không | `true` → chuyển thẳng **PendingConfirmation** |
| `validFrom`, `validTo` | string (ISO 8601) | Không | Hạn hiệu lực |
| `terms` | string | Không | Điều khoản |
| `attachmentUrl` | string | Không | Link PDF / scan bản ký |

Tham chiếu JSON đầy đủ: [../admin/hop-dong.md](../admin/hop-dong.md).

## Luồng UI

1. Từ màn **chi tiết báo giá** có nút **Lập hợp đồng** (hiện khi báo giá Approved/CustomerAccepted) → mở form tạo.
2. Tạo Draft → xem lại điều khoản → `PUT /send-for-customer-confirmation`.
3. Theo dõi trạng thái:
   - **Draft** → **PendingConfirmation** → **Confirmed** (khách store xác nhận: [../b2b/hop-dong.md](../b2b/hop-dong.md)) → (tùy BE) **Active**.
4. Khi **Confirmed/Active**: truyền `contractId` vào [bao-gia.md → convert-to-order](./bao-gia.md).
5. Nếu khách huỷ / không phản hồi → `PUT /cancel`.

## UX

- Badge màu theo `ContractStatuses`.
- Disable **Sửa** khi không còn ở **Draft**.
- Link ngược về báo giá nguồn (`quoteCode`) và sang đơn sau convert.
