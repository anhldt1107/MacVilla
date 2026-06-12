# Tích hợp FE — Trợ lý Gemini (Admin/Manager/Sales + Khách B2B + Khách B2C)

Tài liệu **độc lập** cho FE. Thay `{BASE_URL}` bằng origin BE (vd `https://api.example.com`).

3 endpoint chat dành cho 3 nhóm caller; payload và envelope giống nhau.

---

## 1. Auth & header


| Header          | Giá trị            |
| --------------- | ------------------ |
| `Authorization` | `Bearer <jwt>`     |
| `Content-Type`  | `application/json` |


JWT lấy từ:

- Staff: `POST /api/Auth/login` → dùng cho `/api/admin/ai/`*.
- Khách B2C: `POST /api/store/auth/login` → dùng cho `/api/store/ai/`*.
- Khách B2B: `POST /api/store/b2b/auth/login` → dùng cho `/api/store/b2b/ai/`*.

Sai endpoint so với loại tài khoản (vd. khách B2B gọi vào `/api/store/ai/...`) sẽ bị `401/403`.

---

## 2. Envelope chuẩn

```json
{
  "success": true,
  "data": {},
  "message": "OK"
}
```

Khi lỗi:

```json
{
  "success": false,
  "data": null,
  "message": "Thông báo lỗi",
  "errorCode": "VALIDATION_ERROR"
}
```

JSON property là **camelCase**.

---

## 3. Endpoint tổng hợp


| #       | Method       | URL                                                            | Mô tả                                     |
| ------- | ------------ | -------------------------------------------------------------- | ----------------------------------------- |
| 3.1     | POST         | `{BASE_URL}/api/admin/ai/chat`                                 | Staff (Admin/Manager/Sales) hỏi assistant |
| 3.2     | GET          | `{BASE_URL}/api/admin/ai/threads`                              | Danh sách phiên (paged)                   |
| 3.3     | GET          | `{BASE_URL}/api/admin/ai/threads/{id}/messages`                | Toàn bộ message của 1 phiên               |
| 3.4     | DELETE       | `{BASE_URL}/api/admin/ai/threads/{id}`                         | Xóa phiên                                 |
| 4.1     | POST         | `{BASE_URL}/api/store/b2b/ai/chat`                             | Khách B2B chat                            |
| 4.2-4.4 | GET / DELETE | `.../threads`, `.../threads/{id}/messages`, `.../threads/{id}` | Như trên                                  |
| 5.1     | POST         | `{BASE_URL}/api/store/ai/chat`                                 | Khách B2C chat                            |
| 5.2-5.4 | GET / DELETE | `.../threads`, `.../threads/{id}/messages`, `.../threads/{id}` | Như trên                                  |


---

## 4. POST chat — request / response

### Request body (chung)

```json
{
  "threadId": null,
  "message": "Tuần này doanh thu thế nào? Có ai sắp quá hạn không?"
}
```


| Trường     | Bắt buộc | Mô tả                                                      |
| ---------- | -------- | ---------------------------------------------------------- |
| `threadId` | Không    | Null khi mở phiên mới; truyền lại id để tiếp tục phiên cũ. |
| `message`  | Có       | Tin nhắn của user, max 4000 ký tự.                         |


### Response thành công

```json
{
  "success": true,
  "message": "OK",
  "data": {
    "threadId": 42,
    "assistantMessage": "Tuần này doanh thu ròng 187,650,000 VND, tăng so với tuần trước. Có 2 hóa đơn quá hạn của KH B2B 2 và B2B 3...",
    "toolsUsed": [
      { "toolName": "get_revenue_overview",  "latencyMs": 480, "success": true },
      { "toolName": "get_ar_top_debtors",    "latencyMs": 320, "success": true }
    ],
    "attachments": [],
    "tokensIn": 4128,
    "tokensOut": 215,
    "latencyMs": 4221
  }
}
```

`toolsUsed` cho phép FE hiển thị **chip / badge** "đã gọi tool X" để user biết nguồn dữ liệu.

