# Sidebar đề xuất — **Stock Manager** (thủ kho / quản lý kho)

**Vai trò:** Số liệu tồn, phiếu xuất, điều phối worker, xác nhận xuất; liên quan **Inventory**, **InventoryTransaction**, **Fulfillment** trong DB.

**Policy:** **WarehouseStaff** (`StockManager` + …).

---

## 1. Trang chủ

| Mục | Mô tả |
|-----|--------|
| **Dashboard kho** | Phiếu `Pending`, đơn `Confirmed`/`Processing` chưa có phiếu, cảnh báo tồn âm / thiếu hàng (tổng hợp từ API list + filter). |

---

## 2. Xuất hàng & fulfillment

| Mục | Ghi chú |
|-----|---------|
| **Phiếu xuất kho** | Danh sách, lọc `status`, `orderId` — `api/admin/fulfillments`. |
| **Phiếu theo worker** | Query `assignedWorkerId` — đối chiếu nhân sự. |
| **Tạo phiếu** | Từ đơn — `POST api/admin/orders/{orderId}/fulfillments`. |

---

## 3. Tồn kho

| Mục | Ghi chú |
|-----|---------|
| **Tra cứu SKU / tồn** | `GET .../inventory` theo product/variant hoặc `api/admin/variants/by-sku/...`. |
| **Giao dịch kho** | Lịch sử IN/OUT/RESERVE/RELEASE — `api/admin/inventory-transactions`. |
| **Nhập / điều chỉnh** | `POST` giao dịch (nếu được giao quyền tạo IN/ADJUST). |

---

## 4. Đơn hàng (chỉ đọc / hỗ trợ vận hành)

| Mục | Ghi chú |
|-----|---------|
| **Đơn hàng** | Xem chi tiết, địa chỉ giao, dòng hàng — `api/admin/orders` (read-only UI hoặc hạn chế nút). |

*Không cần sidebar **báo giá / hợp đồng** trừ khi thủ kho được giao xem để đối chiếu.*

---

## 5. Đổi trả (phối hợp kho)

| Mục | Ghi chú |
|-----|---------|
| **Đổi / trả** | Sau khi Manager duyệt — xử lý nhập lại / xuất đổi — `api/admin/returns` + giao dịch kho. |

---

## 6. Ẩn đối với thủ kho

| Mục | Lý do |
|-----|--------|
| **CRUD sản phẩm / danh mục** | Không thuộc nhiệm vụ kho vận hành. |
| **Quản user / Role** | Admin. |
| **Duyệt báo giá** | Manager. |

---

*Tài liệu đối chiếu: [`../actors.md`](../actors.md).*
