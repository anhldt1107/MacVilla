# Tổng Quan Cơ Sở Dữ Liệu (Simple Database Overview)

Thay vì đi sâu vào từng khóa ngoại (Foreign Key) hay các trường hệ thống, tài liệu này tóm tắt chức năng cốt lõi của các cụm Bảng (Tables) và những Cột (Fields) cực kỳ quan trọng làm nên linh hồn của hệ thống.

## Ánh xạ tên tài liệu ↔ code (`BE_API`)

Trong bài viết dưới đây có chỗ gọi tên theo **SQL/concept**; trong C# dùng tên sau:


| Trong tài liệu này (gợi ý SQL / concept) | Trong code C# (`BE_API.Entities`)    | Ghi chú                                                               |
| ---------------------------------------- | ------------------------------------ | --------------------------------------------------------------------- |
| `User`                                   | `AppUser`                            | Tài khoản nhân sự nội bộ                                              |
| `Order`                                  | `CustomerOrder`                      | Entity map sang **bảng SQL tên `Order`** (cấu hình trong `BeContext`) |
| `Product_Variant`, snake_case            | `ProductVariant`, PascalCase         | Cùng một khái niệm SKU/biến thể                                       |
| `Warranty` (gộp)                         | `WarrantyTicket`, `WarrantyClaim`    | Phiếu bảo hành vs yêu cầu xử lý                                       |
| `Return_Exchange`                        | `ReturnExchangeTicket`, `ReturnItem` | Phiếu đổi trả vs dòng chi tiết                                        |


Chi tiết từng bảng theo đúng entity: xem `[DB_EXPLANATION.md](DB_EXPLANATION.md)`. Luồng nghiệp vụ: `[chi_tiet_nghiep_vu.md](chi_tiet_nghiep_vu.md)`.

---

## 1. Khối Khách hàng & Phân quyền (Identity)

Quản lý việc ai đang thao tác và giới hạn quyền hạn dòng tiền.

- `**User` & `Role**`: Nhân viên nội bộ (Admin, Sales, Manager, Stock Worker).
  - *Field quan trọng*: `Role_ID` (Quyết định được duyệt giá hay chỉ được đi nhặt hàng).
- `**Customer*`*: Lưu cả Khách lẻ (B2C) và Khách buôn (B2B).
  - *Field quan trọng*: `Debt_Balance` (Dư nợ doanh nghiệp - Dòng tiền quan trọng nhất của B2B).

## 2. Khối Sản phẩm & Danh mục (Catalog)

Thiết kế theo chuẩn E-commerce hiện đại: Tách biệt Sản phẩm gốc và Biến thể cầm nắm được.

- `**Product*`*: Sản phẩm đại diện (Dùng để hiển thị ra trang chủ website).
  - *Field quan trọng*: `Base_Price` (Giá tham khảo).
- `**Product_Variant*`*: Biến thể thực tế sinh ra từ tổ hợp Màu sắc/Kích thước (VD: Sofa Đỏ 1m2). Mọi nghiệp vụ Tồn kho, Báo giá đều móc vào bảng này.
  - *Field quan trọng*: `SKU` (Mã vạch), `Retail_Price` (Giá bán lẻ), `Cost_Price` (Giá vốn - để Manager căn xem Sales có đang chiết khấu lố hay không).

## 3. Khối Báo giá & Hợp đồng (B2B Flow)

Dành riêng cho tệp khách hàng Doanh nghiệp mua số lượng lớn.

- `**Quote*`*: Yêu cầu báo giá gốc.
  - *Field quan trọng*: `Discount_Value` (Mức giảm đàm phán riêng), `Manager_ID` (Chữ ký điện tử của người duyệt giá).
- `**Contract*`*: Chốt pháp lý sau khi Quote thành công.
  - *Field quan trọng*: `Payment_Terms` (Ghi chú trả góp/cọc).

## 4. Khối Đơn hàng & Kế toán (Order & Billing)

Nơi dòng tiền thực sự đổ về.

- `**Order` & `Order_Item*`*: Đơn hàng chung cho cả Web (B2C) và ký từ Hợp đồng (B2B). 
  - *Field quan trọng*: `Order_Status` (Tiến trình đơn), `Price_Snapshot` (Lưu chết cứng giá lúc mua, lỡ mai mốt Update giá Sản phẩm cũng không bị lệch hóa đơn cũ).
- `**Invoice` & `Payment_Transaction*`*: Quản lý xuất hóa đơn và đối soát chuyển khoản để giảm nợ.
  - *Field quan trọng*: `Due_Date` (Hạn chót đòi nợ), `Amount` (Số tiền thực nhận bồi vào Debt_Balance).

## 5. Khối Quản lý Kho bãi (Inventory Management)

Chống trường hợp "Bán khống" (Oversell) hoặc thất thoát hàng hóa nội thất.

- `**Inventory*`*: Tồn kho tại thời điểm hiện tại của từng SKU (Variant).
  - *Field quan trọng*: `Quantity_Available` = `On_Hand` (Tồn vật lý) TRỪ ĐI `Reserved` (Hàng đã chốt đơn chờ xe bốc).
- `**Inventory_Transaction*`*: Sổ cái ghi lại lịch sử mọi sự xê dịch (Ai xuất, ai nhập).
- `**Fulfillment_Ticket**`: Yêu cầu in ra giấy đưa cho Worker đi nhặt hàng. 
  - *Field quan trọng*: `Assigned_Worker_ID` (Gắn trách nhiệm cho ai làm vỡ hàng lúc bốc xếp).

## 6. Khối Khuyến Mãi & Hậu Mãi (Promo & After-sales)

- `**Voucher*`*: Mã giảm giá cho tệp B2C lấy mã trên Web.
  - *Field quan trọng*: `Max_Discount_Amount` (Số tiền giảm sập trần, ví dụ giảm 50% nhưng tối đa chỉ 200k).
- `**Warranty` & `Return_Exchange*`*: Phiếu Bảo hành và Đổi trả hàng hỏng.
  - *Field quan trọng*: `Refund_Amount` (Hoàn lại bao tiền), `Inventory_Action` (Hàng thu hồi về nhập lại kho `Restock` hay hạch toán vứt bỏ `Defect`).