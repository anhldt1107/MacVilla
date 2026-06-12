# Danh sách Thực thể (Entities) & Thuộc tính chi tiết cho Hệ thống

Dựa trên yêu cầu tách rõ 1 Item (Sản phẩm gốc) có nhiều Biến thể (Variants) và bao quát toàn bộ luồng nghiệp vụ từ bán lẻ (B2C), báo giá (B2B) đến quản lý kho nội bộ, đây là cấu trúc các Thực thể (Entities) chi tiết của hệ thống.

## Khớp với repo `BE_API` (đặt tên thực tế)

- Tài liệu dưới đây dùng tên kiểu **`User`**, **`Order`** để diễn đạt dễ đọc. Trong code: **`AppUser`**, **`CustomerOrder`** (bảng SQL: `[Order]`).
- Thuộc tính trong tài liệu có thể viết `Snake_Case` hoặc gộp ý; trong C# là **PascalCase** (ví dụ `DebtBalance`, `RoleId`). Xem class trong thư mục `Entites/` (namespace `BE_API.Entities`).
- Danh sách đầy đủ `DbSet` và quan hệ Fluent API: `Database/BeContext.cs`.
- Giải thích nghiệp vụ từng bảng: [`DB_EXPLANATION.md`](DB_EXPLANATION.md). Mục lục thư mục `dev/`: [`README.md`](README.md).

---

## 1. Nhóm Người dùng & Khách hàng (User & Customer Segment)

### 1.1 `User` (Nhân sự nội bộ)
*Dành cho Admin, Sales, Manager, Stock Manager, Worker.*
- `ID` (PK)
- `Username` / `Password_Hash`
- `Full_Name`
- `Email` / `Phone`
- `Role_ID` (FK - Phân quyền tương ứng với 5 vai trò nội bộ)
- `Status` (Active / Inactive)

### 1.2 `Customer` (Khách hàng B2C & B2B)
*Dùng chung cho cả 2 tệp khách.*
- `ID` (PK)
- `Customer_Type` (Enum: B2C, B2B)
- `Full_Name` (Tên người liên hệ/khách hàng)
- `Email` / `Phone`
- `Password_Hash` (Nếu khách hàng tạo tài khoản web)
- `Company_Name` (Tên Cty - chỉ B2B)
- `Tax_Code` (Mã số thuế - chỉ B2B)
- `Company_Address`
- `Debt_Balance` (Dư nợ công nợ - dùng cho dòng tiền B2B)

### 1.3 `Customer_Address` (Sổ địa chỉ)
*Một khách hàng có thể có nhiều địa chỉ*
- `ID` (PK)
- `Customer_ID` (FK)
- `Receiver_Name` / `Receiver_Phone`
- `Address_Line` (Số nhà, đường, Huyện, Tỉnh...)
- `Is_Default` (Boolean)

---

## 2. Nhóm Sản phẩm (Product & Catalog)
*Giải quyết bài toán "1 sản phẩm có nhiều biến thể. Quản lý kho dựa trên biến thể thực tế".*

### 2.1 `Category` (Danh mục)
- `ID` (PK)
- `Parent_ID` (Hỗ trợ danh mục đa cấp: Phòng khách -> Sofa)
- `Name` / `Slug`

### 2.2 `Product` (Sản phẩm gốc / Item)
*Đại diện chung (ví dụ: "Sofa Vải Nỉ Phong cách Bắc Âu").*
- `ID` (PK)
- `Category_ID` (FK)
- `Name` / `Slug`
- `Description` (Mô tả chi tiết tổng quan)
- `Base_Price` (Giá cơ sở hiển thị đại diện ra ngoài front-end)
- `Warranty_Period_Months` (Thời gian bảo hành tính bằng tháng)
- `Status` (Active, Draft, Hidden)

### 2.3 `Product_Attribute` (Tên Thuộc tính nhóm)
*Gắn với Product (VD: Màu sắc, Kích thước).*
- `ID` (PK)
- `Product_ID` (FK)
- `Name` (Ví dụ: "Màu sắc", "Chất liệu")