`attachments[]` chứa **structured cards** (sản phẩm / đơn) để FE render UI giàu kèm text. Khi Gemini gọi `search_products` / `get_my_orders` / `get_order_by_code`, BE tự build cards từ data thật (ảnh + link). Chi tiết schema và mẫu render React xem `[fe_integration_ai_chat_attachments.md](fe_integration_ai_chat_attachments.md)`. Lượt chat không tạo card → `attachments: []`.

### Response lỗi (ví dụ)

```json
{
  "success": false,
  "data": null,
  "message": "Vui lòng nhập nội dung.",
  "errorCode": "VALIDATION_ERROR",
  "errors": { "Message": ["Vui lòng nhập nội dung."] }
}
```

Lỗi đặc thù khác:


| Tình huống                           | message                                             | errorCode |
| ------------------------------------ | --------------------------------------------------- | --------- |
| Chưa cấu hình `GEMINI_API_KEY`       | "Chưa cấu hình GEMINI_API_KEY."                     | (500)     |
| Thread không thuộc user              | "Phiên chat không thuộc về bạn."                    | (403)     |
| Sai loại tài khoản (B2C gọi vào B2B) | "Endpoint này chỉ dành cho khách doanh nghiệp B2B." | (403)     |


---

## 5. GET threads — danh sách phiên

`GET {BASE_URL}/api/admin/ai/threads?page=1&pageSize=20`

```json
{
  "success": true,
  "message": "OK",
  "data": {
    "items": [
      {
        "id": 42,
        "role": "Manager",
        "title": "Tuần này doanh thu thế nào?",
        "createdAt": "2026-04-25T13:10:00Z",
        "updatedAt": "2026-04-25T13:14:11Z",
        "messageCount": 6,
        "lastMessagePreview": "Đề xuất gửi nhắc nợ cho B2B 2..."
      }
    ],
    "totalCount": 1,
    "page": 1,
    "pageSize": 20
  }
}
```

`title` được tự sinh từ ~60 ký tự đầu của message đầu tiên.

---

## 6. GET messages — chi tiết 1 phiên

`GET {BASE_URL}/api/admin/ai/threads/42/messages`

```json
{
  "success": true,
  "message": "OK",
  "data": [
    { "id": 101, "messageRole": "user", "content": "Tuần này doanh thu thế nào?", "createdAt": "2026-04-25T13:10:00Z" },
    { "id": 102, "messageRole": "assistant", "toolName": "get_revenue_overview", "toolArgsJson": "{\"fromDate\":\"2026-04-19\",\"toDate\":\"2026-04-25\"}", "createdAt": "2026-04-25T13:10:01Z" },
    { "id": 103, "messageRole": "tool", "toolName": "get_revenue_overview", "toolResultJson": "{\"data\":{...}}", "createdAt": "2026-04-25T13:10:02Z" },
    { "id": 104, "messageRole": "assistant", "content": "Tuần này doanh thu ròng 187,650,000 VND...", "createdAt": "2026-04-25T13:10:03Z" }
  ]
}
```

Mỗi message có `messageRole`:


| messageRole                                | Khi nào FE hiển thị                                                 |
| ------------------------------------------ | ------------------------------------------------------------------- |
| `user`                                     | Khung phải, content user gõ                                         |
| `assistant` (có `content`)                 | Khung trái, text chính                                              |
| `assistant` (có `toolName`, không content) | Tooltip / chip mờ "đang lấy dữ liệu từ Z" — không bắt buộc hiển thị |
| `tool`                                     | Ẩn theo mặc định, chỉ hiện trong panel debug                        |


FE chỉ cần hiện `user` + `assistant text`; còn lại là metadata.

---

## 7. DELETE thread

`DELETE {BASE_URL}/api/admin/ai/threads/42`

```json
{
  "success": true,
  "message": "Đã xóa phiên chat."
}
```

Xóa cascade toàn bộ messages.

---

## 8. Bảng tools mỗi nhóm caller (tham chiếu)


