# Kế hoạch API: Master data sản phẩm (Admin)

Tài liệu lập **theo schema hiện tại** (`Entites/`, `Database/BeContext.cs`, migration `initDb`) và **convention code** (`ResponseDto`, `GlobalExceptionHandler`, `Controller` → `Service` → `Repository`).  
**Trạng thái code:** chưa có controller/service cho catalog — chỉ có `RoleController` làm mẫu pattern.

---

## 1. Mục tiêu & phạm vi

**Mục tiêu:** Admin quản lý **danh mục**, **sản phẩm**, **thuộc tính & giá trị**, **biến thể (SKU)**, và **bản ghi tồn kho** tối thiểu cho mỗi SKU (một dòng `Inventory` / variant).

**Ngoài phạm vi giai đoạn 1 (có thể tách hạng mục sau):**

- Upload file ảnh (hiện chỉ có `ImageUrl` string trên `ProductVariant`).
- Bảng nối **Variant ↔ tổ hợp ProductAttributeValue** (schema hiện **không có** — biến thể là bản ghi độc lập với `Sku`, `VariantName`; thuộc tính dùng cho mô tả/tạo UI wizard, không ràng buộc DB với variant).
- `InventoryTransaction` (nhập/xuất/điều chỉnh có chứng từ) — master data có thể chỉ cần PUT tồn mở đầu hoặc phase kho riêng.

---

## 2. Căn cứ database (ràng buộc quan trọng)

| Bảng / Entity | Điểm chính ảnh hưởng API |
|---------------|---------------------------|
| **Category** | `Slug` **unique**; `ParentId` self-FK, **Restrict** khi xóa cha (không xóa category đang làm cha). |
| **Product** | `Slug` **unique**; `CategoryId` FK → **Cascade** khi xóa category (xóa cả product con). |
| **ProductAttribute** | FK `ProductId` → **Cascade** khi xóa product. |
| **ProductAttributeValue** | FK `AttributeId` → **Cascade** khi xóa attribute. |
| **ProductVariant** | `Sku` **unique** toàn hệ thống; FK `ProductId` → **Cascade** khi xóa product. Giá: `RetailPrice`, `CostPrice` (precision 18,2). |
| **Inventory** | `VariantId` **unique** (mỗi variant tối đa **một** dòng tồn); FK → variant **Cascade**. Cột `QuantityOnHand`, `QuantityReserved`, `QuantityAvailable` — **cần rule nghiệp vụ** `Available = OnHand - Reserved` khi ghi (DB migration hiện lưu int thường, không thấy computed column trong migration). |

**Lưu ý nghiệp vụ:** Xóa category/product theo cascade có thể xóa mất variant và dữ liệu bán hàng liên quan nếu đã phát sinh đơn — nên cân nhắc **ẩn (status)** thay vì xóa cứng khi đã có `OrderItem` / `QuoteItem` (cần kiểm tra ở service hoặc đổi delete behavior sau này).

---

## 3. Tiền đề kỹ thuật (dùng chung mọi hạng mục)

1. **Bọc response:** `ResponseDto` (`success`, `data`, `message`, …) — xem [`../api_response_va_xu_ly_loi.md`](../api_response_va_xu_ly_loi.md).
2. **Lỗi:** `throw` đúng loại (`KeyNotFoundException`, `InvalidOperationException`, …) để map HTTP; không try/catch rời rạc trong controller.
3. **Phân quyền:** Gắn `[Authorize]` + policy/role (vd. Admin / CatalogManager) trên controller hoặc action — JWT đã cấu hình ở `Program.cs` (cần endpoint login riêng nếu chưa có).
4. **List:** Thống nhất query phân trang (`page`, `pageSize`), sort, search (theo `Name`, `Sku`, `Slug` tùy API).
5. **Slug / SKU:** Validate format, trim; kiểm tra trùng trước khi insert/update → `InvalidOperationException` hoặc bắt `DbUpdateException` (duplicate).

---

## 4. Thứ tự triển khai đề xuất (phase)

