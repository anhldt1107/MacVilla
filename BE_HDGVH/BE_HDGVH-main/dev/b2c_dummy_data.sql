/*
  ======================================================================
  FILE: b2c_dummy_data.sql
  DESC: Dữ liệu mẫu mô phỏng LUỒNG ĐẦY ĐỦ đơn hàng B2C (Khách mua lẻ)
  DBMS: SQL Server — chạy trên schema do EF Core migration tạo
  CHÚ Ý: Column names = PascalCase (EF convention)
  RUN AFTER: b2b_dummy_data.sql (để tái sử dụng biến thể và Internal Users)
  ======================================================================

  LUỒNG B2C ĐẦY ĐỦ:
  ────────────────────────────────────────────────────────────────────────
  1. Internal Users           (Lấy từ b2b_dummy_data.sql: admin, sales01, stock01, worker01)
  2. B2C Customer + Address   (Khách lẻ tạo tài khoản trên web/POS)
  3. Order                    (Tạo trực tiếp, không qua Quote/Contract)
                              New → Confirmed → Processing → ReadyToShip
                              → Shipped → Delivered → Completed
  4. Inventory Reserve + OUT
  5. Fulfillment Ticket       Pending → Picking → Packed → Shipped
  6. Invoice + Payment        Paid ngay (Trực tiếp POS hoặc qua VNPay)
  7. Warranty Ticket + Claim  Active → ... → Completed
  8. Return / Exchange        Requested → ... → Completed
  ────────────────────────────────────────────────────────────────────────
*/

SET NOCOUNT ON;
SET XACT_ABORT ON;
BEGIN TRANSACTION;

-- =====================================================================
-- 1. LẤY USERS NỘI BỘ (Đã có từ b2b_dummy_data.sql)
-- =====================================================================
DECLARE @AdminId   INT = (SELECT Id FROM AppUsers WHERE Username = N'admin');
DECLARE @SalesId   INT = (SELECT Id FROM AppUsers WHERE Username = N'sales01');
DECLARE @StockId   INT = (SELECT Id FROM AppUsers WHERE Username = N'stock01');
DECLARE @WorkerId  INT = (SELECT Id FROM AppUsers WHERE Username = N'worker01');

IF @AdminId IS NULL OR @SalesId IS NULL OR @StockId IS NULL OR @WorkerId IS NULL
BEGIN
    PRINT N'⚠️ Vui lòng chạy b2b_dummy_data.sql trước để khởi tạo AppUsers!';
    ROLLBACK TRANSACTION;
END

-- =====================================================================
-- 2. KHÁCH HÀNG B2C (KHÁCH LẺ) & ĐỊA CHỈ
-- =====================================================================
-- Khách số 1: Luồng mua hàng hoàn tất + Bảo hành
IF NOT EXISTS (SELECT 1 FROM Customers WHERE Phone = N'0901112233')
    INSERT INTO Customers (CustomerType, FullName, Email, Phone, PasswordHash, DebtBalance, CreatedAt)
    VALUES (N'B2C', N'Lê Thị Khách Lẻ', N'khachle01@gmail.com', N'0901112233', N'123456', 0, GETDATE());

DECLARE @CustB2C1 INT = (SELECT Id FROM Customers WHERE Phone = N'0901112233');

-- Khách số 2: Luồng hoàn trả / Đổi trả
IF NOT EXISTS (SELECT 1 FROM Customers WHERE Phone = N'0909998877')
    INSERT INTO Customers (CustomerType, FullName, Email, Phone, PasswordHash, DebtBalance, CreatedAt)
    VALUES (N'B2C', N'Vũ Văn Đổi Trả', N'doitra@gmail.com', N'0909998877', N'123456', 0, GETDATE());

DECLARE @CustB2C2 INT = (SELECT Id FROM Customers WHERE Phone = N'0909998877');

-- Địa chỉ giao hàng
IF NOT EXISTS (SELECT 1 FROM CustomerAddresses WHERE CustomerId = @CustB2C1)
    INSERT INTO CustomerAddresses (CustomerId, ReceiverName, ReceiverPhone, AddressLine, IsDefault)
    VALUES (@CustB2C1, N'Lê Thị Khách Lẻ', N'0901112233', N'12 Thảo Điền, Q.2, TP.HCM', 1);

