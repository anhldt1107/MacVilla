/*
  ======================================================================
  FILE: b2b_dummy_data.sql
  DESC: Dữ liệu mẫu mô phỏng LUỒNG ĐẦY ĐỦ đơn hàng B2B
  DBMS: SQL Server — chạy trên schema do EF Core migration tạo
  CHÚ Ý: Column names = PascalCase (EF convention), KHÔNG phải Snake_Case
  CHÚ Ý: Tất cả tài khoản demo password = '123456' (plain text, match AuthService)
  RUN AFTER: EF Migration + category_seed_data.sql + product_seed_data.sql
             + product_variant_seed_data.sql (để có sẵn ProductVariants & Inventories)
  ======================================================================

  LUỒNG B2B ĐẦY ĐỦ:
  ────────────────────────────────────────────────────────────────────────
  1. Roles & Internal Users  (Admin, Manager, Sales, StockManager, Worker)
  2. B2B Customer + Address   (Công ty TNHH Nội Thất Sài Gòn)
  3. Quote                    Requested → Draft → PendingApproval → Approved
                              → CustomerAccepted → Converted
  4. Contract                 Draft → PendingConfirmation → Confirmed → Active
  5. Order                    New → Confirmed → Processing → ReadyToShip
                              → Shipped → Delivered → Completed
  6. Inventory Reserve + OUT
  7. Fulfillment Ticket       Pending → Picking → Packed → Shipped
  8. Invoice + Payment        Unpaid → PartiallyPaid → Paid
  9. Warranty Ticket + Claim  Active → Pending_Check → Checking → Confirmed_Defect
                              → Repairing → Waiting_Pickup → Completed
  10. Return / Exchange        Requested → Approved → Processing → ItemsReceived
                              → Completed
  11. Transfer Notification    Pending → Verified
  ────────────────────────────────────────────────────────────────────────
*/

SET NOCOUNT ON;
SET XACT_ABORT ON;
BEGIN TRANSACTION;

-- =====================================================================
-- 1. ROLES (Idempotent — bỏ qua nếu đã tồn tại)
-- =====================================================================
IF NOT EXISTS (SELECT 1 FROM Roles WHERE RoleName = N'admin')
    INSERT INTO Roles (RoleName, Description, Permissions)
    VALUES (N'admin', N'Quản trị viên hệ thống', N'*');

IF NOT EXISTS (SELECT 1 FROM Roles WHERE RoleName = N'Manager')
    INSERT INTO Roles (RoleName, Description, Permissions)
    VALUES (N'Manager', N'Quản lý — duyệt báo giá, hợp đồng, đổi trả', N'quote.approve,contract.manage,return.approve');

IF NOT EXISTS (SELECT 1 FROM Roles WHERE RoleName = N'Sales')
    INSERT INTO Roles (RoleName, Description, Permissions)
    VALUES (N'Sales', N'Nhân viên kinh doanh — soạn báo giá, chốt đơn', N'quote.create,order.create');

IF NOT EXISTS (SELECT 1 FROM Roles WHERE RoleName = N'StockManager')
    INSERT INTO Roles (RoleName, Description, Permissions)
    VALUES (N'StockManager', N'Quản lý kho — phê duyệt xuất/nhập kho', N'inventory.manage,fulfillment.manage');

IF NOT EXISTS (SELECT 1 FROM Roles WHERE RoleName = N'Worker')
    INSERT INTO Roles (RoleName, Description, Permissions)
    VALUES (N'Worker', N'Nhân viên kho — thực hiện lấy hàng, đóng gói', N'fulfillment.execute');

-- =====================================================================
-- 2. INTERNAL USERS (Password = '123456' plain text)
-- =====================================================================
DECLARE @RoleAdmin   INT = (SELECT Id FROM Roles WHERE RoleName = N'admin');
DECLARE @RoleManager INT = (SELECT Id FROM Roles WHERE RoleName = N'Manager');
DECLARE @RoleSales   INT = (SELECT Id FROM Roles WHERE RoleName = N'Sales');
DECLARE @RoleStock   INT = (SELECT Id FROM Roles WHERE RoleName = N'StockManager');
DECLARE @RoleWorker  INT = (SELECT Id FROM Roles WHERE RoleName = N'Worker');

-- Admin
IF NOT EXISTS (SELECT 1 FROM AppUsers WHERE Username = N'admin')
    INSERT INTO AppUsers (Username, PasswordHash, FullName, Email, Phone, RoleId, Status, CreatedAt)
    VALUES (N'admin', N'123456', N'Nguyễn Văn Quản Trị', N'admin@noithat.vn', N'0901000001', @RoleAdmin, N'Active', GETDATE());

-- Manager
IF NOT EXISTS (SELECT 1 FROM AppUsers WHERE Username = N'manager01')
    INSERT INTO AppUsers (Username, PasswordHash, FullName, Email, Phone, RoleId, Status, CreatedAt)
    VALUES (N'manager01', N'123456', N'Trần Thị Quản Lý', N'manager01@noithat.vn', N'0901000002', @RoleManager, N'Active', GETDATE());

-- Sales
IF NOT EXISTS (SELECT 1 FROM AppUsers WHERE Username = N'sales01')
    INSERT INTO AppUsers (Username, PasswordHash, FullName, Email, Phone, RoleId, Status, CreatedAt)
    VALUES (N'sales01', N'123456', N'Lê Văn Kinh Doanh', N'sales01@noithat.vn', N'0901000003', @RoleSales, N'Active', GETDATE());

IF NOT EXISTS (SELECT 1 FROM AppUsers WHERE Username = N'sales02')
    INSERT INTO AppUsers (Username, PasswordHash, FullName, Email, Phone, RoleId, Status, CreatedAt)
    VALUES (N'sales02', N'123456', N'Phạm Thị Bán Hàng', N'sales02@noithat.vn', N'0901000004', @RoleSales, N'Active', GETDATE());