### 2.4 `Product_Attribute_Value` (Giá trị Thuộc tính)
- `ID` (PK)
- `Attribute_ID` (FK)
- `Value` (Ví dụ: "Đỏ", "Xanh", "Gỗ Sồi")

### 2.5 `Product_Variant` (Biến thể sản phẩm thực tế)
*Là sản phẩm cầm nắm được, sinh ra từ việc ghép các cụm thuộc tính. Đây là thông tin quan trọng nhất để làm giá, lên đơn và quản lý tồn.*
- `ID` (PK)
- `Product_ID` (FK)
- `SKU` (Mã định danh duy nhất / Mã vạch của biến thể)
- `Variant_Name` (Ví dụ: "Sofa Vải Nỉ - Màu Xám - Đệm Bọt Biển")
- `Retail_Price` (Giá bán lẻ niêm yết)
- `Cost_Price` (Giá gốc nhập/sản xuất - để Manager tính mức độ giảm giá B2B)
- `Weight` / `Dimensions` (Phục vụ tính phí vận chuyển)
- `Image_URL` (Ảnh riêng của Option màu này)

---

## 3. Nhóm Báo Giá & Đơn Hàng (Sales Transaction)

### 3.1 `Quote` (Báo giá B2B)
- `ID` (PK)
- `Quote_Code` 
- `Customer_ID` (FK - Đại diện cty B2B)
- `Sales_ID` (FK - Sale phụ trách)
- `Manager_ID` (FK - Manager xét duyệt)
- `Total_Amount` (Tổng tiền trước giảm)
- `Discount_Type` (Percentage, Fixed Amount)
- `Discount_Value` (Mức giảm)
- `Final_Amount` (Thành tiền chốt)
- `Status` (Draft, Pending_Approval, Approved, Rejected, Expirated, Converted_To_Order)

### 3.2 `Quote_Item` (Chi tiết báo giá)
- `ID` (PK)
- `Quote_ID` (FK)
- `Variant_ID` (FK - Báo giá chính xác đúng loại biến thể)
- `Quantity`
- `Unit_Price`
- `Sub_Total`

### 3.3 `Contract` (Hợp đồng B2B)
*Dành riêng cho luồng B2B khi Khách hàng đã chốt Báo giá và tiến hành ký kết pháp lý trước khi ra Đơn hàng.*
- `ID` (PK)
- `Contract_Number` (Số hợp đồng)
- `Quote_ID` (FK - Hợp đồng này dựa trên báo giá nào)
- `Customer_ID` (FK)
- `Signed_Date` (Ngày ký kết)
- `Valid_From` / `Valid_To` (Thời hạn hiệu lực)
- `Payment_Terms` (Điều khoản thanh toán. VD: "Cọc 30%, 70% sau nhận hàng")
- `Attachment_URL` (Link file scan PDF hợp đồng có chữ ký/dấu đỏ)
- `Status` (Draft, Sent, Signed, Cancelled)

### 3.4 `Order` (Đơn hàng B2C & B2B)
- `ID` (PK)
- `Order_Code`
- `Customer_ID` (FK)
- `Quote_ID` (FK - Có thể Null)
- `Contract_ID` (FK - Có thể Null. Điền ID hợp đồng từ bước trên nếu có)
- `Sales_ID` (FK - Null nếu khách tự order; Có ID nếu Sale tạo)
- `Voucher_ID` (FK - Có thể Null. Dùng cho B2C nếu khách nhập mã giảm giá)
- `Payment_Method` (COD, Bank_Transfer, VNPay...)
- `Payment_Status` (Unpaid, Deposit_Paid (Đã cọc), Paid)
- `Order_Status` (New, Confirmed, Inventory_Processing, Packing, Shipping, Completed, Cancelled)
- `Shipping_Address_ID` (FK)

### 3.5 `Order_Item` (Chi tiết đơn)
- `ID` (PK)
- `Order_ID` (FK)
- `Variant_ID` (FK)
- `SKU_Snapshot` (Lưu lại SKU tránh Product Variant bị sửa mã sau này)
- `Price_Snapshot` (Giá lúc chốt mua)
- `Quantity`
- `Sub_Total`

---