| Caller          | Tool có sẵn                                                                                                                                                                                                                                                                                                                                                                                                                    |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Admin / Manager | `get_revenue_overview`, `get_revenue_timeseries`, `get_revenue_by_payment_method`, `get_revenue_by_channel`, `get_ar_summary`, `get_ar_aging`, `get_ar_top_debtors`, `get_ar_timeseries`, `get_sales_funnel`, `get_quotes_expiring_soon`, `get_inventory_overview`, `get_inventory_low_stock`, `get_inventory_days_of_cover`, `get_inventory_top_moving`, `get_order_status_breakdown`, `get_late_orders`, `get_order_by_code` |
| Sales           | Như Manager nhưng tự lọc theo `salesId` của user                                                                                                                                                                                                                                                                                                                                                                               |
| Khách B2B       | `get_my_orders`, `get_my_order_by_code`, `get_my_order_timeline`, `get_my_debt_summary`, `get_my_invoices`, `get_my_invoice_by_number`, `get_my_quotes`, `get_my_quote_by_code`, `search_products`, `get_categories`                                                                                                                                                                                                           |
| Khách B2C       | `get_my_orders`, `get_my_order_by_code`, `get_my_order_timeline`, `search_products`, `get_categories`                                                                                                                                                                                                                                                                                                                          |


FE không cần biết schema từng tool — Gemini tự gọi. FE chỉ hiển thị tên tool ở `toolsUsed`.

---

## 9. Lưu ý vận hành

- **Streaming**: chưa hỗ trợ — request đồng bộ. Latency 1 lượt thường 2-6s tùy số tool gọi.
- **PII**: với khách B2B/B2C, BE redact email/SĐT trong tool result trước khi gửi Gemini (`[REDACTED_EMAIL]` / `[REDACTED_PHONE]`).
- **Quota**: chưa giới hạn ở MVP — FE nên debounce nút gửi và disable trong khi chờ.
- **Lỗi gọi Gemini**: BE trả về 500 với message bắt đầu bằng "Gemini gọi thất bại" — FE nên catch và toast.
- **Lưu trữ**: mọi tin nhắn (user/assistant/tool) được lưu trong DB; kéo lên là lấy được lịch sử.
- **History window**: BE chỉ nạp 30 tin gần nhất vào ngữ cảnh; phiên dài hơn vẫn xem được nhưng Gemini "quên" tin cũ.

---

## 10. UI patterns đề xuất

### 10.1 Vị trí trợ lý trên từng app


| Actor             | Vị trí gợi ý                                                                                   | Ghi chú                           |
| ----------------- | ---------------------------------------------------------------------------------------------- | --------------------------------- |
| Admin / Manager   | Panel phải cố định trên màn dashboard (collapsible 360-420px) HOẶC FAB góc phải-dưới mở drawer | Dùng song song khi đang xem chart |
| Sales             | FAB góc phải-dưới + shortcut từ trang "Báo giá của tôi" / "Đơn của tôi"                        | Gắn nhanh để hỏi pipeline cá nhân |
| Khách B2B (store) | Nút chat tròn góc phải-dưới có badge khi có hóa đơn quá hạn                                    | Không che CTA chính của trang     |
| Khách B2C (store) | Cùng vị trí (góc phải-dưới). Có thể ẩn cho khách chưa login (sẽ bị 401)                        | Mở popup tra đơn / hỏi sản phẩm   |


### 10.2 Anatomy màn chat

```
┌──────────────────────────────────────────┐
│  Header: "Trợ lý ..." | [x] đóng         │
├───────────┬──────────────────────────────┤
│ Sidebar   │ Messages (cuộn dọc)          │
│ threads   │  ┌────────────────────┐      │
│ (staff)   │  │ user message       │ →    │
│ - phiên 1 │  └────────────────────┘      │
│ - phiên 2 │  ┌────────────────────┐      │
│ + new     │  │ assistant text     │      │
│           │  │ chip: doanh thu... │      │
│           │  └────────────────────┘      │
├───────────┴──────────────────────────────┤
│  [textarea ............ ] [gửi]          │
└──────────────────────────────────────────┘
```

- **Khách (B2B/B2C)** thường **single-thread** — bỏ sidebar, mỗi lần mở là 1 phiên đang dùng (lấy thread mới nhất từ `GET threads`, fallback tạo mới khi gửi tin).
- **Staff** **multi-thread** — cần sidebar list `threads`, nút "+ Phiên mới".