DECLARE @ShipAddr1 INT = (SELECT TOP 1 Id FROM CustomerAddresses WHERE CustomerId = @CustB2C1 AND IsDefault = 1);

IF NOT EXISTS (SELECT 1 FROM CustomerAddresses WHERE CustomerId = @CustB2C2)
    INSERT INTO CustomerAddresses (CustomerId, ReceiverName, ReceiverPhone, AddressLine, IsDefault)
    VALUES (@CustB2C2, N'Vũ Văn Đổi Trả', N'0909998877', N'45 Lê Lợi, Q.1, TP.HCM', 1);

DECLARE @ShipAddr2 INT = (SELECT TOP 1 Id FROM CustomerAddresses WHERE CustomerId = @CustB2C2 AND IsDefault = 1);


-- =====================================================================
-- 3. LẤY ID BIẾN THỂ TỪ SEED DATA SẴN CÓ
-- =====================================================================
DECLARE @Var1 INT = (SELECT TOP 1 Id FROM ProductVariants WHERE Sku = N'seed-v-seed-sp-sofa-goc-l');
DECLARE @Var2 INT = (SELECT TOP 1 Id FROM ProductVariants WHERE Sku = N'seed-v-seed-sp-ban-tra-go-oc-cho');
DECLARE @Var4 INT = (SELECT TOP 1 Id FROM ProductVariants WHERE Sku = N'seed-v-seed-sp-giuong-queen-go');

-- Giá B2C chuẩn theo hệ thống (không chiết khấu mạnh như B2B)
DECLARE @PriceVar1 DECIMAL(18,2) = 10000.00;
DECLARE @PriceVar2 DECIMAL(18,2) = 10000.00;
DECLARE @PriceVar4 DECIMAL(18,2) = 12000.00;


-- =====================================================================
-- 4. ĐƠN HÀNG B2C VÀ HÓA ĐƠN ĐI KÈM
-- =====================================================================

-------------------------------------------------------------------------
-- Đơn B2C #1 (Hoàn thành mượt mà, sau đó có yêu cầu bảo hành)
-------------------------------------------------------------------------
IF NOT EXISTS (SELECT 1 FROM [Order] WHERE OrderCode = N'B2C2026042000001')
    INSERT INTO [Order] (OrderCode, CustomerId, SalesId, PaymentMethod, PaymentStatus, OrderStatus, ShippingAddressId, CreatedAt, MerchandiseTotal, DiscountTotal, PayableTotal)
    VALUES (N'B2C2026042000001', @CustB2C1, @SalesId, N'Credit_Card', N'Paid', N'Completed', @ShipAddr1, '2026-04-20 09:00:00', 
            @PriceVar1 + @PriceVar2, 0, @PriceVar1 + @PriceVar2);

DECLARE @OrderB2C1 INT = (SELECT Id FROM [Order] WHERE OrderCode = N'B2C2026042000001');

-- Order Items #1
IF @OrderB2C1 IS NOT NULL AND NOT EXISTS (SELECT 1 FROM OrderItems WHERE OrderId = @OrderB2C1)
BEGIN
    INSERT INTO OrderItems (OrderId, VariantId, SkuSnapshot, PriceSnapshot, Quantity, SubTotal)
    VALUES (@OrderB2C1, @Var1, N'seed-v-seed-sp-sofa-goc-l', @PriceVar1, 1, @PriceVar1);

    INSERT INTO OrderItems (OrderId, VariantId, SkuSnapshot, PriceSnapshot, Quantity, SubTotal)
    VALUES (@OrderB2C1, @Var2, N'seed-v-seed-sp-ban-tra-go-oc-cho', @PriceVar2, 1, @PriceVar2);
END

-- Fulfillments tickets (đã xuất)
IF @OrderB2C1 IS NOT NULL AND NOT EXISTS (SELECT 1 FROM FulfillmentTickets WHERE OrderId = @OrderB2C1)
BEGIN
    INSERT INTO FulfillmentTickets (OrderId, TicketType, AssignedWorkerId, Status, CreatedBy, CreatedAt, UpdatedAt)
    VALUES (@OrderB2C1, N'Pick_List', @WorkerId, N'Shipped', @StockId, '2026-04-20 10:00:00', '2026-04-20 14:00:00');