## 4. Nhóm Quản Lí Kho - Fulfillment (Phục vụ Manager & Worker)

### 4.1 `Inventory` (Thông tin Tồn kho)
*Quản lý số liệu kho ở mức Biến thể (Variant), không quản lý ở mức Product gốc.*
- `ID` (PK)
- `Variant_ID` (FK - Quản lý tồn theo SKU)
- `Warehouse_Location` (Mã Vị trí kệ/Lô/Dãy - Ví dụ: Kệ A-Tầng 3. Giúp Worker đi lấy hàng không bị lạc)
- `Quantity_On_Hand` (Số lượng vật lý đang nằm tại xưởng/kho)
- `Quantity_Reserved` (Số đang "Giữ chỗ" cho các Order đang xếp hàng chờ xuất - quan trọng)
- `Quantity_Available` (Số được phép bán trên Web = On_Hand trừ Reserved)

### 4.2 `Inventory_Transaction` (Lịch sử biến động Xuất/Nhập/Giữ hàng)
- `ID` (PK)
- `Variant_ID` (FK)
- `Transaction_Type` (IN - Nhập hàng, OUT - Xuất bán, RESERVE - Giữ chỗ, RELEASE - Hủy giữ chỗ)
- `Quantity` (+ / -)
- `Reference_Type` (Nhận diện là do Order hay do kiểm kê tay)
- `Reference_ID` (Mã Order, Mã Phiếu nhập...)
- `Worker_ID_Assigned` (Người trực tiếp bốc hàng giao)
- `Manager_ID_Approved` (Stock Manager phê duyệt in phiếu)
- `Timestamp`

### 4.3 `Fulfillment_Ticket` (Giấy thông hành nội bộ kho)
*Áp dụng trực tiếp vào quy trình in phiếu gắp hàng.*
- `ID` (PK)
- `Order_ID` (FK)
- `Ticket_Type` (Enum: Pick_List - Phiếu nhặt hàng, Pack_List - Phiếu gói hàng, Dispatch_Note - Phiếu xuất xe)
- `Assigned_Worker_ID` (Giao nhiệm vụ cho User Worker nào)
- `Status` (Pending, In_Progress, Done)
- `Created_By` (Stock Manager ID)

---

## 5. Nhóm Kế Toán & Quản Trị Công Nợ (Accounting & Billing)
*Phục vụ trực tiếp cho tính năng chốt Công Nợ B2B và nhắc hạn chờ.*

### 5.1 `Invoice` (Hóa đơn VAT / Bán hàng)
- `ID` (PK)
- `Invoice_Number` (Số hóa đơn/Phiếu thu)
- `Order_ID` (FK)
- `Contract_ID` (FK - Áp dụng cho B2B)
- `Customer_ID` (FK)
- `Tax_Code` (MST in trên hóa đơn)
- `Company_Name` / `Billing_Address` (Thông tin xuất VAT)
- `Sub_Total` / `Tax_Amount` / `Total_Amount`
- `Issue_Date` (Ngày xuất hóa đơn)
- `Due_Date` (Hạn chót thanh toán theo hợp đồng)
- `Status` (Unpaid, Partially_Paid, Paid, Overdue, Cancelled)
- `PDF_URL` (Link file PDF bản mềm)

### 5.2 `Payment_Transaction` (Lịch sử thanh toán & Trừ nợ)
*Mỗi lần khách hàng B2B chuyển tiền trả nợ, hệ thống sinh ra 1 bản ghi và tự động giảm `Debt_Balance` trong `Customer`.*
- `ID` (PK)
- `Customer_ID` (FK)
- `Invoice_ID` (FK - Null nếu trả trước vào tổng dư nợ)
- `Amount` (Số tiền)
- `Payment_Method` (Bank_Transfer, Cash, etc.)
- `Transaction_Type` (Payment, Refund, Adjustment)
- `Payment_Date`
- `Reference_Code` (Mã chuyển khoản/Mã giao dịch ngân hàng)
- `Note` (Ghi chú kế toán)

---

## 6. Nhóm Khuyến Mãi (Promotions & Vouchers)
*Được thiết kế linh hoạt để B2C có thể sử dụng mã giảm lúc Check-out hoặc Sale cung cấp ưu đãi thêm cho khách đến mua trực tiếp.*