| Phase | Nội dung | Lý do |
|-------|----------|--------|
| **P0** | Category API | Product phụ thuộc `CategoryId`. |
| **P1** | Product API | Trung tâm master data. |
| **P2** | ProductAttribute + ProductAttributeValue | Gắn với `ProductId` / `AttributeId`. |
| **P3** | ProductVariant API | SKU, giá; phụ thuộc Product. |
| **P4** | Inventory API (theo variant) | 1-1 với variant; cấu hình tồn & vị trí kho. |

---

## 5. Hạng mục API chi tiết (theo từng module)

Dưới đây là **danh endpoint gợi ý** (có thể gom route `api/admin/...` hoặc `api/catalog/...` tùy convention dự án).

### 5.1 Category (danh mục đa cấp)

| # | Method | Route gợi ý | Mô tả | Ghi chú |
|---|--------|-------------|--------|---------|
| C1 | `GET` | `api/admin/categories` | Danh sách phẳng hoặc có `parentId` filter | Hỗ trợ phân trang tùy số lượng. |
| C2 | `GET` | `api/admin/categories/tree` | Cây danh mục (nested children) | Tiện cho UI admin. |
| C3 | `GET` | `api/admin/categories/{id}` | Chi tiết một category | 404 nếu không tồn tại. |
| C4 | `POST` | `api/admin/categories` | Tạo | Body: `parentId?`, `name`, `slug` (hoặc auto-slug từ name). |
| C5 | `PUT` | `api/admin/categories/{id}` | Cập nhật | Không cho phép `parentId` tạo vòng lặp (tổ tiên = chính nó). |
| C6 | `DELETE` | `api/admin/categories/{id}` | Xóa | **Restrict** nếu còn category con; cảnh báo cascade product nếu chấp nhận xóa product. |

**DTO:** `CategoryCreateDto`, `CategoryUpdateDto`, `CategoryTreeNodeDto`, `CategoryListItemDto`.

---

### 5.2 Product (sản phẩm gốc)

| # | Method | Route gợi ý | Mô tả | Ghi chú |
|---|--------|-------------|--------|---------|
| P1 | `GET` | `api/admin/products` | Danh sách | Filter: `categoryId` (mặc định **gồm cả nhánh con**), `includeSubcategories=false` nếu chỉ đúng một category; `status`, search `name`/`slug`; phân trang. |
| P2 | `GET` | `api/admin/products/{id}` | Chi tiết | Trả `attributes[]` (kèm `values[]`), `variants[]` (kèm tồn nếu có `Inventory`), và `variantCount` / `attributeCount`. |
| P3 | `POST` | `api/admin/products` | Tạo | `categoryId`, `name`, `slug`, `description`, `basePrice`, `warrantyPeriodMonths`, `status`. |
| P4 | `PUT` | `api/admin/products/{id}` | Cập nhật | Đổi `categoryId` cho phép nếu nghiệp vụ OK. |
| P5 | `DELETE` | `api/admin/products/{id}` | Xóa | Cascade xóa attribute, variant, inventory — **nên chặn** nếu đã có `OrderItem`/`QuoteItem` (kiểm tra query). |

**DTO:** `ProductCreateDto`, `ProductUpdateDto`, `ProductListItemDto`, `ProductDetailDto`.

**`Status`:** Chuỗi theo entity (`Active`, `Draft`, `Hidden`, …) — nên thống nhất constant hoặc enum trong code.

---

### 5.3 ProductAttribute (nhóm thuộc tính theo sản phẩm)

| # | Method | Route gợi ý | Mô tả |
|---|--------|-------------|--------|
| A1 | `GET` | `api/admin/products/{productId}/attributes` | Liệt kê attribute của product |
| A2 | `GET` | `api/admin/products/{productId}/attributes/{id}` | Chi tiết (kèm values nếu cần) |
| A3 | `POST` | `api/admin/products/{productId}/attributes` | Tạo (`name`) |
| A4 | `PUT` | `api/admin/products/{productId}/attributes/{id}` | Đổi `name` |
| A5 | `DELETE` | `api/admin/products/{productId}/attributes/{id}` | Xóa — **Cascade** xóa `ProductAttributeValue` |

---

### 5.4 ProductAttributeValue (giá trị thuộc tính)