### 10.3 Hiển thị `toolsUsed`

Bên dưới mỗi bubble assistant text có dùng tool, render dạng **chip nhỏ, mờ**:

```
[ Đã xem: doanh thu (480ms) ]   [ Top khách nợ (320ms) ]
```

Map kỹ thuật → tiếng Việt thân thiện:


| `toolName`                      | Nhãn FE hiển thị              |
| ------------------------------- | ----------------------------- |
| `get_revenue_overview`          | "Doanh thu tổng quan"         |
| `get_revenue_timeseries`        | "Doanh thu theo thời gian"    |
| `get_revenue_by_payment_method` | "Theo phương thức thanh toán" |
| `get_revenue_by_channel`        | "B2C / B2B"                   |
| `get_ar_summary`                | "Công nợ tổng quan"           |
| `get_ar_aging`                  | "Tuổi nợ"                     |
| `get_ar_top_debtors`            | "Top khách nợ"                |
| `get_ar_timeseries`             | "Công nợ theo thời gian"      |
| `get_sales_funnel`              | "Phễu báo giá"                |
| `get_quotes_expiring_soon`      | "Báo giá sắp hết hạn"         |
| `get_inventory_overview`        | "Tồn kho tổng quan"           |
| `get_inventory_low_stock`       | "Tồn thấp"                    |
| `get_inventory_days_of_cover`   | "Ngày tồn còn bán"            |
| `get_inventory_top_moving`      | "SKU bán chạy"                |
| `get_order_status_breakdown`    | "Trạng thái đơn"              |
| `get_late_orders`               | "Đơn trễ"                     |
| `get_order_by_code`             | "Tra đơn"                     |
| `get_my_orders`                 | "Đơn của tôi"                 |
| `get_my_order_by_code`          | "Đơn theo mã"                 |
| `get_my_order_timeline`         | "Tiến độ đơn"                 |
| `get_my_invoices`               | "Hóa đơn của tôi"             |
| `get_my_invoice_by_number`      | "Hóa đơn theo số"             |
| `get_my_debt_summary`           | "Công nợ của tôi"             |
| `get_my_quotes`                 | "Báo giá của tôi"             |
| `get_my_quote_by_code`          | "Báo giá theo mã"             |
| `search_products`               | "Tìm sản phẩm"                |
| `get_categories`                | "Danh mục"                    |


### 10.4 Loading / typing indicator

- Khi vừa gửi `POST chat`: hiển thị bubble "Đang xử lý..." có 3 chấm nháy.
- Nếu request kéo dài >2s: đổi thành "Đang lấy dữ liệu, vui lòng chờ..." — vì lúc này thường Gemini đang gọi tool (FE chưa biết chính xác tool nào, vì response cuối mới có `toolsUsed`).

> Đề xuất nâng cấp về sau: stream qua SSE để hiển thị từng tool đang chạy (chưa có ở MVP).

### 10.5 Microcopy


| Vị trí                       | Văn bản                                                             |
| ---------------------------- | ------------------------------------------------------------------- |
| Header (Manager/Admin)       | "Trợ lý quản lý"                                                    |
| Header (Sales)               | "Trợ lý của tôi"                                                    |
| Header (B2B)                 | "Trợ lý chăm sóc khách hàng"                                        |
| Header (B2C)                 | "Hỗ trợ tra đơn"                                                    |
| Placeholder input (staff)    | "Hỏi về doanh thu, công nợ, tồn kho..."                             |
| Placeholder input (B2B)      | "Hỏi về đơn hàng, hóa đơn, công nợ..."                              |
| Placeholder input (B2C)      | "Bạn cần tra đơn hay tìm sản phẩm gì?"                              |
| Empty state (staff)          | "Bạn có thể bắt đầu bằng:" + danh sách suggested prompts (xem 11.x) |
| Lỗi 500 Gemini               | Toast: "Trợ lý đang bận, bạn thử lại trong giây lát."               |
| Lỗi 401/403                  | Toast: "Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại."           |
| Disable nút gửi khi đang chờ | Tooltip: "Đang chờ phản hồi..."                                     |


