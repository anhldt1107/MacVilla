# Customer — Catalog (`/api/store/categories`, `/products`, `/variants`)

Công khai (Anonymous) — phục vụ storefront, SEO. Header JWT không bắt buộc.

## API

| Method | Path | Ghi chú |
| ------ | ---- | ------- |
| GET | `/api/store/categories` | Cây danh mục (menu) |
| GET | `/api/store/products?page&pageSize&categoryId&includeSubcategories&search` | Danh sách sản phẩm **Active** (phân trang) |
| GET | `/api/store/products/id/{id}` | Chi tiết theo ID |
| GET | `/api/store/products/{slugOrId}` | Chi tiết theo slug (ưu tiên số nếu là id) |
| GET | `/api/store/variants/by-sku/{sku}` | Tra cứu nhanh SKU (cho quét mã tại quầy / deep-link) |

### Query — `GET /products`

| Param | Mặc định | Ghi chú |
| ----- | -------- | ------- |
| `page` | 1 | |
| `pageSize` | 50 | |
| `categoryId` | — | Nếu có, trả SP thuộc danh mục |
| `includeSubcategories` | `true` | `true` → gồm SP của danh mục con |
| `search` | — | Tìm theo tên / mô tả |

### Response `GET /categories` — `CategoryTreeNodeDto[]`

| Field | Kiểu |
| ----- | ---- |
| `id`, `parentId` | number / number\|null |
| `name`, `slug` | string |
| `imageUrl` | string \| null |
| `children[]` | `CategoryTreeNodeDto[]` (đệ quy) |

### Response `GET /products` — `PagedResultDto<StoreProductListItemDto>`

`items[]`:

| Field | Kiểu | Ghi chú |
| ----- | ---- | ------- |
| `id` | number | |
| `categoryId`, `categoryName` | number / string | |
| `name`, `slug` | string | |
| `imageUrl` | string \| null | Ảnh SP hoặc fallback variant (Id nhỏ nhất có ảnh) |
| `basePrice` | number \| null | Giá niêm yết |
| `warrantyPeriodMonths` | number | Số tháng bảo hành |
| `variantCount`, `attributeCount` | number | |

### Response `GET /products/id/{id}` và `GET /products/{slugOrId}` — `StoreProductDetailDto`

| Field | Kiểu | Ghi chú |
| ----- | ---- | ------- |
| `id`, `categoryId`, `categoryName` | number / string | |
| `name`, `slug`, `description` | string / string\|null | |
| `imageUrl` | string \| null | Ảnh đại diện |
| `basePrice` | number \| null | |
| `warrantyPeriodMonths`, `variantCount`, `attributeCount` | number | |
| `attributes[]` | `ProductDetailAttributeDto[]` | Thuộc tính (tên + giá trị) |
| `variants[]` | `StoreProductVariantDto[]` | Biến thể SKU |

`variants[]` (`StoreProductVariantDto`):

| Field | Kiểu |
| ----- | ---- |
| `id`, `sku`, `variantName` | number / string |
| `retailPrice` | number |
| `weight`, `dimensions` | number\|null / string\|null |
| `imageUrl` | string \| null |
| `quantityOnHand`, `quantityReserved`, `quantityAvailable` | number\|null |

### Response `GET /variants/by-sku/{sku}` — `StoreVariantSkuDto`

Gần giống `StoreProductVariantDto` nhưng kèm tham chiếu sản phẩm:

| Field | Kiểu |
| ----- | ---- |
| `id`, `productId`, `productName`, `productSlug` | number / string |
| `sku`, `variantName` | string |
| `retailPrice` | number |
| `weight`, `dimensions`, `imageUrl` | |
| `quantityOnHand`, `quantityReserved`, `quantityAvailable` | number\|null |

## Luồng UI

- Trang chủ / landing → `GET /categories` + `GET /products`.
- Trang sản phẩm → `GET /products/{slug}`.
- Quick add giỏ: chọn variant → `POST /api/store/me/cart/items` (cần auth) — xem [gio-hang.md](./gio-hang.md).

## UX

- SEO: SSR với `slug`, `title`, `description`, schema.org Product dựa vào detail + basePrice.
- Anonymous xem catalog; prompt login khi thao tác giỏ / đặt đơn.
- Dùng `variantCount` + `attributeCount` để quyết định có render bảng chọn thuộc tính hay chọn variant trực tiếp.
- Hiện tại API **không** có filter theo khoảng giá / thuộc tính — FE lọc client-side hoặc bổ sung endpoint sau.