END

-- Trừ tồn kho OUT (1 Sofa, 1 Bàn Trà)
IF @OrderB2C1 IS NOT NULL AND NOT EXISTS (SELECT 1 FROM InventoryTransactions WHERE ReferenceId = N'ORD-' + CAST(@OrderB2C1 AS VARCHAR) AND TransactionType = N'OUT')
BEGIN
    INSERT INTO InventoryTransactions (VariantId, TransactionType, Quantity, ReferenceType, ReferenceId, WorkerIdAssigned, ManagerIdApproved, Timestamp, Notes)
    VALUES (@Var1, N'OUT', 1, N'Order', N'ORD-' + CAST(@OrderB2C1 AS VARCHAR), @WorkerId, @StockId, '2026-04-20 13:00:00', N'Xuất kho cho B2C');
    
    INSERT INTO InventoryTransactions (VariantId, TransactionType, Quantity, ReferenceType, ReferenceId, WorkerIdAssigned, ManagerIdApproved, Timestamp, Notes)
    VALUES (@Var2, N'OUT', 1, N'Order', N'ORD-' + CAST(@OrderB2C1 AS VARCHAR), @WorkerId, @StockId, '2026-04-20 13:00:00', N'Xuất kho cho B2C');
    
    UPDATE Inventories SET QuantityOnHand = QuantityOnHand - 1 WHERE VariantId IN (@Var1, @Var2) AND QuantityOnHand >= 1;
END

-- Ticket Bảo hành cho đơn B2C #1 (Đã phát sinh claim)
IF NOT EXISTS (SELECT 1 FROM WarrantyTickets WHERE TicketNumber = N'WRT-B2C-200001')
    INSERT INTO WarrantyTickets (TicketNumber, OrderId, CustomerId, IssueDate, ValidUntil, Status)
    VALUES (N'WRT-B2C-200001', @OrderB2C1, @CustB2C1, '2026-04-20 10:00:00', '2027-04-20 10:00:00', N'Active');

DECLARE @WrtB2C INT = (SELECT Id FROM WarrantyTickets WHERE TicketNumber = N'WRT-B2C-200001');

IF @WrtB2C IS NOT NULL AND NOT EXISTS (SELECT 1 FROM WarrantyClaims WHERE WarrantyTicketId = @WrtB2C)
    INSERT INTO WarrantyClaims (WarrantyTicketId, VariantId, DefectDescription, Status, EstimatedCost, CreatedAt, ResolvedDate, Resolution)
    VALUES (@WrtB2C, @Var2, N'Bàn trà bị xước mặt kính', N'Completed', 0, '2026-05-01 08:00:00', '2026-05-05 17:00:00', N'Thay mặt kính mới miễn phí');


-------------------------------------------------------------------------
-- Đơn B2C #2 (Đã giao, Khách yêu cầu trả hàng)
-------------------------------------------------------------------------
IF NOT EXISTS (SELECT 1 FROM [Order] WHERE OrderCode = N'B2C2026042100002')
    INSERT INTO [Order] (OrderCode, CustomerId, SalesId, PaymentMethod, PaymentStatus, OrderStatus, ShippingAddressId, CreatedAt, MerchandiseTotal, DiscountTotal, PayableTotal)
    VALUES (N'B2C2026042100002', @CustB2C2, @SalesId, N'COD', N'Paid', N'Completed', @ShipAddr2, '2026-04-21 10:00:00', 
            @PriceVar4, 0, @PriceVar4);

DECLARE @OrderB2C2 INT = (SELECT Id FROM [Order] WHERE OrderCode = N'B2C2026042100002');

-- Order Items #2
IF @OrderB2C2 IS NOT NULL AND NOT EXISTS (SELECT 1 FROM OrderItems WHERE OrderId = @OrderB2C2)
BEGIN
    INSERT INTO OrderItems (OrderId, VariantId, SkuSnapshot, PriceSnapshot, Quantity, SubTotal)
    VALUES (@OrderB2C2, @Var4, N'seed-v-seed-sp-giuong-queen-go', @PriceVar4, 1, @PriceVar4);
END