### 10.6 Persistence UX

- Khi user mở app/store → gọi `GET threads?page=1&pageSize=1` lấy phiên gần nhất.
  - Nếu có và `updatedAt` < 24h: tự load tiếp phiên đó (`GET threads/{id}/messages`).
  - Nếu không hoặc cũ hơn: empty state, không tạo thread cho đến khi user gửi tin đầu tiên.
- Staff multi-thread: render sidebar từ `GET threads?page=1&pageSize=20`. Nút "+ Phiên mới" reset state, KHÔNG gọi API tạo thread (BE tự tạo khi `threadId = null`).
- DELETE thread: confirm dialog "Bạn chắc chắn xóa phiên này?".

### 10.7 Render assistant message

- BE trả Markdown thuần (có thể có **bold**, list, bảng nhỏ) → FE nên dùng renderer Markdown an toàn (sanitize HTML, disallow script).
- Số tiền VND trong text đã có dấu phân tách của Gemini — **không** cần format lại.
- Link / mã đơn (vd `DEMO-O-B2B-05`) — FE có thể tự nhận pattern và biến thành link đến trang chi tiết đơn (nâng cao, không bắt buộc).

### 10.8 Mobile / responsive

- Mobile: full-screen drawer trượt từ phải hoặc bottom-sheet 90% chiều cao. Sidebar threads ẩn dưới nút hamburger.
- Desktop: panel cố định 360-420px hoặc drawer.

### 10.9 PII

- Khi caller là khách (B2B/B2C), BE **đã** redact email/SĐT lạ trong tool result → FE chỉ cần render text Gemini trả là đủ. Không thêm bước che PII.

---

## 11. Use case theo actor (suggested prompts + kịch bản)

Mỗi actor cần một **empty state** hiển thị 3-4 prompt mẫu (clickable → tự gửi). Dưới đây là gợi ý:

### 11.1 Admin / Manager

**Suggested prompts (chip clickable):**

- "Tuần này có gì bất thường?"
- "Top 5 khách nợ nhiều nhất"
- "SKU nào sắp hết hàng?"
- "So sánh doanh thu tuần này với tuần trước"

**Kịch bản 1 — Tổng quan đầu ngày:**

```
User: Tuần này có gì bất thường?
Bot:  (gọi get_revenue_overview + get_ar_summary + get_late_orders)
      "Tuần này doanh thu ròng 187tr (giảm 8% so với tuần trước).
       Có 3 hóa đơn quá hạn (tổng 18.5tr) và 1 đơn DEMO-O-B2B-05
       đã ở ReadyToShip 8 ngày — vượt SLA 72h.
       → Đề xuất: nhắc nợ KH B2B 2 và đẩy đơn B2B-05 sang Shipped."
```

**Kịch bản 2 — Soạn email nhắc nợ:**

```
User: Soạn giúp tôi mail nhắc nợ cho khách nợ nhiều nhất.
Bot:  (gọi get_ar_top_debtors)
      "Khách nợ nhiều nhất: Công ty TNHH ABC, 25tr (3 hóa đơn).
       Bản nháp:
       Kính gửi anh/chị tại Công ty TNHH ABC, ..."
```

### 11.2 Sales

**Suggested prompts:**

- "Báo giá nào của tôi sắp hết hạn?"
- "Tôi đang ở bước nào trong pipeline?"
- "Đơn DEMO-O-B2B-05 đang ở đâu?"
- "Doanh thu tôi đóng góp tháng này"

**Kịch bản — Theo dõi pipeline cá nhân:**

```
User: Báo giá nào của tôi sắp hết hạn?
Bot:  (gọi get_quotes_expiring_soon — tự lọc salesId = self)
      "2 báo giá Approved sắp hết hạn:
       - DEMO-Q-006 (KH B2B 4) — còn 3 ngày, 11.5tr
       - DEMO-Q-007 (KH B2B 5) — còn 1 ngày, 8tr
       → Bạn nên gọi khách trước khi báo giá hết hiệu lực."
```

### 11.3 Khách B2B

**Suggested prompts:**

