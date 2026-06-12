# Các actor trong hệ thống

Tài liệu tóm tắt **ai tham gia luồng nghiệp vụ** và **cách hệ thống/code phân biệt họ**, đối chiếu DB (`BeContext`), entity nhân sự (`AppUser`), JWT (`PrincipalKinds`, `AppRoles`) và mô tả nghiệp vụ trong `[chi_tiet_nghiep_vu.md](../chi_tiet_nghiep_vu.md)`.

---

## 1. Hai nhóm chủ thể đăng nhập (API)


| Actor (gộp)        | Trong code                               | Bảng / thực thể chính                       |
| ------------------ | ---------------------------------------- | ------------------------------------------- |
| **Nhân sự nội bộ** | `PrincipalKinds.Staff` (`"staff"`)       | `AppUser` + `Role`                          |
| **Khách hàng**     | `PrincipalKinds.Customer` (`"customer"`) | `Customer` (B2C và B2B dùng chung một bảng) |


Tham chiếu: `Authorization/PrincipalKinds.cs`.

---

## 2. Vai trò nội bộ (nhân sự)

Tên role lưu trong `Role.RoleName`, đồng bộ JWT claim role, hằng số trong `Authorization/AppRoles.cs`:


| Tên role (DB/JWT) | Mô tả ngắn (nghiệp vụ)                                                                                                                |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| **admin**         | Quản trị: cấu hình, phân quyền, tài khoản nhân sự; ít tham gia xử lý đơn hàng ngày.                                                   |
| **Manager**       | Duyệt báo giá B2B, duyệt giảm giá đặc biệt; báo cáo; duyệt đổi/trả (`ReturnExchangeTicket`).                                          |
| **Sales**         | B2C: tư vấn, tạo đơn hộ khách; B2B: nhận yêu cầu, lập báo giá, phối hợp kho/thanh toán. Gắn `Quote.SalesId`, `CustomerOrder.SalesId`. |
| **StockManager**  | Điều phối kho, xác nhận xuất; gắn `ReturnExchangeTicket.StockManagerId`; quy trình kho với Worker.                                    |
| **Worker**        | Nhặt hàng, đóng gói; gắn `FulfillmentTicket.AssignedWorkerId`, `InventoryTransaction.WorkerIdAssigned`.                               |


**Trách nhiệm bổ sung trong DB** (navigation trên `AppUser`): tạo phiếu fulfillment (`FulfillmentTicketsCreated`), duyệt giao dịch kho với vai trò manager (`InventoryTransactionsAsManager`), xử lý thông báo chuyển khoản (`TransferNotificationsProcessed`), v.v. Chi tiết quan hệ: `Database/BeContext.cs` và class `Entites/AppUser.cs`.

---

## 3. Khách hàng (một thực thể, hai kiểu nghiệp vụ)


| Actor (nghiệp vụ)            | Phân biệt trong dữ liệu     | Hành vi chính                                                                                           |
| ---------------------------- | --------------------------- | ------------------------------------------------------------------------------------------------------- |
| **Khách lẻ (B2C)**           | `Customer` + loại khách B2C | Đăng ký/đăng nhập, catalog, giỏ (`ShoppingCart`), voucher, đặt hàng, thanh toán/COD.                    |
| **Khách doanh nghiệp (B2B)** | `Customer` + loại khách B2B | Yêu cầu báo giá (`Quote`), hợp đồng (`Contract`), công nợ (`DebtBalance`), hóa đơn/thanh toán theo hạn. |


Không có bảng user riêng cho “B2B”; phân loại nằm trên `Customer` (xem domain `CustomerTypes` và tài liệu `[tong_quan_database.md](../tong_quan_database.md)`).

---

## 4. Vai trò có trong tài liệu nghiệp vụ, chưa tách role riêng trong `AppRoles`

Các bộ phận sau được nhắc trong `[chi_tiet_nghiep_vu.md](../chi_tiet_nghiep_vu.md)` nhưng **chưa có hằng số role riêng** trong `AppRoles` — khi triển khai có thể gán cho Admin/Manager/Sales hoặc thêm role mới:


| Actor (nghiệp vụ)  | Xuất hiện trong luồng                                                         |
| ------------------ | ----------------------------------------------------------------------------- |
| **Kế toán nội bộ** | Xuất hóa đơn, ghi nhận thanh toán/hoàn tiền (`PaymentTransaction`), đối soát. |
| **CSKH**           | Tiếp nhận / tạo phiếu bảo hành (`WarrantyTicket`, `WarrantyClaim`).           |


---

## 5. Tác nhân không phải người dùng


| Actor        | Ý nghĩa                                                                                         |
| ------------ | ----------------------------------------------------------------------------------------------- |
| **Hệ thống** | Tự động: giữ chỗ tồn, nhắc hạn thanh toán, kiểm tra voucher, v.v. (mô tả trong tài liệu luồng). |


---

## 6. Tài liệu liên quan trong `dev/`

- Luồng và quyền actor: `[chi_tiet_nghiep_vu.md](../chi_tiet_nghiep_vu.md)`
- Giải thích bảng: `[DB_EXPLANATION.md](../DB_EXPLANATION.md)`
- Tổng quan khối dữ liệu: `[tong_quan_database.md](../tong_quan_database.md)`
- Mục lục dev: `[README.md](../README.md)`