-- Stock Manager
IF NOT EXISTS (SELECT 1 FROM AppUsers WHERE Username = N'stock01')
    INSERT INTO AppUsers (Username, PasswordHash, FullName, Email, Phone, RoleId, Status, CreatedAt)
    VALUES (N'stock01', N'123456', N'Hoàng Văn Kho', N'stock01@noithat.vn', N'0901000005', @RoleStock, N'Active', GETDATE());

-- Worker
IF NOT EXISTS (SELECT 1 FROM AppUsers WHERE Username = N'worker01')
    INSERT INTO AppUsers (Username, PasswordHash, FullName, Email, Phone, RoleId, Status, CreatedAt)
    VALUES (N'worker01', N'123456', N'Đỗ Văn Thợ Kho', N'worker01@noithat.vn', N'0901000006', @RoleWorker, N'Active', GETDATE());

IF NOT EXISTS (SELECT 1 FROM AppUsers WHERE Username = N'worker02')
    INSERT INTO AppUsers (Username, PasswordHash, FullName, Email, Phone, RoleId, Status, CreatedAt)
    VALUES (N'worker02', N'123456', N'Vũ Thị Đóng Gói', N'worker02@noithat.vn', N'0901000007', @RoleWorker, N'Active', GETDATE());

-- Lấy ID users đã insert
DECLARE @AdminId   INT = (SELECT Id FROM AppUsers WHERE Username = N'admin');
DECLARE @ManagerId INT = (SELECT Id FROM AppUsers WHERE Username = N'manager01');
DECLARE @SalesId   INT = (SELECT Id FROM AppUsers WHERE Username = N'sales01');
DECLARE @Sales2Id  INT = (SELECT Id FROM AppUsers WHERE Username = N'sales02');
DECLARE @StockId   INT = (SELECT Id FROM AppUsers WHERE Username = N'stock01');
DECLARE @WorkerId  INT = (SELECT Id FROM AppUsers WHERE Username = N'worker01');
DECLARE @Worker2Id INT = (SELECT Id FROM AppUsers WHERE Username = N'worker02');

-- =====================================================================
-- 3. B2B CUSTOMER + ADDRESSES 
-- =====================================================================
IF NOT EXISTS (SELECT 1 FROM Customers WHERE Phone = N'0281234567')
    INSERT INTO Customers (CustomerType, FullName, Email, Phone, PasswordHash,
                           CompanyName, TaxCode, CompanyAddress, DebtBalance, CreatedAt)
    VALUES (N'B2B', N'Nguyễn Đình Đại Lý', N'daily@noithatsg.com', N'0281234567', N'123456',
            N'Công ty TNHH Nội Thất Sài Gòn', N'0312345678', N'123 Trần Hưng Đạo, Q.1, TP.HCM',
            0, GETDATE());

DECLARE @CustB2B INT = (SELECT Id FROM Customers WHERE Phone = N'0281234567');

-- Thêm 1 khách B2B nữa cho đa dạng
IF NOT EXISTS (SELECT 1 FROM Customers WHERE Phone = N'0289876543')
    INSERT INTO Customers (CustomerType, FullName, Email, Phone, PasswordHash,
                           CompanyName, TaxCode, CompanyAddress, DebtBalance, CreatedAt)
    VALUES (N'B2B', N'Trần Văn Đối Tác', N'doitac@abcfurniture.vn', N'0289876543', N'123456',
            N'Công ty CP Nội Thất ABC', N'0398765432', N'456 Nguyễn Huệ, Q.1, TP.HCM',
            0, GETDATE());

DECLARE @CustB2B2 INT = (SELECT Id FROM Customers WHERE Phone = N'0289876543');

-- Thêm 1 khách B2C cho đối chiếu
IF NOT EXISTS (SELECT 1 FROM Customers WHERE Phone = N'0901222333')
    INSERT INTO Customers (CustomerType, FullName, Email, Phone, PasswordHash,
                           CompanyName, TaxCode, CompanyAddress, DebtBalance, CreatedAt)
    VALUES (N'B2C', N'Phạm Thị Khách Lẻ', N'khachle@gmail.com', N'0901222333', N'123456',
            NULL, NULL, NULL, 0, GETDATE());

-- Địa chỉ giao hàng cho khách B2B chính
IF NOT EXISTS (SELECT 1 FROM CustomerAddresses WHERE CustomerId = @CustB2B AND AddressLine = N'123 Trần Hưng Đạo, Q.1, TP.HCM')
    INSERT INTO CustomerAddresses (CustomerId, ReceiverName, ReceiverPhone, AddressLine, IsDefault)
    VALUES (@CustB2B, N'Nguyễn Đình Đại Lý', N'0281234567', N'123 Trần Hưng Đạo, Q.1, TP.HCM', 1);

IF NOT EXISTS (SELECT 1 FROM CustomerAddresses WHERE CustomerId = @CustB2B AND AddressLine LIKE N'%Bình Thạnh%')
    INSERT INTO CustomerAddresses (CustomerId, ReceiverName, ReceiverPhone, AddressLine, IsDefault)
    VALUES (@CustB2B, N'Kho Bình Thạnh', N'0281234568', N'789 Điện Biên Phủ, Bình Thạnh, TP.HCM', 0);

DECLARE @ShipAddr INT = (SELECT TOP 1 Id FROM CustomerAddresses WHERE CustomerId = @CustB2B AND IsDefault = 1);

-- Địa chỉ cho khách B2B thứ 2
IF NOT EXISTS (SELECT 1 FROM CustomerAddresses WHERE CustomerId = @CustB2B2)
    INSERT INTO CustomerAddresses (CustomerId, ReceiverName, ReceiverPhone, AddressLine, IsDefault)
    VALUES (@CustB2B2, N'Trần Văn Đối Tác', N'0289876543', N'456 Nguyễn Huệ, Q.1, TP.HCM', 1);

