-- Script Khởi tạo Cơ sở dữ liệu cho Hệ thống nội thất (B2B/B2C)
-- DBMS: Microsoft SQL Server (T-SQL)
-- Chú thích: Script được xếp thứ tự tạo bảng chuẩn xác để không vi phạm ràng buộc Foreign Key.
-- Chú thích: Các chuỗi tiếng Việt đều được dùng kiểu dữ liệu NVARCHAR.
-- Chú thích: ID mặc định thiết lập IDENTITY(1,1) tự động tăng.

-- 1. TẠO BẢNG ROLE & NGƯỜI DÙNG HỆ THỐNG
CREATE TABLE [Role] (
    ID INT IDENTITY(1,1) PRIMARY KEY,
    Role_Name NVARCHAR(100) NOT NULL, -- Admin, Manager, Sales, Stock Manager, Worker
    Description NVARCHAR(255),
    Permissions NVARCHAR(MAX)
);

CREATE TABLE [User] (
    ID INT IDENTITY(1,1) PRIMARY KEY,
    Username VARCHAR(100) UNIQUE NOT NULL,
    Password_Hash VARCHAR(255) NOT NULL,
    Full_Name NVARCHAR(255) NOT NULL,
    Email VARCHAR(255) UNIQUE,
    Phone VARCHAR(50),
    Role_ID INT NOT NULL FOREIGN KEY REFERENCES [Role](ID),
    Status VARCHAR(20) DEFAULT 'Active', -- Active, Inactive
    Created_At DATETIME2 DEFAULT GETDATE(),
    Updated_At DATETIME2
);

-- 2. TẠO BẢNG KHÁCH HÀNG & SỔ ĐỊA CHỈ
CREATE TABLE [Customer] (
    ID INT IDENTITY(1,1) PRIMARY KEY,
    Customer_Type VARCHAR(20) NOT NULL, -- 'B2C' (Khách lẻ), 'B2B' (Công ty/Đại lý)
    Full_Name NVARCHAR(255) NOT NULL,
    Email VARCHAR(255),
    Phone VARCHAR(50) NOT NULL,
    Password_Hash VARCHAR(255), -- Áp dụng nếu KH có tài khoản đăng nhập web
    Company_Name NVARCHAR(255), -- Dùng cho B2B
    Tax_Code VARCHAR(50), -- Dùng cho B2B
    Company_Address NVARCHAR(500),
    Debt_Balance DECIMAL(18,2) DEFAULT 0, -- Theo dõi dư nợ
    Created_At DATETIME2 DEFAULT GETDATE()
);

CREATE TABLE [Customer_Address] (
    ID INT IDENTITY(1,1) PRIMARY KEY,
    Customer_ID INT NOT NULL FOREIGN KEY REFERENCES [Customer](ID),
    Receiver_Name NVARCHAR(255) NOT NULL,
    Receiver_Phone VARCHAR(50) NOT NULL,
    Address_Line NVARCHAR(500) NOT NULL,
    Is_Default BIT DEFAULT 0
);

-- 3. TẠO BẢNG SẢN PHẨM & BIẾN THỂ (PRODUCT CATALOG)
CREATE TABLE [Category] (
    ID INT IDENTITY(1,1) PRIMARY KEY,
    Parent_ID INT NULL FOREIGN KEY REFERENCES [Category](ID),
    Name NVARCHAR(255) NOT NULL,
    Slug VARCHAR(255) UNIQUE NOT NULL
);

CREATE TABLE [Product] (
    ID INT IDENTITY(1,1) PRIMARY KEY,
    Category_ID INT NOT NULL FOREIGN KEY REFERENCES [Category](ID),
    Name NVARCHAR(255) NOT NULL,
    Slug VARCHAR(255) UNIQUE NOT NULL,
    Description NVARCHAR(MAX),
    Base_Price DECIMAL(18,2), -- Giá cơ sở hiển thị cho B2C ban đầu
    Warranty_Period_Months INT DEFAULT 0, -- Thời gian bảo hành mặt định (Tháng)
    Status VARCHAR(50) DEFAULT 'Active'
);

CREATE TABLE [Product_Attribute] (
    ID INT IDENTITY(1,1) PRIMARY KEY,
    Product_ID INT NOT NULL FOREIGN KEY REFERENCES [Product](ID),
    Name NVARCHAR(100) NOT NULL -- Kích thước, Màu sắc, Chất liệu
);

