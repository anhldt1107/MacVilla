# B2B Store — Báo giá (`/api/store/b2b/quotes`)

## Mục đích

Doanh nghiệp **gửi yêu cầu báo giá** (số lượng lớn), xem **danh sách / chi tiết** báo giá của mình, **chấp nhận**, **từ chối** hoặc **phản hồi thương lượng** (counter-offer) khi báo giá ở trạng thái phù hợp.

**Auth:** **CustomerAuthenticated** (toàn bộ endpoint dưới đây).

**FE:** Swagger `/swagger`. Field JSON (camelCase).

## API


| Method | Path                                       | Mô tả                                           |
| ------ | ------------------------------------------ | ----------------------------------------------- |
| POST   | `/api/store/b2b/quotes/requests`           | Gửi yêu cầu báo giá mới                         |
| GET    | `/api/store/b2b/quotes`                    | Danh sách (phân trang, lọc `status`)            |
| GET    | `/api/store/b2b/quotes/{quoteCode}`        | Chi tiết theo **mã** báo giá                    |
| POST   | `/api/store/b2b/quotes/{id}/accept`        | Chấp nhận (Approved → CustomerAccepted)         |
| POST   | `/api/store/b2b/quotes/{id}/reject`        | Từ chối (Approved → CustomerRejected)           |
| POST   | `/api/store/b2b/quotes/{id}/counter-offer` | Phản hồi thương lượng (Approved → CounterOffer) |


### Query — `GET .../quotes`


| Param      | Mặc định | Ghi chú                     |
| ---------- | -------- | --------------------------- |
| `page`     | 1        |                             |
| `pageSize` | 20       |                             |
| `status`   | —        | Lọc theo trạng thái báo giá |


---

## Body — `POST .../quotes/requests`


| Field   | Kiểu   | Bắt buộc | Ghi chú                                                 |
| ------- | ------ | -------- | ------------------------------------------------------- |
| `items` | array  | Có       | Danh sách dòng — ít nhất 1 phần tử nghiệp vụ thường cần |
| `notes` | string | Không    | Ghi chú / yêu cầu đặc biệt                              |


`**items[]`:**


| Field       | Kiểu   | Bắt buộc |
| ----------- | ------ | -------- |
| `variantId` | number | Có       |
| `quantity`  | number | Có       |


```json
{
  "items": [
    { "variantId": 101, "quantity": 50 },
    { "variantId": 102, "quantity": 20 }
  ],
  "notes": "Cần báo giá lô cho dự án Q2; xuất VAT đủ."
}
```

---

## Body — `POST .../quotes/{id}/reject`


| Field    | Kiểu   | Bắt buộc |
| -------- | ------ | -------- |
| `reason` | string | Không    |


```json
{
  "reason": "Giá không phù hợp ngân sách"
}
```

---

## Body — `POST .../quotes/{id}/counter-offer`


| Field     | Kiểu   | Bắt buộc | Ghi chú                         |
| --------- | ------ | -------- | ------------------------------- |
| `message` | string | Có       | Nội dung đề xuất / thương lượng |
| `items`   | array  | Không    | Điều chỉnh theo dòng (nếu có)   |


`**items[]` (optional):**


| Field              | Kiểu   | Bắt buộc |
| ------------------ | ------ | -------- |
| `variantId`        | number | Có       |
| `desiredQuantity`  | number | Không    |
| `desiredUnitPrice` | number | Không    |


```json
{
  "message": "Đề nghị giảm 5% cho toàn bộ lô và giao trong 2 tuần.",
  "items": [
    {
      "variantId": 101,
      "desiredQuantity": 45,
      "desiredUnitPrice": 14800000
    }
  ]
}
```

`POST .../{id}/accept` không body.

---

## Luồng UI gợi ý

### A) Form yêu cầu báo giá

1. Chọn SKU (từ catalog store hoặc tra cứu variant) → thêm dòng `variantId` + `quantity`.
2. Submit → hiển thị mã / trạng thái từ `data` (theo BE).

### B) Chi tiết báo giá

1. `GET .../{quoteCode}` (lưu ý `quoteCode` có thể chứa ký tự đặc biệt — encode URL nếu cần).
2. Nút hành động theo `status` trả về (chỉ hiện Accept/Reject/Counter khi BE cho phép — nếu gọi sai trạng thái sẽ 400 và `message`).

### C) Counter-offer

1. Modal: textarea `message` + bảng chỉnh `items` tùy chọn → POST counter-offer.

---

## UX tối ưu

- Badge trạng thái đồng bộ với giá trị `status` từ API (không hard-code nhãn nếu BE thêm trạng thái).
- Sau accept: redirect tới luồng hợp đồng / đơn (theo nghiệp vụ) và toast thành công.
- Giữ `quoteCode` trong URL chi tiết để F5 không mất context.