- "Tôi còn nợ bao nhiêu?"
- "Đơn ORD-... đang ở đâu?"
- "Hóa đơn nào sắp đến hạn?"
- "Báo giá QT-... đã được duyệt chưa?"

**Kịch bản 1 — Tra công nợ:**

```
User: Tôi còn nợ bao nhiêu?
Bot:  (gọi get_my_debt_summary)
      "Hiện công ty bạn còn nợ tổng 75.6tr (8 hóa đơn).
       Trong đó 18.5tr quá hạn (3 HĐ). Sắp đến hạn 7 ngày tới: 12.3tr.
       Bạn muốn xem chi tiết hóa đơn nào không?"
```

**Kịch bản 2 — Tra đơn:**

```
User: Đơn DEMO-O-B2B-01 giao đến đâu rồi?
Bot:  (gọi get_my_order_timeline)
      "Đơn DEMO-O-B2B-01 đã Completed ngày 25/04/2026.
       Lịch sử: Confirmed → Processing (16/04) → Shipped (18/04) → Completed."
```

### 11.4 Khách B2C

**Suggested prompts:**

- "Đơn DEMO-O-B2C-... đang ở đâu?"
- "Có sản phẩm sofa đỏ không?"
- "Sofa nào dưới 10 triệu?"
- "Bàn trong khoảng 5-15 triệu"
- "Đơn gần nhất của tôi"

> Bot hiểu các cụm "trên / dưới / từ … đến …" và viết tắt "tr" (triệu) / "k" (nghìn). Ví dụ "dưới 5tr" → maxPrice = 5.000.000 VND. Filter áp lên `Product.BasePrice`.

**Kịch bản 1 — Tra đơn:**

```
User: Đơn DEMO-O-B2C-04 giao chưa?
Bot:  (gọi get_my_order_by_code)
      "Đơn DEMO-O-B2C-04 đang ở trạng thái 'New', chưa thanh toán.
       Bạn vui lòng hoàn tất thanh toán để chúng tôi xử lý ngay nhé."
```

**Kịch bản 2 — Tìm sản phẩm theo giá:**

```
User: Sofa nào dưới 10 triệu?
Bot:  (gọi search_products?search=sofa&maxPrice=10000000)
      "Có 2 sản phẩm phù hợp dưới 10.000.000 VND: Sofa Demo Đỏ và Sofa Demo Xám."
      → attachments: 2 product cards có ảnh + link.

User: Bàn trong khoảng 5 đến 15 triệu?
Bot:  (gọi search_products?search=bàn&minPrice=5000000&maxPrice=15000000)
      "Mình tìm thấy 1 sản phẩm: Bàn Demo Sồi (5.500.000 VND)."
      → attachments: 1 product card.
```

**Kịch bản 3 — Tìm sản phẩm theo từ khóa:**

```
User: Có sofa màu đỏ không?
Bot:  (gọi search_products?search=sofa+đỏ)
      "Có 1 sản phẩm: Sofa Demo Đỏ (DEMO-SOFA-RED) — 12.500.000 VND.
       Bạn xem chi tiết tại danh mục Sofa nhé."
```

### 11.5 Tham khảo Gemini phản hồi

- Bot **không** tự đặt giá / hứa giảm giá / cam kết ngày giao chính xác.
- Khi Gemini không có dữ liệu, sẽ trả "Mình chưa có dữ liệu về..." — FE render plain, không coi là lỗi.
- Mỗi response thường 2-5 câu; nếu user yêu cầu "chi tiết hơn" sẽ dài hơn.

---

## 12. Smoke test (Postman)

1. Login admin → copy `accessToken`.
2. POST `/api/admin/ai/chat` body `{ "message": "Tuần này doanh thu thế nào?" }`.
3. Lưu `threadId` từ response.
4. POST tiếp `{ "threadId": 42, "message": "Hôm qua so với hôm kia thì sao?" }` — Gemini hiểu ngữ cảnh nhờ history.
5. GET `/api/admin/ai/threads` → thấy phiên trên top.

*Tài liệu này độc lập; cập nhật khi thêm tool mới hoặc đổi schema.*