CREATE TABLE [Product_Attribute_Value] (
    ID INT IDENTITY(1,1) PRIMARY KEY,
    Attribute_ID INT NOT NULL FOREIGN KEY REFERENCES [Product_Attribute](ID),
    Value NVARCHAR(100) NOT NULL -- 1m2, Đỏ, Nhỉ...
);

CREATE TABLE [Product_Variant] (
    ID INT IDENTITY(1,1) PRIMARY KEY,
    Product_ID INT NOT NULL FOREIGN KEY REFERENCES [Product](ID),
    SKU VARCHAR(100) UNIQUE NOT NULL, -- Mã vạch kho
    Variant_Name NVARCHAR(255) NOT NULL, -- Sofa Đỏ Phễu Gỗ Sồi
    Retail_Price DECIMAL(18,2) NOT NULL, -- Giá bán lẻ
    Cost_Price DECIMAL(18,2) NOT NULL, -- Giá vốn nhập/sản xuất (Cơ sở tính chiết khấu B2B)
    Weight DECIMAL(10,2),
    Dimensions VARCHAR(100),
    Image_URL VARCHAR(500)
);

-- 4. TẠO BẢNG KHUYẾN MÃI (PROMOTIONS)
CREATE TABLE [Promotion_Campaign] (
    ID INT IDENTITY(1,1) PRIMARY KEY,
    Name NVARCHAR(255) NOT NULL,
    Description NVARCHAR(MAX),
    Start_Date DATETIME2,
    End_Date DATETIME2,
    Status VARCHAR(50) DEFAULT 'Active'
);

CREATE TABLE [Voucher] (
    ID INT IDENTITY(1,1) PRIMARY KEY,
    Campaign_ID INT NOT NULL FOREIGN KEY REFERENCES [Promotion_Campaign](ID),
    Code VARCHAR(50) UNIQUE NOT NULL, -- TETS2026
    Discount_Type VARCHAR(50), -- 'Percentage', 'Fixed_Amount'
    Discount_Value DECIMAL(18,2) NOT NULL,
    Min_Order_Value DECIMAL(18,2) DEFAULT 0,
    Max_Discount_Amount DECIMAL(18,2), -- Giới hạn mức trần giảm giá cho B2C
    Usage_Limit INT,
    Used_Count INT DEFAULT 0,
    Status VARCHAR(50) DEFAULT 'Active'
);

-- 5. TẠO BẢNG LUỒNG BÁO GIÁ VÀ HỢP ĐỒNG B2B
CREATE TABLE [Quote] (
    ID INT IDENTITY(1,1) PRIMARY KEY,
    Quote_Code VARCHAR(100) UNIQUE NOT NULL,
    Customer_ID INT NOT NULL FOREIGN KEY REFERENCES [Customer](ID),
    Sales_ID INT NULL FOREIGN KEY REFERENCES [User](ID),
    Manager_ID INT NULL FOREIGN KEY REFERENCES [User](ID), -- Người phê duyệt
    Total_Amount DECIMAL(18,2),
    Discount_Type VARCHAR(50), -- Loại chiết khấu
    Discount_Value DECIMAL(18,2), -- Số tiền/phần trăm chiết khấu đàm phán
    Final_Amount DECIMAL(18,2),
    Status VARCHAR(50) DEFAULT 'Draft', -- Draft, Pending_Approval, Approved, Converted...
    Created_At DATETIME2 DEFAULT GETDATE()
);

CREATE TABLE [Quote_Item] (
    ID INT IDENTITY(1,1) PRIMARY KEY,
    Quote_ID INT NOT NULL FOREIGN KEY REFERENCES [Quote](ID),
    Variant_ID INT NOT NULL FOREIGN KEY REFERENCES [Product_Variant](ID),
    Quantity INT NOT NULL,
    Unit_Price DECIMAL(18,2) NOT NULL,
    Sub_Total DECIMAL(18,2) NOT NULL
);

CREATE TABLE [Contract] (
    ID INT IDENTITY(1,1) PRIMARY KEY,
    Contract_Number VARCHAR(100) UNIQUE NOT NULL,
    Quote_ID INT NOT NULL FOREIGN KEY REFERENCES [Quote](ID),
    Customer_ID INT NOT NULL FOREIGN KEY REFERENCES [Customer](ID),
    Signed_Date DATETIME2,
    Valid_From DATETIME2,
    Valid_To DATETIME2,
    Payment_Terms NVARCHAR(MAX), -- VD: trả 3 đợt
    Attachment_URL VARCHAR(500), -- Ảnh/PDF bản cứng
    Status VARCHAR(50) DEFAULT 'Draft'
);