| # | Method | Route gợi ý | Mô tả |
|---|--------|-------------|--------|
| V1 | `GET` | `api/admin/products/{productId}/attributes/{attributeId}/values` | Danh sách value |
| V2 | `POST` | `api/admin/products/{productId}/attributes/{attributeId}/values` | Tạo (`value`) |
| V3 | `PUT` | `.../values/{valueId}` | Sửa `value` |
| V4 | `DELETE` | `.../values/{valueId}` | Xóa |

**Ghi chú:** Đường dẫn lồng nhau giúp chốt `productId` + `attributeId` khớp nhau; luôn validate attribute thuộc đúng product.

---

### 5.5 ProductVariant (SKU / biến thể)

| # | Method | Route gợi ý | Mô tả | Ghi chú |
|---|--------|-------------|--------|---------|
| PV1 | `GET` | `api/admin/products/{productId}/variants` | Danh sách variant của product | |
| PV2 | `GET` | `api/admin/variants/by-sku/{sku}` | Tra cứu theo SKU | Tiện quét mã / trùng SKU. |
| PV3 | `GET` | `api/admin/products/{productId}/variants/{id}` | Chi tiết | |
| PV4 | `POST` | `api/admin/products/{productId}/variants` | Tạo | `sku`, `variantName`, `retailPrice`, `costPrice`, `weight`, `dimensions`, `imageUrl` |
| PV5 | `PUT` | `api/admin/products/{productId}/variants/{id}` | Cập nhật | SKU đổi → vẫn check unique |
| PV6 | `DELETE` | `api/admin/products/{productId}/variants/{id}` | Xóa | Chặn nếu đã có dòng đơn/báo giá tham chiếu variant (nếu policy không cho xóa) |

**DTO:** tách rõ input giá (`decimal`) khớp precision entity.

---

### 5.6 Inventory (tồn theo variant — master kho)

| # | Method | Route gợi ý | Mô tả | Ghi chú |
|---|--------|-------------|--------|---------|
| I1 | `GET` | `api/admin/products/{productId}/variants/{variantId}/inventory` | Lấy bản ghi tồn | 404 nếu chưa khởi tạo dòng `Inventory`. |
| I2 | `PUT` | `api/admin/products/{productId}/variants/{variantId}/inventory` | **Upsert** một dòng tồn | Set `warehouseLocation`, `quantityOnHand`, `quantityReserved` — **tính lại** `quantityAvailable` = OnHand − Reserved. |
| I3 | `POST` | `api/admin/products/{productId}/variants/{variantId}/inventory` | Tạo lần đầu (optional) | Có thể gộp với I2 idempotent. |

**Quy tắc:** Không cho `quantityReserved` > `quantityOnHand` (hoặc theo policy kho); mọi cập nhật đồng bộ `QuantityAvailable`.

**Sau này:** Điều chỉnh tồn qua `InventoryTransaction` + loại giao dịch (OUT/IN/ADJUST) thay vì sửa trực tiếp tay thường xuyên.

---

## 6. Tổng hợp checklist theo hạng mục (làm việc nhóm)

- [x] **C** — Category: C1–C6 + test slug/parent *(đã implement `AdminCategoriesController`)*  
- [x] **P** — Product: P1–P5 + chặn xóa khi có đơn *(đã implement `AdminProductsController`)*  
- [x] **A** — ProductAttribute: A1–A5 *(đã implement `AdminProductAttributesController`)*  
- [x] **V** — ProductAttributeValue: V1–V4 *(đã implement `AdminProductAttributeValuesController`)*  
- [x] **PV** — ProductVariant: PV1–PV6 *(đã implement `AdminProductVariantsController`, `AdminVariantLookupController`)*  
- [x] **I** — Inventory: I1–I3 + rule Available *(đã implement `AdminInventoryController`)*  

---

## 7. Liên kết tài liệu khác

- Cấu trúc bảng & nghiệp vụ tổng thể: [`../DB_EXPLANATION.md`](../DB_EXPLANATION.md), [`../tong_quan_database.md`](../tong_quan_database.md)  
- Response & lỗi API: [`../api_response_va_xu_ly_loi.md`](../api_response_va_xu_ly_loi.md)  
- Mục lục `dev/`: [`../README.md`](../README.md)  

---

*Cập nhật file này khi đổi schema (thêm bảng variant–attribute) hoặc đổi rule xóa/ẩn sản phẩm.*