-- =====================================================================
-- 4. LẤY ID BIẾN THỂ (sử dụng seed data có sẵn)
--    Chọn 3 variant từ seed data đã có
-- =====================================================================
DECLARE @Var1 INT = (SELECT TOP 1 Id FROM ProductVariants WHERE Sku = N'seed-v-seed-sp-sofa-goc-l');
DECLARE @Var2 INT = (SELECT TOP 1 Id FROM ProductVariants WHERE Sku = N'seed-v-seed-sp-ban-tra-go-oc-cho');
DECLARE @Var3 INT = (SELECT TOP 1 Id FROM ProductVariants WHERE Sku = N'seed-v-seed-sp-ke-tivi-2m');
DECLARE @Var4 INT = (SELECT TOP 1 Id FROM ProductVariants WHERE Sku = N'seed-v-seed-sp-giuong-queen-go');
DECLARE @Var5 INT = (SELECT TOP 1 Id FROM ProductVariants WHERE Sku = N'seed-v-seed-sp-tu-4-canh-trang');

-- Giá seed = 10000.00 cho tất cả variant, ta sẽ dùng giá B2B thương lượng riêng
DECLARE @PriceVar1 DECIMAL(18,2) = 8500.00;  -- Giá B2B sau chiết khấu
DECLARE @PriceVar2 DECIMAL(18,2) = 7500.00;
DECLARE @PriceVar3 DECIMAL(18,2) = 6000.00;

-- =====================================================================
-- 5. BÁO GIÁ (QUOTE) — Luồng đầy đủ: Requested → … → Converted
-- =====================================================================
-- Quote #1: LUỒNG HOÀN CHỈNH — đã Converted thành đơn hàng
IF NOT EXISTS (SELECT 1 FROM Quotes WHERE QuoteCode = N'QT20260401000001')
    INSERT INTO Quotes (QuoteCode, CustomerId, SalesId, ManagerId,
                        TotalAmount, DiscountType, DiscountValue, FinalAmount,
                        Status, CreatedAt, ValidUntil, Notes,
                        CustomerNotes, ApprovedAt, CustomerAcceptedAt)
    VALUES (N'QT20260401000001', @CustB2B, @SalesId, @ManagerId,
            -- 50 x 8500 + 30 x 7500 + 20 x 6000 = 425000 + 225000 + 120000 = 770000
            770000.00, N'Percentage', 5.00, 731500.00,
            N'Converted', '2026-04-01 09:00:00', '2026-05-01 09:00:00',
            N'Đơn lớn cho showroom mới - ưu tiên giao nhanh',
            N'Chúng tôi cần báo giá cho việc trang bị showroom mới tại Q.1',
            '2026-04-02 14:00:00', '2026-04-03 10:30:00');

DECLARE @Quote1 INT = (SELECT Id FROM Quotes WHERE QuoteCode = N'QT20260401000001');

-- Quote Items cho Quote #1
IF @Quote1 IS NOT NULL AND @Var1 IS NOT NULL AND NOT EXISTS (SELECT 1 FROM QuoteItems WHERE QuoteId = @Quote1)
BEGIN
    INSERT INTO QuoteItems (QuoteId, VariantId, Quantity, UnitPrice, SubTotal)
    VALUES (@Quote1, @Var1, 50, @PriceVar1, 50 * @PriceVar1);  -- 425,000

    INSERT INTO QuoteItems (QuoteId, VariantId, Quantity, UnitPrice, SubTotal)
    VALUES (@Quote1, @Var2, 30, @PriceVar2, 30 * @PriceVar2);  -- 225,000

    INSERT INTO QuoteItems (QuoteId, VariantId, Quantity, UnitPrice, SubTotal)
    VALUES (@Quote1, @Var3, 20, @PriceVar3, 20 * @PriceVar3);  -- 120,000
END;

-- Quote #2: Đang chờ duyệt (PendingApproval) — chưa xong
IF NOT EXISTS (SELECT 1 FROM Quotes WHERE QuoteCode = N'QT20260410000002')
    INSERT INTO Quotes (QuoteCode, CustomerId, SalesId, ManagerId,
                        TotalAmount, DiscountType, DiscountValue, FinalAmount,
                        Status, CreatedAt, ValidUntil, Notes, CustomerNotes)
    VALUES (N'QT20260410000002', @CustB2B2, @Sales2Id, NULL,
            200000.00, N'Percentage', 3.00, 194000.00,
            N'PendingApproval', '2026-04-10 08:00:00', '2026-05-10 08:00:00',
            N'Đơn bổ sung cho đại lý ABC',
            N'Cần thêm hàng cho chi nhánh mới');

DECLARE @Quote2 INT = (SELECT Id FROM Quotes WHERE QuoteCode = N'QT20260410000002');

IF @Quote2 IS NOT NULL AND @Var4 IS NOT NULL AND NOT EXISTS (SELECT 1 FROM QuoteItems WHERE QuoteId = @Quote2)
BEGIN
    INSERT INTO QuoteItems (QuoteId, VariantId, Quantity, UnitPrice, SubTotal)
    VALUES (@Quote2, @Var4, 10, 8000.00, 80000.00);

    INSERT INTO QuoteItems (QuoteId, VariantId, Quantity, UnitPrice, SubTotal)
    VALUES (@Quote2, @Var5, 15, 8000.00, 120000.00);
END;

-- Quote #3: Khách từ chối
IF NOT EXISTS (SELECT 1 FROM Quotes WHERE QuoteCode = N'QT20260405000003')
    INSERT INTO Quotes (QuoteCode, CustomerId, SalesId, ManagerId,
                        TotalAmount, DiscountType, DiscountValue, FinalAmount,
                        Status, CreatedAt, ValidUntil, Notes,
                        CustomerNotes, ApprovedAt, CustomerRejectedAt, CustomerRejectReason)
    VALUES (N'QT20260405000003', @CustB2B, @SalesId, @ManagerId,
            500000.00, N'Fixed_Amount', 20000.00, 480000.00,
            N'CustomerRejected', '2026-04-05 09:00:00', '2026-05-05 09:00:00',
            N'Báo giá nội thất văn phòng',
            N'Cần báo giá gấp cho dự án mới',
            '2026-04-06 10:00:00', '2026-04-07 15:00:00',
            N'Giá vẫn còn cao hơn đối thủ, chúng tôi sẽ xem xét lại');

