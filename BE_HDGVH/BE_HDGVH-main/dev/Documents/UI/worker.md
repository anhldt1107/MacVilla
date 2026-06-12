# Sidebar đề xuất — **Worker** (nhân viên kho)

**Vai trò:** Thực hiện picking/packing theo phiếu; cập nhật trạng thái phiếu được giao; **không** cần toàn bộ master data hay tài chính.

**Policy:** **WarehouseStaff** (gồm `Worker`).

---

## 1. Trang chủ


| Mục              | Mô tả                                                                                     |
| ---------------- | ----------------------------------------------------------------------------------------- |
| **Việc của tôi** | Phiếu có `assignedWorkerId` = user hiện tại, trạng thái `Pending` / `Picking` / `Packed`. |


---

## 2. Phiếu xuất kho (giao diện chính)


| Mục                     | Ghi chú                                                                     |
| ----------------------- | --------------------------------------------------------------------------- |
| **Phiếu được giao**     | `GET api/admin/fulfillments?assignedWorkerId={currentUserId}`.              |
| **Chi tiết phiếu**      | Đơn kèm, địa chỉ, từng dòng SKU — `GET .../fulfillments/{id}`.              |
| **Cập nhật trạng thái** | `Pending` → `Picking` → `Packed` → (bàn giao) `Shipped` — `PUT .../status`. |


*Giao diện tối giản: danh sách thẻ + màn chi tiết + nút chuyển bước hợp lệ.*

---

## 3. Tồn kho (chỉ đọc — tuỳ chọn)


| Mục         | Ghi chú                                                                              |
| ----------- | ------------------------------------------------------------------------------------ |
| **Tra SKU** | Đọc tồn theo variant — `GET .../inventory` hoặc lookup SKU (nếu được mở policy đọc). |


---

## 4. Ẩn hoàn toàn


| Nhóm                                                                | Lý do                                              |
| ------------------------------------------------------------------- | -------------------------------------------------- |
| Báo giá, hợp đồng, hóa đơn, thanh toán, khách hàng, sản phẩm master | Ngoài phạm vi worker.                              |
| **Gán worker cho người khác**                                       | Thường Stock Manager; Worker chỉ nhận việc đã gán. |


---

*Có thể dùng **một sidebar cực ngắn** (2–3 mục) + header chọn kho/ca làm việc.*