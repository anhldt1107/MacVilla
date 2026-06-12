# Customer — Bảo hành (`/api/store/me/warranty-tickets`)

Auth: **CustomerAuthenticated**. Service share với B2B ([../b2b/bao-hanh.md](../b2b/bao-hanh.md)).

## API

| Method | Path |
| ------ | ---- |
| GET | `/api/store/me/warranty-tickets?page&pageSize&status` |
| GET | `/api/store/me/warranty-tickets/{ticketNumber}` |
| POST | `/api/store/me/warranty-tickets` |

### Body — `POST warranty-tickets` (`StoreB2BWarrantyClaimCreateDto`)

| Field | Kiểu | Bắt buộc | Ghi chú |
| ----- | ---- | -------- | ------- |
| `warrantyTicketId` | number | Không | Nếu đã có phiếu — thêm claim vào phiếu |
| `orderId` | number | Không | Nếu chưa có phiếu — BE tạo phiếu 12 tháng từ order + claim đầu tiên |
| `variantId` | number | Có | SKU cần bảo hành |
| `defectDescription` | string | Có | Mô tả lỗi |
| `imagesUrl` | string | Không | URL ảnh / chứng từ (nhiều URL cách nhau bằng dấu phẩy) |

Phải gửi **một trong** `warrantyTicketId` hoặc `orderId`. BE kiểm:

- Phiếu phải thuộc khách đang đăng nhập.
- Phiếu còn hạn (`WarrantyTicketStatuses.Active` và `ValidUntil` còn hiệu lực).
- `WarrantyTicketStatuses.CanCreateClaim(status)`.

Lỗi thường gặp: **400** mô tả không hợp lệ, **404** không tìm thấy ticket/order, **409** phiếu hết hạn.

### Response — `StoreB2BWarrantyClaimResponseDto`

| Field | Kiểu |
| ----- | ---- |
| `id`, `warrantyTicketId`, `variantId` | number |
| `ticketNumber`, `sku`, `variantName` | string |
| `defectDescription` | string \| null |
| `status` | string (bắt đầu `Pending_Check`) |
| `createdAt` | ISO 8601 |
| `message` | string |

### Response list — `PagedResultDto<StoreB2BWarrantyTicketListItemDto>`

`items[]`:

| Field | Kiểu | Ghi chú |
| ----- | ---- | ------- |
| `id` | number | |
| `ticketNumber` | string | |
| `issueDate` | ISO 8601 | |
| `validUntil` | ISO 8601 \| null | Hết hạn bảo hành |
| `status` | string | `Active` / `Expired` / … |
| `claimCount` | number | Tổng claim trên phiếu |
| `pendingClaimCount` | number | Claim đang chờ xử lý |
| `orderId`, `orderCode` | number\|null / string\|null | |
| `contractId`, `contractNumber` | number\|null / string\|null | (B2C thường `null`) |

### Response detail — `StoreB2BWarrantyTicketDetailDto`

| Field | Kiểu | Ghi chú |
| ----- | ---- | ------- |
| `id`, `ticketNumber` | number / string | |
| `issueDate`, `validUntil` | ISO 8601 / ISO 8601\|null | |
| `status` | string | |
| `isValid` | boolean | Còn hiệu lực bảo hành |
| `daysRemaining` | number \| null | Số ngày còn lại |
| `order` | `StoreB2BWarrantyOrderDto` \| null | `id`, `orderCode`, `createdAt` |
| `contract` | `StoreB2BWarrantyContractDto` \| null | `id`, `contractNumber` |
| `claims[]` | `StoreB2BWarrantyClaimDto[]` | Chi tiết bên dưới |

`claims[]` (`StoreB2BWarrantyClaimDto`):

| Field | Kiểu | Ghi chú |
| ----- | ---- | ------- |
| `id`, `variantId` | number | |
| `sku`, `variantName`, `productName` | string | |
| `imageUrl` | string \| null | |
| `defectDescription`, `imagesUrl` | string \| null | |
| `status` | string | `Pending_Check`, `Checking`, `Approved`, `Repaired`, `Replaced`, `Rejected`, … |
| `createdAt` | ISO 8601 | |
| `resolvedDate` | ISO 8601 \| null | |
| `resolution` | string \| null | Kết luận / giải pháp |

## Luồng UI

1. Từ **chi tiết đơn đã Delivered**: nút **Yêu cầu bảo hành** → dialog chọn SKU + mô tả lỗi → `POST warranty-tickets` với `orderId`.
2. Tab **Bảo hành của tôi**: list phiếu + `pendingClaimCount` badge; mở chi tiết xem tiến trình từng `claim.status`.
3. Nếu phát hiện lỗi mới trên cùng đơn → gửi claim bổ sung với `warrantyTicketId` (tái dùng phiếu cũ).

## UX

- Cảnh báo khi phiếu sắp hết hạn (`daysRemaining` < 30).
- Upload ảnh/chứng từ: FE dùng dịch vụ upload của khách (chưa có endpoint upload customer trong BE). Với hiện trạng: paste URL công khai vào `imagesUrl`.