-- =====================================================================
-- 6. HỢP ĐỒNG (CONTRACT) — Tạo từ Quote #1
-- =====================================================================
IF NOT EXISTS (SELECT 1 FROM Contracts WHERE ContractNumber = N'HD20260403000001')
    INSERT INTO Contracts (ContractNumber, QuoteId, CustomerId,
                           SignedDate, ValidFrom, ValidTo, PaymentTerms,
                           AttachmentUrl, Status, CustomerConfirmedAt, Notes, CreatedAt)
    VALUES (N'HD20260403000001', @Quote1, @CustB2B,
            '2026-04-03 14:00:00', '2026-04-03', '2026-10-03',
            N'Thanh toán 3 đợt: 30% đặt cọc, 50% khi giao hàng, 20% sau nghiệm thu',
            NULL, N'Active',
            '2026-04-03 16:00:00',
            N'Hợp đồng cung cấp nội thất showroom Q.1 - thanh toán theo tiến độ',
            '2026-04-03 11:00:00');

DECLARE @Contract1 INT = (SELECT Id FROM Contracts WHERE ContractNumber = N'HD20260403000001');

-- =====================================================================
-- 7. ĐƠN HÀNG (ORDER) — Tạo từ Quote #1 + Contract #1
--    Luồng: New → Confirmed → Processing → ReadyToShip → Shipped → Delivered → Completed
-- =====================================================================

-- Đơn đã HOÀN THÀNH (end-to-end)
IF NOT EXISTS (SELECT 1 FROM [Order] WHERE OrderCode = N'B2B20260404000001')
    INSERT INTO [Order] (OrderCode, CustomerId, QuoteId, ContractId, SalesId,
                         VoucherId, PaymentMethod, PaymentStatus, OrderStatus,
                         ShippingAddressId, CreatedAt,
                         MerchandiseTotal, DiscountTotal, PayableTotal)
    VALUES (N'B2B20260404000001', @CustB2B, @Quote1, @Contract1, @SalesId,
            NULL, N'Bank_Transfer', N'Paid', N'Completed',
            @ShipAddr, '2026-04-04 08:00:00',
            731500.00, 0, 731500.00);

DECLARE @Order1 INT = (SELECT Id FROM [Order] WHERE OrderCode = N'B2B20260404000001');

-- Order Items cho Order #1
IF @Order1 IS NOT NULL AND NOT EXISTS (SELECT 1 FROM OrderItems WHERE OrderId = @Order1)
BEGIN
    INSERT INTO OrderItems (OrderId, VariantId, SkuSnapshot, PriceSnapshot, Quantity, SubTotal)
    VALUES (@Order1, @Var1, N'seed-v-seed-sp-sofa-goc-l', @PriceVar1, 50, 50 * @PriceVar1);

    INSERT INTO OrderItems (OrderId, VariantId, SkuSnapshot, PriceSnapshot, Quantity, SubTotal)
    VALUES (@Order1, @Var2, N'seed-v-seed-sp-ban-tra-go-oc-cho', @PriceVar2, 30, 30 * @PriceVar2);

    INSERT INTO OrderItems (OrderId, VariantId, SkuSnapshot, PriceSnapshot, Quantity, SubTotal)
    VALUES (@Order1, @Var3, N'seed-v-seed-sp-ke-tivi-2m', @PriceVar3, 20, 20 * @PriceVar3);
END;

-- Đơn đang XỬ LÝ (Processing) — đợt 2 của hợp đồng
IF NOT EXISTS (SELECT 1 FROM [Order] WHERE OrderCode = N'B2B20260415000002')
    INSERT INTO [Order] (OrderCode, CustomerId, QuoteId, ContractId, SalesId,
                         VoucherId, PaymentMethod, PaymentStatus, OrderStatus,
                         ShippingAddressId, CreatedAt,
                         MerchandiseTotal, DiscountTotal, PayableTotal)
    VALUES (N'B2B20260415000002', @CustB2B, @Quote1, @Contract1, @SalesId,
            NULL, N'Bank_Transfer', N'PartiallyPaid', N'Processing',
            @ShipAddr, '2026-04-15 10:00:00',
            200000.00, 0, 200000.00);

DECLARE @Order2 INT = (SELECT Id FROM [Order] WHERE OrderCode = N'B2B20260415000002');

IF @Order2 IS NOT NULL AND NOT EXISTS (SELECT 1 FROM OrderItems WHERE OrderId = @Order2)
BEGIN
    INSERT INTO OrderItems (OrderId, VariantId, SkuSnapshot, PriceSnapshot, Quantity, SubTotal)
    VALUES (@Order2, @Var1, N'seed-v-seed-sp-sofa-goc-l', @PriceVar1, 10, 10 * @PriceVar1);

    INSERT INTO OrderItems (OrderId, VariantId, SkuSnapshot, PriceSnapshot, Quantity, SubTotal)
    VALUES (@Order2, @Var2, N'seed-v-seed-sp-ban-tra-go-oc-cho', @PriceVar2, 10, 10 * @PriceVar2);
END;