-- Trừ tồn kho OUT (1 Giường)
IF @OrderB2C2 IS NOT NULL AND NOT EXISTS (SELECT 1 FROM InventoryTransactions WHERE ReferenceId = N'ORD-' + CAST(@OrderB2C2 AS VARCHAR) AND TransactionType = N'OUT')
BEGIN
    INSERT INTO InventoryTransactions (VariantId, TransactionType, Quantity, ReferenceType, ReferenceId, WorkerIdAssigned, ManagerIdApproved, Timestamp, Notes)
    VALUES (@Var4, N'OUT', 1, N'Order', N'ORD-' + CAST(@OrderB2C2 AS VARCHAR), @WorkerId, @StockId, '2026-04-21 13:00:00', N'Xuất kho cho B2C');
    
    UPDATE Inventories SET QuantityOnHand = QuantityOnHand - 1 WHERE VariantId = @Var4 AND QuantityOnHand >= 1;
END

-- Invoice cho Đơn #2
IF NOT EXISTS (SELECT 1 FROM Invoices WHERE InvoiceNumber = N'INV-B2C-002')
    INSERT INTO Invoices (InvoiceNumber, OrderId, CustomerId, SubTotal, TaxAmount, TotalAmount, IssueDate, DueDate, Status)
    VALUES (N'INV-B2C-002', @OrderB2C2, @CustB2C2, @PriceVar4 * 0.9, @PriceVar4 * 0.1, @PriceVar4, '2026-04-21 10:30:00', '2026-04-21 10:30:00', N'Paid');

-- Hoàn trả (Return) cho Đơn #2
IF NOT EXISTS (SELECT 1 FROM ReturnExchangeTickets WHERE TicketNumber = N'RTN-B2C-210002')
    INSERT INTO ReturnExchangeTickets (TicketNumber, OrderId, CustomerId, Type, Reason, CustomerNote, InternalNote, Status, RefundAmount, CreatedAt, ApprovedAt, CompletedAt)
    VALUES (N'RTN-B2C-210002', @OrderB2C2, @CustB2C2, N'Return', N'Kích thước giường không vừa phòng ngủ', N'Tôi muốn trả lại vì quá to', N'Đã kiểm tra hàng còn nguyên vẹn', N'Completed', @PriceVar4, '2026-04-22 09:00:00', '2026-04-22 14:00:00', '2026-04-24 10:00:00');

DECLARE @RtnB2C INT = (SELECT Id FROM ReturnExchangeTickets WHERE TicketNumber = N'RTN-B2C-210002');

IF @RtnB2C IS NOT NULL AND NOT EXISTS (SELECT 1 FROM ReturnItems WHERE TicketId = @RtnB2C)
    INSERT INTO ReturnItems (TicketId, VariantIdReturned, Quantity, InventoryAction)
    VALUES (@RtnB2C, @Var4, 1, N'Restock');

-- Cộng lại tồn kho (do Return / Restock)
IF @RtnB2C IS NOT NULL AND NOT EXISTS (SELECT 1 FROM InventoryTransactions WHERE ReferenceId = N'RTN-' + CAST(@RtnB2C AS VARCHAR) AND TransactionType = N'IN')
BEGIN
    INSERT INTO InventoryTransactions (VariantId, TransactionType, Quantity, ReferenceType, ReferenceId, WorkerIdAssigned, ManagerIdApproved, Timestamp, Notes)
    VALUES (@Var4, N'IN', 1, N'Return', N'RTN-' + CAST(@RtnB2C AS VARCHAR), @WorkerId, @StockId, '2026-04-24 10:30:00', N'Nhập lại kho do trả hàng');
    
    UPDATE Inventories SET QuantityOnHand = QuantityOnHand + 1 WHERE VariantId = @Var4;
END

COMMIT TRANSACTION;

PRINT N'✅ B2C Dummy Data — Hoàn tất insert dữ liệu mẫu luồng khách lẻ B2C đầy đủ!';
PRINT N'';
PRINT N'📦 LUỒNG TRẢI NGHIỆM:';
PRINT N'   → Order B2C2026042000001 (Completed) -> Có Warranty Claim thay mặt kính';
PRINT N'   → Order B2C2026042100002 (Completed) -> Trả hàng vì sai kích thước (đã restock kho)';