-- 6. TẠO BẢNG ĐƠN HÀNG VÀ HÓA ĐƠN KẾ TOÁN
CREATE TABLE [Order] (
    ID INT IDENTITY(1,1) PRIMARY KEY,
    Order_Code VARCHAR(100) UNIQUE NOT NULL,
    Customer_ID INT NOT NULL FOREIGN KEY REFERENCES [Customer](ID),
    Quote_ID INT NULL FOREIGN KEY REFERENCES [Quote](ID),
    Contract_ID INT NULL FOREIGN KEY REFERENCES [Contract](ID),
    Sales_ID INT NULL FOREIGN KEY REFERENCES [User](ID),
    Voucher_ID INT NULL FOREIGN KEY REFERENCES [Voucher](ID), 
    Payment_Method VARCHAR(50), -- COD, Bank_Transfer, VNPay...
    Payment_Status VARCHAR(50) DEFAULT 'Unpaid', -- Unpaid, Deposit_Paid, Paid
    Order_Status VARCHAR(50) DEFAULT 'New', -- New, Confirmed, Packing, Shipping, Completed...
    Shipping_Address_ID INT NULL FOREIGN KEY REFERENCES [Customer_Address](ID),
    Created_At DATETIME2 DEFAULT GETDATE()
);

CREATE TABLE [Order_Item] (
    ID INT IDENTITY(1,1) PRIMARY KEY,
    Order_ID INT NOT NULL FOREIGN KEY REFERENCES [Order](ID),
    Variant_ID INT NOT NULL FOREIGN KEY REFERENCES [Product_Variant](ID),
    SKU_Snapshot VARCHAR(100), -- Lưu cứng mã tránh bị update sai logic
    Price_Snapshot DECIMAL(18,2) NOT NULL, -- Giá chốt lúc mua
    Quantity INT NOT NULL,
    Sub_Total DECIMAL(18,2) NOT NULL
);

CREATE TABLE [Invoice] (
    ID INT IDENTITY(1,1) PRIMARY KEY,
    Invoice_Number VARCHAR(100) UNIQUE NOT NULL,
    Order_ID INT NULL FOREIGN KEY REFERENCES [Order](ID),
    Contract_ID INT NULL FOREIGN KEY REFERENCES [Contract](ID),
    Customer_ID INT NOT NULL FOREIGN KEY REFERENCES [Customer](ID),
    Tax_Code VARCHAR(50), 
    Company_Name NVARCHAR(255),
    Billing_Address NVARCHAR(500),
    Sub_Total DECIMAL(18,2),
    Tax_Amount DECIMAL(18,2),
    Total_Amount DECIMAL(18,2),
    Issue_Date DATETIME2 DEFAULT GETDATE(),
    Due_Date DATETIME2, -- Hạn chót nhắc nợ tự động
    Status VARCHAR(50) DEFAULT 'Unpaid',
    PDF_URL VARCHAR(500)
);

CREATE TABLE [Payment_Transaction] (
    ID INT IDENTITY(1,1) PRIMARY KEY,
    Customer_ID INT NOT NULL FOREIGN KEY REFERENCES [Customer](ID),
    Invoice_ID INT NULL FOREIGN KEY REFERENCES [Invoice](ID),
    Amount DECIMAL(18,2) NOT NULL,
    Payment_Method VARCHAR(50),
    Transaction_Type VARCHAR(50), -- 'Payment' (Tiền vào), 'Refund' (Hoàn tiền)
    Payment_Date DATETIME2 DEFAULT GETDATE(),
    Reference_Code VARCHAR(100),
    Note NVARCHAR(MAX)
);

-- 7. TẠO BẢNG QUẢN LÝ KHO (INVENTORY & FULFILLMENT)
CREATE TABLE [Inventory] (
    ID INT IDENTITY(1,1) PRIMARY KEY,
    Variant_ID INT NOT NULL FOREIGN KEY REFERENCES [Product_Variant](ID),
    Warehouse_Location VARCHAR(100), -- VD: Kệ A1-09
    Quantity_On_Hand INT NOT NULL DEFAULT 0, -- Tồn vật lý
    Quantity_Reserved INT NOT NULL DEFAULT 0, -- Số lượng tạm giữ chờ xuất xe
    -- Computed column tự động tính hiệu Tồn vật lý - Số lượng giữ (Nhiều web hay bị oversell do quên trường Available này)
    Quantity_Available AS (Quantity_On_Hand - Quantity_Reserved) 
);