-- =====================================================================
-- 8. INVENTORY TRANSACTIONS (RESERVE + OUT cho Order #1 đã completed)
-- =====================================================================
-- RESERVE khi xác nhận đơn
IF @Order1 IS NOT NULL AND NOT EXISTS (SELECT 1 FROM InventoryTransactions WHERE ReferenceId = N'ORD-' + CAST(@Order1 AS VARCHAR) AND TransactionType = N'RESERVE')
BEGIN
    INSERT INTO InventoryTransactions (VariantId, TransactionType, Quantity, ReferenceType, ReferenceId, WorkerIdAssigned, ManagerIdApproved, Timestamp, Notes)
    VALUES (@Var1, N'RESERVE', 50, N'Order', N'ORD-' + CAST(@Order1 AS VARCHAR), @WorkerId, @StockId, '2026-04-04 09:00:00', N'Giữ kho cho đơn B2B #1');

    INSERT INTO InventoryTransactions (VariantId, TransactionType, Quantity, ReferenceType, ReferenceId, WorkerIdAssigned, ManagerIdApproved, Timestamp, Notes)
    VALUES (@Var2, N'RESERVE', 30, N'Order', N'ORD-' + CAST(@Order1 AS VARCHAR), @WorkerId, @StockId, '2026-04-04 09:00:00', N'Giữ kho cho đơn B2B #1');

    INSERT INTO InventoryTransactions (VariantId, TransactionType, Quantity, ReferenceType, ReferenceId, WorkerIdAssigned, ManagerIdApproved, Timestamp, Notes)
    VALUES (@Var3, N'RESERVE', 20, N'Order', N'ORD-' + CAST(@Order1 AS VARCHAR), @WorkerId, @StockId, '2026-04-04 09:00:00', N'Giữ kho cho đơn B2B #1');
END;

-- OUT khi đã xuất kho
IF @Order1 IS NOT NULL AND NOT EXISTS (SELECT 1 FROM InventoryTransactions WHERE ReferenceId = N'ORD-' + CAST(@Order1 AS VARCHAR) AND TransactionType = N'OUT')
BEGIN
    INSERT INTO InventoryTransactions (VariantId, TransactionType, Quantity, ReferenceType, ReferenceId, WorkerIdAssigned, ManagerIdApproved, Timestamp, Notes)
    VALUES (@Var1, N'OUT', 50, N'Order', N'ORD-' + CAST(@Order1 AS VARCHAR), @WorkerId, @StockId, '2026-04-05 08:00:00', N'Xuất kho cho đơn B2B #1');

    INSERT INTO InventoryTransactions (VariantId, TransactionType, Quantity, ReferenceType, ReferenceId, WorkerIdAssigned, ManagerIdApproved, Timestamp, Notes)
    VALUES (@Var2, N'OUT', 30, N'Order', N'ORD-' + CAST(@Order1 AS VARCHAR), @WorkerId, @StockId, '2026-04-05 08:00:00', N'Xuất kho cho đơn B2B #1');

    INSERT INTO InventoryTransactions (VariantId, TransactionType, Quantity, ReferenceType, ReferenceId, WorkerIdAssigned, ManagerIdApproved, Timestamp, Notes)
    VALUES (@Var3, N'OUT', 20, N'Order', N'ORD-' + CAST(@Order1 AS VARCHAR), @WorkerId, @StockId, '2026-04-05 08:00:00', N'Xuất kho cho đơn B2B #1');
END;

-- Cập nhật tồn kho thực tế (trừ đi số lượng đã xuất cho Order #1)
UPDATE Inventories SET QuantityOnHand = QuantityOnHand - 50 WHERE VariantId = @Var1 AND QuantityOnHand >= 50;
UPDATE Inventories SET QuantityOnHand = QuantityOnHand - 30 WHERE VariantId = @Var2 AND QuantityOnHand >= 30;
UPDATE Inventories SET QuantityOnHand = QuantityOnHand - 20 WHERE VariantId = @Var3 AND QuantityOnHand >= 20;

-- RESERVE cho Order #2 (đang processing)
IF @Order2 IS NOT NULL AND NOT EXISTS (SELECT 1 FROM InventoryTransactions WHERE ReferenceId = N'ORD-' + CAST(@Order2 AS VARCHAR) AND TransactionType = N'RESERVE')
BEGIN
    INSERT INTO InventoryTransactions (VariantId, TransactionType, Quantity, ReferenceType, ReferenceId, WorkerIdAssigned, ManagerIdApproved, Timestamp, Notes)
    VALUES (@Var1, N'RESERVE', 10, N'Order', N'ORD-' + CAST(@Order2 AS VARCHAR), @Worker2Id, @StockId, '2026-04-15 11:00:00', N'Giữ kho cho đơn B2B #2');

    INSERT INTO InventoryTransactions (VariantId, TransactionType, Quantity, ReferenceType, ReferenceId, WorkerIdAssigned, ManagerIdApproved, Timestamp, Notes)
    VALUES (@Var2, N'RESERVE', 10, N'Order', N'ORD-' + CAST(@Order2 AS VARCHAR), @Worker2Id, @StockId, '2026-04-15 11:00:00', N'Giữ kho cho đơn B2B #2');
END;

-- Cập nhật tồn kho reserved cho Order #2
UPDATE Inventories SET QuantityReserved = QuantityReserved + 10 WHERE VariantId = @Var1;
UPDATE Inventories SET QuantityReserved = QuantityReserved + 10 WHERE VariantId = @Var2;

-- =====================================================================
-- 9. FULFILLMENT TICKETS
-- =====================================================================
-- Ticket cho Order #1 — đã shipped
IF @Order1 IS NOT NULL AND NOT EXISTS (SELECT 1 FROM FulfillmentTickets WHERE OrderId = @Order1)
BEGIN
    INSERT INTO FulfillmentTickets (OrderId, TicketType, AssignedWorkerId, Status, CreatedBy, CreatedAt, UpdatedAt, Notes)
    VALUES (@Order1, N'Pick_List', @WorkerId, N'Shipped', @StockId, '2026-04-04 10:00:00', '2026-04-05 16:00:00', N'Lấy hàng khu A — đã hoàn tất');

    INSERT INTO FulfillmentTickets (OrderId, TicketType, AssignedWorkerId, Status, CreatedBy, CreatedAt, UpdatedAt, Notes)
    VALUES (@Order1, N'Pack_List', @Worker2Id, N'Shipped', @StockId, '2026-04-04 14:00:00', '2026-04-05 10:00:00', N'Đóng gói 100 kiện — xong');

    INSERT INTO FulfillmentTickets (OrderId, TicketType, AssignedWorkerId, Status, CreatedBy, CreatedAt, UpdatedAt, Notes)
    VALUES (@Order1, N'Dispatch_Note', @WorkerId, N'Shipped', @StockId, '2026-04-05 08:00:00', '2026-04-05 16:00:00', N'Xe tải 5 tấn — BSXE: 51C-12345');
END;

-- Ticket cho Order #2 — đang picking
IF @Order2 IS NOT NULL AND NOT EXISTS (SELECT 1 FROM FulfillmentTickets WHERE OrderId = @Order2)
BEGIN
    INSERT INTO FulfillmentTickets (OrderId, TicketType, AssignedWorkerId, Status, CreatedBy, CreatedAt, Notes)
    VALUES (@Order2, N'Pick_List', @Worker2Id, N'Picking', @StockId, '2026-04-15 14:00:00', N'Đang lấy hàng khu B');
END;

-- =====================================================================
-- 10. HÓA ĐƠN (INVOICE) — Gắn với Order + Contract
-- =====================================================================
-- Invoice đợt 1: Đặt cọc 30% — đã thanh toán
IF @Order1 IS NOT NULL AND NOT EXISTS (SELECT 1 FROM Invoices WHERE InvoiceNumber = N'INV20260404-001')
    INSERT INTO Invoices (InvoiceNumber, OrderId, ContractId, CustomerId,
                          TaxCode, CompanyName, BillingAddress,
                          SubTotal, TaxAmount, TotalAmount,
                          IssueDate, DueDate, Status, PdfUrl)
    VALUES (N'INV20260404-001', @Order1, @Contract1, @CustB2B,
            N'0312345678', N'Công ty TNHH Nội Thất Sài Gòn', N'123 Trần Hưng Đạo, Q.1, TP.HCM',
            219450.00, 21945.00, 241395.00,
            '2026-04-04 10:00:00', '2026-04-14 10:00:00', N'Paid', NULL);

DECLARE @Inv1 INT = (SELECT Id FROM Invoices WHERE InvoiceNumber = N'INV20260404-001');

-- Invoice đợt 2: 50% khi giao hàng — đã thanh toán
IF @Order1 IS NOT NULL AND NOT EXISTS (SELECT 1 FROM Invoices WHERE InvoiceNumber = N'INV20260406-002')
    INSERT INTO Invoices (InvoiceNumber, OrderId, ContractId, CustomerId,
                          TaxCode, CompanyName, BillingAddress,
                          SubTotal, TaxAmount, TotalAmount,
                          IssueDate, DueDate, Status, PdfUrl)
    VALUES (N'INV20260406-002', @Order1, @Contract1, @CustB2B,
            N'0312345678', N'Công ty TNHH Nội Thất Sài Gòn', N'123 Trần Hưng Đạo, Q.1, TP.HCM',
            365750.00, 36575.00, 402325.00,
            '2026-04-06 10:00:00', '2026-04-20 10:00:00', N'Paid', NULL);

DECLARE @Inv2 INT = (SELECT Id FROM Invoices WHERE InvoiceNumber = N'INV20260406-002');

-- Invoice đợt 3: 20% sau nghiệm thu — đã thanh toán
IF @Order1 IS NOT NULL AND NOT EXISTS (SELECT 1 FROM Invoices WHERE InvoiceNumber = N'INV20260410-003')
    INSERT INTO Invoices (InvoiceNumber, OrderId, ContractId, CustomerId,
                          TaxCode, CompanyName, BillingAddress,
                          SubTotal, TaxAmount, TotalAmount,
                          IssueDate, DueDate, Status, PdfUrl)
    VALUES (N'INV20260410-003', @Order1, @Contract1, @CustB2B,
            N'0312345678', N'Công ty TNHH Nội Thất Sài Gòn', N'123 Trần Hưng Đạo, Q.1, TP.HCM',
            146300.00, 14630.00, 160930.00,
            '2026-04-10 10:00:00', '2026-04-25 10:00:00', N'Paid', NULL);

DECLARE @Inv3 INT = (SELECT Id FROM Invoices WHERE InvoiceNumber = N'INV20260410-003');

-- Invoice cho Order #2 — Unpaid (đơn đang processing)
IF @Order2 IS NOT NULL AND NOT EXISTS (SELECT 1 FROM Invoices WHERE InvoiceNumber = N'INV20260415-004')
    INSERT INTO Invoices (InvoiceNumber, OrderId, ContractId, CustomerId,
                          TaxCode, CompanyName, BillingAddress,
                          SubTotal, TaxAmount, TotalAmount,
                          IssueDate, DueDate, Status, PdfUrl)
    VALUES (N'INV20260415-004', @Order2, @Contract1, @CustB2B,
            N'0312345678', N'Công ty TNHH Nội Thất Sài Gòn', N'123 Trần Hưng Đạo, Q.1, TP.HCM',
            200000.00, 20000.00, 220000.00,
            '2026-04-15 14:00:00', '2026-05-15 14:00:00', N'PartiallyPaid', NULL);

DECLARE @Inv4 INT = (SELECT Id FROM Invoices WHERE InvoiceNumber = N'INV20260415-004');

-- =====================================================================
-- 11. PAYMENT TRANSACTIONS — Ghi nhận thanh toán
-- =====================================================================
-- Thanh toán Invoice #1 (đặt cọc 30%)
IF @Inv1 IS NOT NULL AND NOT EXISTS (SELECT 1 FROM PaymentTransactions WHERE ReferenceCode = N'CK-VCB-20260404-001')
    INSERT INTO PaymentTransactions (CustomerId, InvoiceId, Amount, PaymentMethod, TransactionType, PaymentDate, ReferenceCode, Note)
    VALUES (@CustB2B, @Inv1, 241395.00, N'Bank_Transfer', N'Payment', '2026-04-04 15:00:00', N'CK-VCB-20260404-001', N'Chuyển khoản đặt cọc 30% - Vietcombank');

-- Thanh toán Invoice #2 (50% giao hàng)
IF @Inv2 IS NOT NULL AND NOT EXISTS (SELECT 1 FROM PaymentTransactions WHERE ReferenceCode = N'CK-VCB-20260407-002')
    INSERT INTO PaymentTransactions (CustomerId, InvoiceId, Amount, PaymentMethod, TransactionType, PaymentDate, ReferenceCode, Note)
    VALUES (@CustB2B, @Inv2, 402325.00, N'Bank_Transfer', N'Payment', '2026-04-07 09:00:00', N'CK-VCB-20260407-002', N'Chuyển khoản đợt 2 (50%) khi nhận hàng');

-- Thanh toán Invoice #3 (20% nghiệm thu)
IF @Inv3 IS NOT NULL AND NOT EXISTS (SELECT 1 FROM PaymentTransactions WHERE ReferenceCode = N'CK-VCB-20260412-003')
    INSERT INTO PaymentTransactions (CustomerId, InvoiceId, Amount, PaymentMethod, TransactionType, PaymentDate, ReferenceCode, Note)
    VALUES (@CustB2B, @Inv3, 160930.00, N'Bank_Transfer', N'Payment', '2026-04-12 10:00:00', N'CK-VCB-20260412-003', N'Chuyển khoản đợt cuối (20%) sau nghiệm thu');

-- Thanh toán một phần cho Invoice #4 (Order #2 - cọc 30%)
IF @Inv4 IS NOT NULL AND NOT EXISTS (SELECT 1 FROM PaymentTransactions WHERE ReferenceCode = N'CK-VCB-20260416-004')
    INSERT INTO PaymentTransactions (CustomerId, InvoiceId, Amount, PaymentMethod, TransactionType, PaymentDate, ReferenceCode, Note)
    VALUES (@CustB2B, @Inv4, 66000.00, N'Bank_Transfer', N'Payment', '2026-04-16 08:00:00', N'CK-VCB-20260416-004', N'Đặt cọc 30% cho đơn đợt 2');

-- =====================================================================
-- 12. TRANSFER NOTIFICATIONS (Thông báo chuyển khoản từ khách B2B)
-- =====================================================================
-- Thông báo CK đợt 1 — đã verified
IF @Inv1 IS NOT NULL AND NOT EXISTS (SELECT 1 FROM TransferNotifications WHERE ReferenceCode = N'CK-VCB-20260404-001')
    INSERT INTO TransferNotifications (CustomerId, InvoiceId, ReferenceCode, Amount, Note, AttachmentUrl, Status, ProcessNote, ProcessedBy, CreatedAt, ProcessedAt)
    VALUES (@CustB2B, @Inv1, N'CK-VCB-20260404-001', 241395.00,
            N'Thanh toán đặt cọc 30% hợp đồng HD20260403000001',
            NULL, N'Verified',
            N'Đã đối soát với sao kê ngân hàng — khớp',
            @AdminId, '2026-04-04 15:30:00', '2026-04-04 17:00:00');

-- Thông báo CK đợt 2 — đã verified
IF @Inv2 IS NOT NULL AND NOT EXISTS (SELECT 1 FROM TransferNotifications WHERE ReferenceCode = N'CK-VCB-20260407-002')
    INSERT INTO TransferNotifications (CustomerId, InvoiceId, ReferenceCode, Amount, Note, AttachmentUrl, Status, ProcessNote, ProcessedBy, CreatedAt, ProcessedAt)
    VALUES (@CustB2B, @Inv2, N'CK-VCB-20260407-002', 402325.00,
            N'Thanh toán đợt 2 (50%) khi nhận hàng',
            NULL, N'Verified',
            N'Confirmed — tiền đã vào tài khoản',
            @AdminId, '2026-04-07 09:30:00', '2026-04-07 11:00:00');

-- Thông báo CK cho Order #2 — đang chờ xử lý (Pending)
IF @Inv4 IS NOT NULL AND NOT EXISTS (SELECT 1 FROM TransferNotifications WHERE ReferenceCode = N'CK-VCB-20260416-004')
    INSERT INTO TransferNotifications (CustomerId, InvoiceId, ReferenceCode, Amount, Note, AttachmentUrl, Status, CreatedAt)
    VALUES (@CustB2B, @Inv4, N'CK-VCB-20260416-004', 66000.00,
            N'Đặt cọc 30% cho đơn B2B đợt 2',
            NULL, N'Pending', '2026-04-16 08:30:00');

-- =====================================================================
-- 13. WARRANTY TICKET + WARRANTY CLAIM (cho Order #1 đã completed)
-- =====================================================================
IF @Order1 IS NOT NULL AND NOT EXISTS (SELECT 1 FROM WarrantyTickets WHERE TicketNumber = N'WRT202604100001')
    INSERT INTO WarrantyTickets (TicketNumber, OrderId, ContractId, CustomerId,
                                 IssueDate, ValidUntil, Status)
    VALUES (N'WRT202604100001', @Order1, @Contract1, @CustB2B,
            '2026-04-10 10:00:00', '2027-04-10 10:00:00', N'Active');

DECLARE @WrtTicket1 INT = (SELECT Id FROM WarrantyTickets WHERE TicketNumber = N'WRT202604100001');

-- Warranty Claim — đã hoàn thành sửa chữa
IF @WrtTicket1 IS NOT NULL AND NOT EXISTS (SELECT 1 FROM WarrantyClaims WHERE WarrantyTicketId = @WrtTicket1)
BEGIN
    INSERT INTO WarrantyClaims (WarrantyTicketId, VariantId, DefectDescription, ImagesUrl,
                                Status, EstimatedCost, CreatedAt, ResolvedDate, Resolution, Note)
    VALUES (@WrtTicket1, @Var1,
            N'Bề mặt sofa bị bong tróc keo dán sau 5 ngày sử dụng, nghi lỗi sản xuất',
            N'https://storage.example.com/warranty/sofa-defect-01.jpg',
            N'Completed', 150000.00,
            '2026-04-11 09:00:00', '2026-04-15 14:00:00',
            N'Thay mới bề mặt bọc sofa, đã kiểm tra chất lượng lại',
            N'Lỗi do lô keo cũ - đã thông báo bộ phận sản xuất');
END;

-- =====================================================================
-- 14. RETURN / EXCHANGE TICKET (cho Order #1)
-- =====================================================================
IF @Order1 IS NOT NULL AND NOT EXISTS (SELECT 1 FROM ReturnExchangeTickets WHERE TicketNumber = N'RTN202604120001')
    INSERT INTO ReturnExchangeTickets (TicketNumber, OrderId, CustomerId, Type, Reason,
                                       CustomerNote, InternalNote,
                                       ManagerIdApproved, StockManagerId,
                                       Status, RefundAmount, CreatedAt, ApprovedAt, CompletedAt)
    VALUES (N'RTN202604120001', @Order1, @CustB2B, N'Exchange',
            N'Màu bàn trà không đúng như mẫu đã chọn',
            N'Chúng tôi nhận được bàn trà màu nâu đậm thay vì nâu nhạt như trong hợp đồng',
            N'Đã kiểm tra ảnh gốc trong hợp đồng, xác nhận sai màu — do kho xuất nhầm lô',
            @ManagerId, @StockId,
            N'Completed', 0,
            '2026-04-12 08:00:00', '2026-04-12 14:00:00', '2026-04-14 16:00:00');

DECLARE @ReturnTicket1 INT = (SELECT Id FROM ReturnExchangeTickets WHERE TicketNumber = N'RTN202604120001');

-- Return Items — đổi 5 bàn trà sai màu lấy đúng màu
IF @ReturnTicket1 IS NOT NULL AND NOT EXISTS (SELECT 1 FROM ReturnItems WHERE TicketId = @ReturnTicket1)
BEGIN
    INSERT INTO ReturnItems (TicketId, VariantIdReturned, VariantIdExchanged, Quantity, InventoryAction)
    VALUES (@ReturnTicket1, @Var2, @Var2, 5, N'Restock');
END;

-- Return Ticket #2 — Đang chờ duyệt (cho Order #1, trả hàng chứ không đổi)
IF @Order1 IS NOT NULL AND NOT EXISTS (SELECT 1 FROM ReturnExchangeTickets WHERE TicketNumber = N'RTN202604180001')
    INSERT INTO ReturnExchangeTickets (TicketNumber, OrderId, CustomerId, Type, Reason,
                                       CustomerNote,
                                       Status, RefundAmount, CreatedAt)
    VALUES (N'RTN202604180001', @Order1, @CustB2B, N'Return',
            N'Thừa 2 kệ tivi so với nhu cầu thực tế',
            N'Sau khi đo lại diện tích showroom, chúng tôi chỉ cần 18 kệ tivi thay vì 20',
            N'Requested', 12000.00,
            '2026-04-18 08:00:00');

DECLARE @ReturnTicket2 INT = (SELECT Id FROM ReturnExchangeTickets WHERE TicketNumber = N'RTN202604180001');

IF @ReturnTicket2 IS NOT NULL AND NOT EXISTS (SELECT 1 FROM ReturnItems WHERE TicketId = @ReturnTicket2)
BEGIN
    INSERT INTO ReturnItems (TicketId, VariantIdReturned, VariantIdExchanged, Quantity, InventoryAction)
    VALUES (@ReturnTicket2, @Var3, NULL, 2, N'Restock');
END;

-- =====================================================================
-- 15. CẬP NHẬT DƯ NỢ KHÁCH HÀNG (nếu cần)
-- =====================================================================
-- Order #2 còn nợ = 220000 - 66000 = 154000
UPDATE Customers SET DebtBalance = 154000.00 WHERE Id = @CustB2B;

COMMIT TRANSACTION;

PRINT N'✅ B2B Dummy Data — Hoàn tất insert dữ liệu mẫu luồng B2B đầy đủ!';
PRINT N'';
PRINT N'📋 TÀI KHOẢN DEMO (password = 123456):';
PRINT N'   admin     / 123456   — Quản trị viên';
PRINT N'   manager01 / 123456   — Quản lý (duyệt báo giá, đổi trả)';
PRINT N'   sales01   / 123456   — Kinh doanh #1';
PRINT N'   sales02   / 123456   — Kinh doanh #2';
PRINT N'   stock01   / 123456   — Quản lý kho';
PRINT N'   worker01  / 123456   — Nhân viên kho #1';
PRINT N'   worker02  / 123456   — Nhân viên kho #2';
PRINT N'';
PRINT N'🏢 KHÁCH HÀNG B2B:';
PRINT N'   Email: daily@noithatsg.com / 123456 — Cty Nội Thất Sài Gòn';
PRINT N'   Email: doitac@abcfurniture.vn / 123456 — Cty Nội Thất ABC';
PRINT N'';
PRINT N'📦 LUỒNG ĐƠN HÀNG B2B:';
PRINT N'   Quote QT20260401000001 → Contract HD20260403000001';
PRINT N'   → Order B2B20260404000001 (Completed + Paid)';
PRINT N'   → Order B2B20260415000002 (Processing + PartiallyPaid)';
PRINT N'   → Invoice INV20260404-001..003 (Paid) + INV20260415-004 (PartiallyPaid)';
PRINT N'   → Warranty WRT202604100001 (Active, Claim Completed)';
PRINT N'   → Return RTN202604120001 (Exchange, Completed)';
PRINT N'   → Return RTN202604180001 (Return, Requested — chờ duyệt)';
