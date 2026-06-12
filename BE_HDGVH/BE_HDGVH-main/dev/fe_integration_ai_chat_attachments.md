## Tích hợp FE — Attachments trong response chat AI

Tài liệu phụ của `[fe_integration_ai_chat.md](fe_integration_ai_chat.md)`. Mô tả trường `attachments[]` trong response của 3 endpoint chat (`/api/admin/ai/chat`, `/api/store/ai/chat`, `/api/store/b2b/ai/chat`).

Mục tiêu: BE trả về sẵn **structured cards** (sản phẩm, đơn) để FE render UI giàu (card ảnh + link) song song với text Gemini, **không** phải parse text hay tự gọi catalog API.

---

## 1. Schema `AiAttachmentDto`

```ts
type AiAttachment = {
  type: "product" | "order";          // MVP — sẽ mở rộng (invoice / quote / category)
  title: string;                      // tên hiển thị
  subtitle?: string;                  // dòng phụ (giá / status)
  imageUrl?: string;                  // ảnh đại diện (URL tuyệt đối hoặc relative tới CDN)
  link?: string;                      // relative path FE — vd "/store/products/sofa-3-cho"
  meta: Record<string, any>;          // dữ liệu phụ tùy type
};
```

`attachments[]` luôn có ở `data` của `POST .../chat`. Khi không có gì để show, mảng `[]` rỗng.

```json
{
  "success": true,
  "message": "OK",
  "data": {
    "threadId": 42,
    "assistantMessage": "Mình tìm thấy 2 sản phẩm phù hợp.",
    "toolsUsed": [{ "toolName": "search_products", "latencyMs": 320, "success": true }],
    "attachments": [
      {
        "type": "product",
        "title": "Sofa Demo Đỏ",
        "subtitle": "12.500.000 VND",
        "imageUrl": "https://cdn.example.com/sofa-red.jpg",
        "link": "/store/products/demo-sofa-3",
        "meta": { "productId": 15, "slug": "demo-sofa-3" }
      },
      {
        "type": "product",
        "title": "Sofa Demo Xám",
        "subtitle": "12.500.000 VND",
        "imageUrl": null,
        "link": "/store/products/demo-sofa-3",
        "meta": { "productId": 15, "slug": "demo-sofa-3" }
      }
    ],
    "tokensIn": 4128,
    "tokensOut": 215,
    "latencyMs": 4221
  }
}
```

---

## 2. Type chi tiết

### 2.1 `type = "product"`

Tạo từ tool `search_products`.


| Trường           | Ý nghĩa                                                                                 |
| ---------------- | --------------------------------------------------------------------------------------- |
| `title`          | Tên sản phẩm (`StoreProductListItemDto.Name`)                                           |
| `subtitle`       | Giá `BasePrice` định dạng `vi-VN` + " VND" (vd `12.500.000 VND`); null nếu không có giá |
| `imageUrl`       | `StoreProductListItemDto.ImageUrl` (có thể null nếu BE không có ảnh)                    |
| `link`           | `/store/products/{slug}` (fallback `/store/products/id/{productId}` khi thiếu slug)     |
| `meta.productId` | int                                                                                     |
| `meta.slug`      | string                                                                                  |


### 2.2 `type = "order"`

Tạo từ các tool:

- B2C: `get_my_orders`, `get_my_order_by_code`
- B2B: `get_my_orders`, `get_my_order_by_code`
- Staff: `get_order_by_code`


| Trường             | Ý nghĩa                                                                                                             |
| ------------------ | ------------------------------------------------------------------------------------------------------------------- |
| `title`            | `OrderCode` (vd `DEMO-O-B2C-04`)                                                                                    |
| `subtitle`         | `"{OrderStatus} • {Total} VND"`; chỉ `OrderStatus` khi không có total                                               |
| `imageUrl`         | luôn `null` (đơn không có ảnh)                                                                                      |
| `link`             | tuỳ scope: `/store/orders/{code}` (B2C) / `/store/b2b/orders/{code}` (B2B) / `/admin/orders/by-code/{code}` (Staff) |
| `meta.orderCode`   | string                                                                                                              |
| `meta.orderStatus` | string                                                                                                              |
| `meta.scope`       | "B2C"                                                                                                               |


> Số tiền dùng `TotalAmount` (B2C) hoặc `PayableTotal` (B2B / Admin).

---

## 3. Quy ước URL