CREATE TABLE [Inventory_Transaction] (
    ID INT IDENTITY(1,1) PRIMARY KEY,
    Variant_ID INT NOT NULL FOREIGN KEY REFERENCES [Product_Variant](ID),
    Transaction_Type VARCHAR(50), -- 'IN', 'OUT', 'RESERVE', 'RELEASE'
    Quantity INT NOT NULL,
    Reference_Type VARCHAR(50),
    Reference_ID VARCHAR(100),
    Worker_ID_Assigned INT NULL FOREIGN KEY REFERENCES [User](ID),
    Manager_ID_Approved INT NULL FOREIGN KEY REFERENCES [User](ID),
    Timestamp DATETIME2 DEFAULT GETDATE()
);

CREATE TABLE [Fulfillment_Ticket] (
    ID INT IDENTITY(1,1) PRIMARY KEY,
    Order_ID INT NOT NULL FOREIGN KEY REFERENCES [Order](ID),
    Ticket_Type VARCHAR(50), -- 'Pick_List', 'Pack_List', 'Dispatch_Note'
    Assigned_Worker_ID INT NULL FOREIGN KEY REFERENCES [User](ID),
    Status VARCHAR(50) DEFAULT 'Pending',
    Created_By INT NULL FOREIGN KEY REFERENCES [User](ID)
);

-- 8. TẠO BẢNG HẬU MÃI: BẢO HÀNH & ĐỔI TRẢ
CREATE TABLE [Warranty_Ticket] (
    ID INT IDENTITY(1,1) PRIMARY KEY,
    Ticket_Number VARCHAR(100) UNIQUE NOT NULL,
    Order_ID INT NULL FOREIGN KEY REFERENCES [Order](ID),
    Contract_ID INT NULL FOREIGN KEY REFERENCES [Contract](ID),
    Customer_ID INT NOT NULL FOREIGN KEY REFERENCES [Customer](ID),
    Issue_Date DATETIME2 DEFAULT GETDATE(),
    Valid_Until DATETIME2, -- Hạn chót bảo hành
    Status VARCHAR(50) DEFAULT 'Active'
);

CREATE TABLE [Warranty_Claim] (
    ID INT IDENTITY(1,1) PRIMARY KEY,
    Warranty_Ticket_ID INT NOT NULL FOREIGN KEY REFERENCES [Warranty_Ticket](ID),
    Variant_ID INT NOT NULL FOREIGN KEY REFERENCES [Product_Variant](ID),
    Defect_Description NVARCHAR(MAX), -- Miêu tả xước xát/lỗi kĩ thuật
    Images_URL NVARCHAR(MAX),
    Status VARCHAR(50) DEFAULT 'Pending_Check',
    Estimated_Cost DECIMAL(18,2) DEFAULT 0,
    Resolved_Date DATETIME2
);

CREATE TABLE [Return_Exchange_Ticket] (
    ID INT IDENTITY(1,1) PRIMARY KEY,
    Order_ID INT NOT NULL FOREIGN KEY REFERENCES [Order](ID),
    Customer_ID INT NOT NULL FOREIGN KEY REFERENCES [Customer](ID),
    Type VARCHAR(50), -- 'Return_Only' (Hoàn tiền), 'Exchange' (Đổi trả màu khác)
    Reason NVARCHAR(MAX),
    Manager_ID_Approved INT NULL FOREIGN KEY REFERENCES [User](ID),
    Status VARCHAR(50) DEFAULT 'Requested',
    Refund_Amount DECIMAL(18,2) DEFAULT 0
);

CREATE TABLE [Return_Item] (
    ID INT IDENTITY(1,1) PRIMARY KEY,
    Ticket_ID INT NOT NULL FOREIGN KEY REFERENCES [Return_Exchange_Ticket](ID),
    Variant_ID_Returned INT NOT NULL FOREIGN KEY REFERENCES [Product_Variant](ID),
    Variant_ID_Exchanged INT NULL FOREIGN KEY REFERENCES [Product_Variant](ID),
    Quantity INT NOT NULL,
    Inventory_Action VARCHAR(50) -- 'Restock' (cho về lại kho bán), 'Defect' (loại lỗi bỏ xưởng)
);
GO