### 6.1 `Promotion_Campaign` (Chương trình khuyến mãi lớn)
- `ID` (PK)
- `Name` (Ví dụ: "Vui Tết Đón Lộc 2026")
- `Description` (Mô tả, thể lệ)
- `Start_Date` / `End_Date`
- `Status` (Active, Inactive, Expired)

### 6.2 `Voucher` (Mã giảm giá/Coupon)
- `ID` (PK)
- `Campaign_ID` (FK)
- `Code` (Chuỗi mã khách sẽ nhập. VD: "TET2026")
- `Discount_Type` (Percentage / Fixed_Amount)
- `Discount_Value` (Giá trị giảm, VD: Nếu Percentage, Value là 10 tương đương 10%)
- `Min_Order_Value` (Giá trị đơn tối thiểu để mã áp dụng hợp lệ)
- `Max_Discount_Amount` (Số tiền giảm tối đa - rất quan trọng không để bị lỗi lỗ vốn)
- `Usage_Limit` (Số lượng lượt nhập thành công tối đa của mã)
- `Used_Count` (Đã có bao nhiêu người nhập thành công)
- `Status` (Active, Depleted)

---

## 7. Nhóm Hậu Mãi (After-sales: Bảo Hành & Đổi Trả)
*Giúp Admin và Manager theo dõi tỷ lệ hỏng hóc đồ nội thất và kho trừ hàng trả về.*

### 7.1 `Warranty_Ticket` (Sổ theo dõi Bảo Hành)
- `ID` (PK)
- `Ticket_Number` (Mã số Bảo hành)
- `Order_ID` / `Contract_ID` (FK - Bảo hành cho đơn nào, hợp đồng nào)
- `Customer_ID` (FK)
- `Issue_Date` (Ngày kích hoạt bảo hành)
- `Valid_Until` (Ngày hết hạn bảo hành)
- `Status` (Active, Expired, Voided)

### 7.2 `Warranty_Claim` (Yêu cầu xử lý sự cố/Báo hỏng)
- `ID` (PK)
- `Warranty_Ticket_ID` (FK)
- `Variant_ID` (FK - Sản phẩm cụ thể báo lỗi xước, móp)
- `Defect_Description` (Mô tả lỗi của khách hàng)
- `Images_URL` (Bằng chứng ảnh chụp lỗi)
- `Status` (Pending_Check, In_Progress_Repair, Resolved, Replaced)
- `Estimated_Cost` (Chiết tính chi phí sửa nếu lỗi do người dùng móp méo)
- `Resolved_Date` (Ngày đóng Task)

### 7.3 `Return_Exchange_Ticket` (Phiếu Đổi/Trả hàng)
- `ID` (PK)
- `Order_ID` (FK)
- `Customer_ID` (FK)
- `Type` (Return_Only - Trả hàng hoàn tiền, Exchange - Đổi sản phẩm lấy màu/mẫu khác)
- `Reason` (Lý do đổi trả)
- `Manager_ID_Approved` (Sự kiện quy ra dòng tiền Refund nên cần Manager duyệt trên hệ thống)
- `Status` (Requested, Approved, Completed, Rejected)
- `Refund_Amount` (Số tiền hoàn lại cho KH nếu có - liên kết qua Payment_Transaction (Transaction_Type = Refund))

### 7.4 `Return_Item` (Chi tiết vật tư Đổi/Trả cho Kho)
*Kho bãi dùng cái này để tính toán số liệu trả về.*
- `ID` (PK)
- `Ticket_ID` (FK - Trỏ về Return_Exchange_Ticket)
- `Variant_ID_Returned` (Sản phẩm cũ khách mang trả về kho)
- `Variant_ID_Exchanged` (Sản phẩm xuất mới đi cho khách bù - Null nếu Type là Return_Only)
- `Quantity`
- `Inventory_Action` (Restock - Tình trạng như mới, đưa về kho bán tiếp || Defect - Xước/lỗi, hạch toán báo hỏng hoặc chở về xưởng xử lý)