- BE chỉ trả **relative path** (luôn bắt đầu bằng `/`).
- FE prepend origin/locale theo cấu hình của mình:
  ```ts
  const href = `${import.meta.env.VITE_STORE_BASE_URL}${attachment.link}`;
  ```
- Nếu FE multi-tenant hoặc khác domain (admin vs store), tự switch theo `meta.scope`.

---

## 4. Mẫu render React (pseudo)

```tsx
function ChatMessage({ msg }: { msg: ChatResponse }) {
  return (
    <>
      <Bubble role="assistant" text={msg.assistantMessage} />
      <ToolChips items={msg.toolsUsed} />
      {msg.attachments.length > 0 && <AttachmentList items={msg.attachments} />}
    </>
  );
}

function AttachmentList({ items }: { items: AiAttachment[] }) {
  const products = items.filter((x) => x.type === "product");
  const orders   = items.filter((x) => x.type === "order");
  return (
    <div className="space-y-3">
      {products.length > 0 && <ProductGrid items={products} />}
      {orders.length > 0   && <OrderList items={orders} />}
    </div>
  );
}

function ProductGrid({ items }: { items: AiAttachment[] }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
      {items.map((p) => (
        <a key={p.meta.productId + ":" + p.title} href={p.link!} className="card">
          {p.imageUrl
            ? <img src={p.imageUrl} alt={p.title} className="aspect-square object-cover rounded" />
            : <div className="aspect-square bg-neutral-200 rounded" />}
          <div className="font-medium mt-1 truncate">{p.title}</div>
          {p.subtitle && <div className="text-sm opacity-70">{p.subtitle}</div>}
        </a>
      ))}
    </div>
  );
}

function OrderList({ items }: { items: AiAttachment[] }) {
  return (
    <ul className="divide-y border rounded">
      {items.map((o) => (
        <li key={o.meta.orderCode}>
          <a href={o.link!} className="block px-3 py-2 hover:bg-neutral-50">
            <div className="font-medium">{o.title}</div>
            {o.subtitle && <div className="text-sm opacity-70">{o.subtitle}</div>}
          </a>
        </li>
      ))}
    </ul>
  );
}
```

---

## 5. Tool → Type map


| Tool                          | Type tạo ra | Số card / lượt                      |
| ----------------------------- | ----------- | ----------------------------------- |
| `search_products` (B2C / B2B) | `product`   | 0..N (theo `pageSize`, mặc định 10) |
| `get_my_orders` (B2C)         | `order`     | 0..N                                |
| `get_my_order_by_code` (B2C)  | `order`     | 0 hoặc 1                            |
| `get_my_orders` (B2B)         | `order`     | 0..N                                |
| `get_my_order_by_code` (B2B)  | `order`     | 0 hoặc 1                            |
| `get_order_by_code` (Staff)   | `order`     | 0 hoặc 1                            |


Các tool còn lại (`get_revenue_overview`, `get_ar_aging`, `get_inventory_low_stock`, ...) **không** tạo cards ở MVP — `attachments` rỗng cho lượt chỉ gồm chúng.

---

## 6. Dedup

BE đã dedup theo `(type, link, title)` trong cùng 1 lượt. Nếu Gemini gọi `search_products` rồi `get_categories`, không có duplicate. FE không cần dedup lại.

---

## 7. Tương thích lùi

- Client cũ chỉ đọc `assistantMessage` + `toolsUsed` → bỏ qua `attachments`, render bình thường, không lỗi.
- Schema `attachments[]` luôn xuất hiện (không phải nullable) — thiếu thì là `[]`. FE mới có thể `if (msg.attachments.length > 0)` an toàn.

---

## 8. Lưu ý

- **Gemini có thể vẫn nhắc tên SP / mã đơn trong `assistantMessage`** — đó là chủ ý (text mô tả + card visual). Không cần parse lại.
- **PII redact không áp dụng cho attachments** — vì chỉ chứa thông tin của chính đơn / sản phẩm khách được xem.
- **Không stream**: attachments có sẵn trong response cuối cùng, FE không cần xử lý partial state.
- **Mở rộng**: thêm type mới (vd `invoice`) chỉ cần thêm 1 helper trong `AiAttachmentBuilder` + cập nhật 1-2 tool. Doc này sẽ thêm row tương ứng.

---

*Tài liệu phụ; cập nhật cùng nhịp với `fe_integration_ai_chat.md` khi thêm type card mới.*