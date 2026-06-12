# Manager — Booking & quầy (`/api/manager`)

## Mục đích

Xử lý **booking thuộc chi nhánh manager**: xem theo khoảng ngày, **chi tiết một ô lưới**, check-in, no-show, thêm dịch vụ vào bill, dời lịch, **walk-in** tại quầy.

## API


| Method | Path                                    | Mô tả                                                    |
| ------ | --------------------------------------- | -------------------------------------------------------- |
| GET    | `/api/manager/bookings/slot-detail`     | Một booking khớp ô `(courtId, date, startTime, endTime)` |
| GET    | `/api/manager/bookings`                 | Danh sách phân trang theo kỳ + `status`                  |
| POST   | `/api/manager/bookings/{id}/check-in`   | CONFIRMED → CHECKED_IN                                   |
| POST   | `/api/manager/bookings/{id}/no-show`    | → `NO_SHOW`                                              |
| POST   | `/api/manager/bookings/{id}/add-items`  | Thêm dịch vụ onsite (`AddItemsRequest`)                  |
| POST   | `/api/manager/bookings/{id}/reschedule` | Dời ngày/giờ/sân (`RescheduleBookingRequest`)            |
| POST   | `/api/manager/bookings`                 | Tạo **walk-in** (`CreateBookingRequest`)                 |


### Query — `GET .../bookings/slot-detail`


| Param                  | Ghi chú                          |
| ---------------------- | -------------------------------- |
| `courtId`              | Bắt buộc                         |
| `date`                 | `yyyy-MM-dd`                     |
| `startTime`, `endTime` | Khớp block lưới (VD 17:00–17:30) |


**404** (hoặc envelope lỗi tương đương): không có booking trong ô / ô trống.

### Query — `GET .../bookings`


| Param                | Mặc định | Ghi chú                                                                               |
| -------------------- | -------- | ------------------------------------------------------------------------------------- |
| `fromDate`, `toDate` | —        | Optional; bỏ cả hai = mọi ngày trong chi nhánh; một ngày → truyền cùng giá trị cả hai |
| `status`             | —        | `BookingStatus` optional                                                              |
| `page`               | 1        |                                                                                       |
| `size`               | 20       | Max 100                                                                               |


### Body — `POST .../add-items`

`AddItemsRequest`:

```json
{
  "items": [
    { "serviceId": 3, "quantity": 2 }
  ]
}
```

### Body — `POST .../reschedule`

`RescheduleBookingRequest`: `newDate`, `newStartTime`, `newCourtId` (bắt buộc). Backend giữ độ dài slot và tính lại giá/cọc theo rule service.

### Body — `POST .../bookings` (walk-in)

`CreateBookingRequest` — **bắt buộc** `guestPhone` (theo mô tả controller); cửa sổ đặt **tối đa 30 ngày**; sân thuộc chi nhánh manager. Response: `CreateBookingResponseDto` (có thể kèm link thanh toán cọc PayOS như luồng thường).

---

## Luồng UI gợi ý

### A) Từ lưới lịch → chi tiết

1. User chọn ô đã book → `GET /bookings/slot-detail`.
2. **Drawer** hiển thị: khách, giờ, sân, tiền, `serviceItems`, trạng thái thanh toán.
3. Hành động theo trạng thái:
  - **CONFIRMED** (hoặc tương đương cho phép): nút **Check-in**, **No-show**, **Dời lịch**, **Thêm đồ uống**.
  - **CHECKED_IN**: tập trung **Add items** + hướng dẫn thanh toán cuối (theo nghiệp vụ app).

### B) Danh sách booking (tab riêng)

1. Filter: preset **Hôm nay** (`fromDate=toDate=today`), **Tuần này**, **Chờ nhận sân** (`status`).
2. Bảng sort theo backend; infinite scroll hoặc phân trang; click row → cùng drawer (có thể gọi lại slot-detail nếu cần đủ `serviceItems`).

### C) Walk-in

1. Form wizard ngắn: Sân + ngày + giờ (hoặc chọn từ ô trống trên lưới) → `price-estimate` preview.
2. `POST /bookings` với `guestPhone` + các field giống customer booking.
3. Hiển thị QR / link cọc nếu response có; nút **「Sao chép link」**.

### D) Reschedule (sự cố)

1. Modal: chọn **ngày mới**, **giờ bắt đầu**, **sân mới** (`newCourtId`).
2. Submit → refresh drawer + lưới.

---

## UX tối ưu

- **Xác nhận hai bước** cho No-show (không hoàn cọc theo policy).
- Sau check-in: badge trạng thái đổi ngay trên lưới (optimistic + rollback nếu lỗi).
- Slot-detail **404**: toast “Ô trống hoặc đã đổi lịch” — refetch timetable.

