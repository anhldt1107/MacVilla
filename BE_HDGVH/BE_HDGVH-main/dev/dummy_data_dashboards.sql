-- =============================================================================
-- Dummy data cho dashboard /api/admin/dashboard/*
-- Mục tiêu: chart có sự lên xuống, có đủ trạng thái cho funnel/donut/bar/aging
-- DB: SQL Server (sqlserver:1433 trong docker-compose)
-- Cách chạy: kết nối SSMS / Azure Data Studio tới BE_API DB rồi mở file này thực thi
-- An toàn: script chỉ thêm/xóa các bản ghi có prefix DEMO-/demo_/0900- (xóa và
--          chèn lại để idempotent), không đụng dữ liệu thật.
-- =============================================================================

SET NOCOUNT ON;
SET XACT_ABORT ON;

BEGIN TRY
BEGIN TRAN;

DECLARE @Now DATETIME2 = SYSUTCDATETIME();

-- =============================================================================
-- 1) Cleanup demo data cũ (theo prefix). Thứ tự xóa tôn trọng FK:
--    payments → invoices → fulfillment → order_items → orders → quote_items →
--    quotes → addresses → customers → inventory_tx → inventories → variants →
--    products → categories → users (demo_*)
-- =============================================================================

DELETE FROM TransferNotifications WHERE ReferenceCode LIKE 'DEMO-%';
DELETE FROM PaymentTransactions    WHERE ReferenceCode LIKE 'DEMO-%';
DELETE FROM Invoices               WHERE InvoiceNumber LIKE 'DEMO-%';
DELETE FROM FulfillmentTickets     WHERE OrderId IN (SELECT Id FROM [Order] WHERE OrderCode LIKE 'DEMO-%');
DELETE FROM OrderItems             WHERE OrderId IN (SELECT Id FROM [Order] WHERE OrderCode LIKE 'DEMO-%');
DELETE FROM [Order]                WHERE OrderCode LIKE 'DEMO-%';
DELETE FROM QuoteItems             WHERE QuoteId IN (SELECT Id FROM Quotes WHERE QuoteCode LIKE 'DEMO-%');
DELETE FROM Quotes                 WHERE QuoteCode LIKE 'DEMO-%';
DELETE FROM CustomerAddresses      WHERE CustomerId IN (SELECT Id FROM Customers WHERE Phone LIKE '0900-%');
DELETE FROM Customers              WHERE Phone LIKE '0900-%';
DELETE FROM InventoryTransactions  WHERE ReferenceType = 'DEMO';
DELETE FROM Inventories            WHERE VariantId IN (SELECT Id FROM ProductVariants WHERE Sku LIKE 'DEMO-%');
DELETE FROM ProductVariants        WHERE Sku LIKE 'DEMO-%';
DELETE FROM Products               WHERE Slug LIKE 'demo-%';
DELETE FROM Categories             WHERE Slug LIKE 'demo-%';
DELETE FROM AppUsers               WHERE Username LIKE 'demo_%';

-- =============================================================================
-- 2) Roles (idempotent: chỉ thêm nếu thiếu, không xóa role có sẵn)
--    Khớp BE_API.Authorization.AppRoles
-- =============================================================================

IF NOT EXISTS (SELECT 1 FROM Roles WHERE RoleName = 'admin')        INSERT INTO Roles (RoleName, Description) VALUES ('admin', N'System admin');
IF NOT EXISTS (SELECT 1 FROM Roles WHERE RoleName = 'Manager')      INSERT INTO Roles (RoleName, Description) VALUES ('Manager', N'Quản lý');
IF NOT EXISTS (SELECT 1 FROM Roles WHERE RoleName = 'Sales')        INSERT INTO Roles (RoleName, Description) VALUES ('Sales', N'Sales');
IF NOT EXISTS (SELECT 1 FROM Roles WHERE RoleName = 'StockManager') INSERT INTO Roles (RoleName, Description) VALUES ('StockManager', N'Quản lý kho');
IF NOT EXISTS (SELECT 1 FROM Roles WHERE RoleName = 'Worker')       INSERT INTO Roles (RoleName, Description) VALUES ('Worker', N'Nhân viên kho');

DECLARE @ManagerRoleId INT = (SELECT Id FROM Roles WHERE RoleName = 'Manager');
DECLARE @SalesRoleId   INT = (SELECT Id FROM Roles WHERE RoleName = 'Sales');
DECLARE @StockRoleId   INT = (SELECT Id FROM Roles WHERE RoleName = 'StockManager');
DECLARE @WorkerRoleId  INT = (SELECT Id FROM Roles WHERE RoleName = 'Worker');

-- =============================================================================
-- 3) AppUsers demo (placeholder bcrypt hash 60 ký tự — KHÔNG dùng để login thật;
--    chỉ để FK hợp lệ. Login bằng admin/123456 có sẵn.)
-- =============================================================================

DECLARE @PwdPlaceholder NVARCHAR(MAX) = '$2a$11$ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyzAB';

DECLARE @Users TABLE (Username NVARCHAR(100), Id INT);
INSERT INTO AppUsers (Username, PasswordHash, FullName, Email, Phone, RoleId, Status, CreatedAt)
OUTPUT INSERTED.Username, INSERTED.Id INTO @Users
VALUES
  ('demo_manager', @PwdPlaceholder, N'Demo Manager',     'manager@demo.local', '0911000001', @ManagerRoleId, 'Active', @Now),
  ('demo_sales1',  @PwdPlaceholder, N'Trần Văn A',       'sales1@demo.local',  '0911000002', @SalesRoleId,   'Active', @Now),
  ('demo_sales2',  @PwdPlaceholder, N'Lê Thị B',         'sales2@demo.local',  '0911000003', @SalesRoleId,   'Active', @Now),
  ('demo_stock',   @PwdPlaceholder, N'Nguyễn Văn Kho',   'stock@demo.local',   '0911000004', @StockRoleId,   'Active', @Now),
  ('demo_worker',  @PwdPlaceholder, N'Phạm Văn Worker',  'worker@demo.local',  '0911000005', @WorkerRoleId,  'Active', @Now);

DECLARE @ManagerId INT = (SELECT Id FROM @Users WHERE Username = 'demo_manager');
DECLARE @Sales1Id  INT = (SELECT Id FROM @Users WHERE Username = 'demo_sales1');
DECLARE @Sales2Id  INT = (SELECT Id FROM @Users WHERE Username = 'demo_sales2');
DECLARE @StockId   INT = (SELECT Id FROM @Users WHERE Username = 'demo_stock');
DECLARE @WorkerId  INT = (SELECT Id FROM @Users WHERE Username = 'demo_worker');

-- =============================================================================
-- 4) Customers (5 B2C + 5 B2B). DebtBalance khác nhau cho top-debtors.
-- =============================================================================

DECLARE @Customers TABLE (Phone NVARCHAR(50), Id INT);
INSERT INTO Customers (CustomerType, FullName, Email, Phone, PasswordHash, CompanyName, TaxCode, CompanyAddress, DebtBalance, CreatedAt)
OUTPUT INSERTED.Phone, INSERTED.Id INTO @Customers
VALUES
  ('B2C', N'Khách Lẻ 1', 'b2c1@demo.local', '0900-0001', NULL, NULL,                 NULL,         NULL,            0,        DATEADD(DAY, -28, @Now)),
  ('B2C', N'Khách Lẻ 2', 'b2c2@demo.local', '0900-0002', NULL, NULL,                 NULL,         NULL,            0,        DATEADD(DAY, -25, @Now)),
  ('B2C', N'Khách Lẻ 3', 'b2c3@demo.local', '0900-0003', NULL, NULL,                 NULL,         NULL,            0,        DATEADD(DAY, -20, @Now)),
  ('B2C', N'Khách Lẻ 4', 'b2c4@demo.local', '0900-0004', NULL, NULL,                 NULL,         NULL,            0,        DATEADD(DAY, -15, @Now)),
  ('B2C', N'Khách Lẻ 5', 'b2c5@demo.local', '0900-0005', NULL, NULL,                 NULL,         NULL,            0,        DATEADD(DAY,  -8, @Now)),
  ('B2B', N'KH B2B 1',   'b2b1@demo.local', '0900-1001', NULL, N'Công ty TNHH ABC',  '0312345671', N'Hà Nội',       25000000, DATEADD(DAY, -29, @Now)),
  ('B2B', N'KH B2B 2',   'b2b2@demo.local', '0900-1002', NULL, N'Công ty CP XYZ',    '0312345672', N'Hà Nội',       18000000, DATEADD(DAY, -27, @Now)),
  ('B2B', N'KH B2B 3',   'b2b3@demo.local', '0900-1003', NULL, N'Công ty CP MNO',    '0312345673', N'TP HCM',       12500000, DATEADD(DAY, -22, @Now)),
  ('B2B', N'KH B2B 4',   'b2b4@demo.local', '0900-1004', NULL, N'Công ty TNHH PQR',  '0312345674', N'Đà Nẵng',       5500000, DATEADD(DAY, -10, @Now)),
  ('B2B', N'KH B2B 5',   'b2b5@demo.local', '0900-1005', NULL, N'Công ty STU',       '0312345675', N'Hải Phòng',     1500000, DATEADD(DAY,  -5, @Now));

DECLARE @C1 INT = (SELECT Id FROM @Customers WHERE Phone = '0900-0001');
DECLARE @C2 INT = (SELECT Id FROM @Customers WHERE Phone = '0900-0002');
DECLARE @C3 INT = (SELECT Id FROM @Customers WHERE Phone = '0900-0003');
DECLARE @C4 INT = (SELECT Id FROM @Customers WHERE Phone = '0900-0004');
DECLARE @C5 INT = (SELECT Id FROM @Customers WHERE Phone = '0900-0005');
DECLARE @B1 INT = (SELECT Id FROM @Customers WHERE Phone = '0900-1001');
DECLARE @B2 INT = (SELECT Id FROM @Customers WHERE Phone = '0900-1002');
DECLARE @B3 INT = (SELECT Id FROM @Customers WHERE Phone = '0900-1003');
DECLARE @B4 INT = (SELECT Id FROM @Customers WHERE Phone = '0900-1004');
DECLARE @B5 INT = (SELECT Id FROM @Customers WHERE Phone = '0900-1005');

-- =============================================================================
-- 5) CustomerAddresses (1 default mỗi khách)
-- =============================================================================

DECLARE @Addresses TABLE (CustomerId INT, Id INT);
INSERT INTO CustomerAddresses (CustomerId, ReceiverName, ReceiverPhone, AddressLine, IsDefault)
OUTPUT INSERTED.CustomerId, INSERTED.Id INTO @Addresses
VALUES
  (@C1, N'KL 1',   '0900-0001', N'Số 1, Hà Nội',           1),
  (@C2, N'KL 2',   '0900-0002', N'Số 2, Hà Nội',           1),
  (@C3, N'KL 3',   '0900-0003', N'Số 3, TP HCM',           1),
  (@C4, N'KL 4',   '0900-0004', N'Số 4, Đà Nẵng',          1),
  (@C5, N'KL 5',   '0900-0005', N'Số 5, Hải Phòng',        1),
  (@B1, N'CT ABC', '0900-1001', N'Lô A, KCN Bắc Thăng Long',1),
  (@B2, N'CT XYZ', '0900-1002', N'Lô B, KCN Sài Đồng',     1),
  (@B3, N'CT MNO', '0900-1003', N'Lô C, KCN Tân Bình',     1),
  (@B4, N'CT PQR', '0900-1004', N'Lô D, KCN Hòa Khánh',    1),
  (@B5, N'CT STU', '0900-1005', N'Lô E, KCN Đình Vũ',      1);

DECLARE @AddrC1 INT = (SELECT TOP 1 Id FROM @Addresses WHERE CustomerId = @C1 ORDER BY Id);
DECLARE @AddrC2 INT = (SELECT TOP 1 Id FROM @Addresses WHERE CustomerId = @C2 ORDER BY Id);
DECLARE @AddrC3 INT = (SELECT TOP 1 Id FROM @Addresses WHERE CustomerId = @C3 ORDER BY Id);
DECLARE @AddrC4 INT = (SELECT TOP 1 Id FROM @Addresses WHERE CustomerId = @C4 ORDER BY Id);
DECLARE @AddrC5 INT = (SELECT TOP 1 Id FROM @Addresses WHERE CustomerId = @C5 ORDER BY Id);
DECLARE @AddrB1 INT = (SELECT TOP 1 Id FROM @Addresses WHERE CustomerId = @B1 ORDER BY Id);
DECLARE @AddrB2 INT = (SELECT TOP 1 Id FROM @Addresses WHERE CustomerId = @B2 ORDER BY Id);
DECLARE @AddrB3 INT = (SELECT TOP 1 Id FROM @Addresses WHERE CustomerId = @B3 ORDER BY Id);
DECLARE @AddrB4 INT = (SELECT TOP 1 Id FROM @Addresses WHERE CustomerId = @B4 ORDER BY Id);
DECLARE @AddrB5 INT = (SELECT TOP 1 Id FROM @Addresses WHERE CustomerId = @B5 ORDER BY Id);

-- =============================================================================
-- 6) Categories + Products + ProductVariants (7 SKU)
-- =============================================================================

DECLARE @Categories TABLE (Slug NVARCHAR(450), Id INT);
INSERT INTO Categories (Name, Slug)
OUTPUT INSERTED.Slug, INSERTED.Id INTO @Categories
VALUES
  (N'Demo Sofa',       'demo-sofa'),
  (N'Demo Bàn ghế',    'demo-table-chair'),
  (N'Demo Giường',     'demo-bed');

DECLARE @CatSofa  INT = (SELECT Id FROM @Categories WHERE Slug = 'demo-sofa');
DECLARE @CatTbl   INT = (SELECT Id FROM @Categories WHERE Slug = 'demo-table-chair');
DECLARE @CatBed   INT = (SELECT Id FROM @Categories WHERE Slug = 'demo-bed');

DECLARE @Products TABLE (Slug NVARCHAR(450), Id INT);
INSERT INTO Products (CategoryId, Name, Slug, Description, BasePrice, WarrantyPeriodMonths, Status)
OUTPUT INSERTED.Slug, INSERTED.Id INTO @Products
VALUES
  (@CatSofa, N'Sofa Demo Bộ 3',     'demo-sofa-3',  N'Sofa demo bộ 3 chỗ',  12000000, 24, 'Active'),
  (@CatBed,  N'Giường Demo King',   'demo-bed-king', N'Giường king size',   18000000, 36, 'Active'),
  (@CatTbl,  N'Bàn ăn Demo 4 ghế',  'demo-table-4', N'Bàn ăn 4 ghế',         5500000, 12, 'Active');

DECLARE @ProdSofa  INT = (SELECT Id FROM @Products WHERE Slug = 'demo-sofa-3');
DECLARE @ProdBed   INT = (SELECT Id FROM @Products WHERE Slug = 'demo-bed-king');
DECLARE @ProdTbl   INT = (SELECT Id FROM @Products WHERE Slug = 'demo-table-4');

DECLARE @Variants TABLE (Sku NVARCHAR(450), Id INT);
INSERT INTO ProductVariants (ProductId, Sku, VariantName, RetailPrice, CostPrice)
OUTPUT INSERTED.Sku, INSERTED.Id INTO @Variants
VALUES
  (@ProdSofa, 'DEMO-SOFA-RED', N'Sofa Demo Đỏ',     12500000,  8000000),
  (@ProdSofa, 'DEMO-SOFA-GRY', N'Sofa Demo Xám',    12500000,  8000000),
  (@ProdSofa, 'DEMO-SOFA-BLU', N'Sofa Demo Xanh',   13000000,  8500000),
  (@ProdBed,  'DEMO-BED-WHT',  N'Giường Demo Trắng', 18500000, 12000000),
  (@ProdBed,  'DEMO-BED-OAK',  N'Giường Demo Sồi',  19500000, 13000000),
  (@ProdTbl,  'DEMO-TBL-OAK',  N'Bàn Demo Sồi',      5500000,  3500000),
  (@ProdTbl,  'DEMO-TBL-WAL',  N'Bàn Demo Walnut',   6000000,  4000000);

DECLARE @VSofaRed INT = (SELECT Id FROM @Variants WHERE Sku = 'DEMO-SOFA-RED');
DECLARE @VSofaGry INT = (SELECT Id FROM @Variants WHERE Sku = 'DEMO-SOFA-GRY');
DECLARE @VSofaBlu INT = (SELECT Id FROM @Variants WHERE Sku = 'DEMO-SOFA-BLU');
DECLARE @VBedWht  INT = (SELECT Id FROM @Variants WHERE Sku = 'DEMO-BED-WHT');
DECLARE @VBedOak  INT = (SELECT Id FROM @Variants WHERE Sku = 'DEMO-BED-OAK');
DECLARE @VTblOak  INT = (SELECT Id FROM @Variants WHERE Sku = 'DEMO-TBL-OAK');
DECLARE @VTblWal  INT = (SELECT Id FROM @Variants WHERE Sku = 'DEMO-TBL-WAL');

-- =============================================================================
-- 7) Inventories — có low stock + ReorderPoint cho dashboard inventory
-- =============================================================================

INSERT INTO Inventories (VariantId, WarehouseLocation, QuantityOnHand, QuantityReserved, QuantityAvailable, ReorderPoint, SafetyStock)
VALUES
  (@VSofaRed, 'K1-A1',  8,  5,  3, 10, 5),  -- LOW + reserve nhiều
  (@VSofaGry, 'K1-A2', 25,  4, 21, 15, 8),
  (@VSofaBlu, 'K1-A3', 12,  0, 12, 10, 5),
  (@VBedWht,  'K2-B1', 18,  2, 16, 12, 5),
  (@VBedOak,  'K2-B2',  6,  1,  5,  8, 3),  -- LOW
  (@VTblOak,  'K3-C1', 40,  6, 34, 20, 10),
  (@VTblWal,  'K3-C2', 22,  3, 19, 20, 8);  -- gần ngưỡng reorder

-- =============================================================================
-- 8) InventoryTransactions — spread 30 ngày, IN/OUT/RESERVE/RELEASE/ADJUST
--    Dùng vòng lặp tạo lên xuống tự nhiên cho trend chart.
-- =============================================================================

DECLARE @i INT = 0;
DECLARE @DayUtc DATETIME2;
WHILE @i < 30
BEGIN
  SET @DayUtc = DATEADD(DAY, -@i, @Now);

  -- IN refill 5 ngày/lần (tạo peak)
  IF @i % 5 = 0
  BEGIN
    INSERT INTO InventoryTransactions (VariantId, TransactionType, Quantity, ReferenceType, ReferenceId, WorkerIdAssigned, Timestamp, Notes)
    VALUES
      (@VSofaGry, 'IN', 10 + (@i % 4), 'DEMO', CAST(@i AS NVARCHAR(50)), @StockId, @DayUtc, 'DEMO refill'),
      (@VBedWht,  'IN',  5 + (@i % 3), 'DEMO', CAST(@i AS NVARCHAR(50)), @StockId, @DayUtc, 'DEMO refill');
  END;

  -- OUT đều (dùng %3 và %4 để biên độ khác nhau giữa các ngày)
  INSERT INTO InventoryTransactions (VariantId, TransactionType, Quantity, ReferenceType, ReferenceId, WorkerIdAssigned, Timestamp, Notes)
  VALUES
    (@VSofaRed, 'OUT', 1 + (@i % 3), 'DEMO', CAST(@i AS NVARCHAR(50)), @WorkerId, @DayUtc, 'DEMO out'),
    (@VSofaGry, 'OUT', 1 + (@i % 4), 'DEMO', CAST(@i AS NVARCHAR(50)), @WorkerId, @DayUtc, 'DEMO out');

  IF @i % 3 = 0
    INSERT INTO InventoryTransactions (VariantId, TransactionType, Quantity, ReferenceType, ReferenceId, WorkerIdAssigned, Timestamp, Notes)
    VALUES (@VBedWht, 'OUT', 1 + (@i % 2), 'DEMO', CAST(@i AS NVARCHAR(50)), @WorkerId, @DayUtc, 'DEMO out');

  IF @i % 7 = 0
    INSERT INTO InventoryTransactions (VariantId, TransactionType, Quantity, ReferenceType, ReferenceId, WorkerIdAssigned, Timestamp, Notes)
    VALUES (@VBedOak, 'OUT', 2, 'DEMO', CAST(@i AS NVARCHAR(50)), @WorkerId, @DayUtc, 'DEMO out');

  IF @i % 4 = 0
    INSERT INTO InventoryTransactions (VariantId, TransactionType, Quantity, ReferenceType, ReferenceId, WorkerIdAssigned, Timestamp, Notes)
    VALUES (@VTblOak, 'RESERVE', 2, 'DEMO', CAST(@i AS NVARCHAR(50)), @StockId, @DayUtc, 'DEMO reserve');

  IF @i % 6 = 0
    INSERT INTO InventoryTransactions (VariantId, TransactionType, Quantity, ReferenceType, ReferenceId, WorkerIdAssigned, Timestamp, Notes)
    VALUES (@VTblOak, 'RELEASE', 1, 'DEMO', CAST(@i AS NVARCHAR(50)), @StockId, @DayUtc, 'DEMO release');

  IF @i = 10 OR @i = 20
    INSERT INTO InventoryTransactions (VariantId, TransactionType, Quantity, ReferenceType, ReferenceId, WorkerIdAssigned, Timestamp, Notes)
    VALUES (@VSofaBlu, 'ADJUST', 1, 'DEMO', CAST(@i AS NVARCHAR(50)), @StockId, @DayUtc, 'DEMO adjust');

  SET @i = @i + 1;
END;

-- =============================================================================
-- 9) Quotes — đầy đủ trạng thái cho funnel + expiring-soon
-- =============================================================================

DECLARE @Quotes TABLE (QuoteCode NVARCHAR(450), Id INT);
INSERT INTO Quotes (QuoteCode, CustomerId, SalesId, ManagerId, TotalAmount, FinalAmount, DiscountType, DiscountValue, Status, CreatedAt, ValidUntil, ApprovedAt, RejectedAt, CustomerAcceptedAt, CustomerRejectedAt)
OUTPUT INSERTED.QuoteCode, INSERTED.Id INTO @Quotes
VALUES
  -- Requested
  ('DEMO-Q-001', @B1, @Sales1Id, NULL,         25000000, 25000000, NULL,      NULL,    'Requested',        DATEADD(DAY,  -2, @Now), NULL,                       NULL,                       NULL,                       NULL,                       NULL),
  ('DEMO-Q-002', @B2, @Sales2Id, NULL,         35000000, 35000000, NULL,      NULL,    'Requested',        DATEADD(DAY,  -1, @Now), NULL,                       NULL,                       NULL,                       NULL,                       NULL),
  -- Draft
  ('DEMO-Q-003', @B3, @Sales1Id, NULL,         18000000, 17000000, 'Percent', 5,       'Draft',            DATEADD(DAY, -10, @Now), NULL,                       NULL,                       NULL,                       NULL,                       NULL),
  ('DEMO-Q-004', @B1, @Sales2Id, NULL,         50000000, 47000000, 'Percent', 6,       'Draft',            DATEADD(DAY,  -8, @Now), NULL,                       NULL,                       NULL,                       NULL,                       NULL),
  -- PendingApproval
  ('DEMO-Q-005', @B2, @Sales1Id, NULL,         22000000, 21000000, 'Percent', 5,       'PendingApproval',  DATEADD(DAY,  -7, @Now), NULL,                       NULL,                       NULL,                       NULL,                       NULL),
  -- Approved (sắp hết hạn → expiring-soon)
  ('DEMO-Q-006', @B4, @Sales2Id, @ManagerId,   12500000, 11500000, 'Percent', 8,       'Approved',         DATEADD(DAY, -12, @Now), DATEADD(DAY,  3, @Now),    DATEADD(DAY, -10, @Now),    NULL,                       NULL,                       NULL),
  ('DEMO-Q-007', @B5, @Sales1Id, @ManagerId,    8500000,  8000000, 'Amount',  500000,  'Approved',         DATEADD(DAY,  -6, @Now), DATEADD(DAY,  1, @Now),    DATEADD(DAY,  -5, @Now),    NULL,                       NULL,                       NULL),
  -- CustomerAccepted
  ('DEMO-Q-008', @B3, @Sales2Id, @ManagerId,   30000000, 28000000, 'Percent', 7,       'CustomerAccepted', DATEADD(DAY, -15, @Now), DATEADD(DAY,  5, @Now),    DATEADD(DAY, -13, @Now),    NULL,                       DATEADD(DAY, -11, @Now),    NULL),
  -- Converted (đã ra đơn)
  ('DEMO-Q-009', @B1, @Sales1Id, @ManagerId,   45000000, 42000000, 'Percent', 7,       'Converted',        DATEADD(DAY, -20, @Now), DATEADD(DAY, 10, @Now),    DATEADD(DAY, -18, @Now),    NULL,                       DATEADD(DAY, -16, @Now),    NULL),
  ('DEMO-Q-010', @B2, @Sales2Id, @ManagerId,   60000000, 56000000, 'Percent', 7,       'Converted',        DATEADD(DAY, -25, @Now), DATEADD(DAY,  5, @Now),    DATEADD(DAY, -23, @Now),    NULL,                       DATEADD(DAY, -21, @Now),    NULL),
  -- Rejected (Manager từ chối)
  ('DEMO-Q-011', @B4, @Sales1Id, @ManagerId,   15000000, 15000000, NULL,      NULL,    'Rejected',         DATEADD(DAY, -14, @Now), NULL,                       NULL,                       DATEADD(DAY, -12, @Now),    NULL,                       NULL),
  -- CounterOffer
  ('DEMO-Q-012', @B5, @Sales2Id, @ManagerId,    9500000,  9000000, 'Percent', 5,       'CounterOffer',     DATEADD(DAY,  -3, @Now), DATEADD(DAY,  7, @Now),    DATEADD(DAY,  -2, @Now),    NULL,                       NULL,                       NULL),
  -- Expired
  ('DEMO-Q-013', @B3, @Sales1Id, @ManagerId,   11000000, 10000000, 'Amount',  1000000, 'Expired',          DATEADD(DAY, -50, @Now), DATEADD(DAY, -20, @Now),   DATEADD(DAY, -45, @Now),    NULL,                       NULL,                       NULL);

DECLARE @Q9  INT = (SELECT Id FROM @Quotes WHERE QuoteCode = 'DEMO-Q-009');
DECLARE @Q10 INT = (SELECT Id FROM @Quotes WHERE QuoteCode = 'DEMO-Q-010');

-- QuoteItems gọn (1 dòng/quote, demo dữ liệu)
INSERT INTO QuoteItems (QuoteId, VariantId, Quantity, UnitPrice, SubTotal)
SELECT q.Id, @VSofaGry, 2, 12500000, 25000000 FROM @Quotes q WHERE q.QuoteCode = 'DEMO-Q-001'
UNION ALL SELECT q.Id, @VBedWht, 2, 17500000, 35000000 FROM @Quotes q WHERE q.QuoteCode = 'DEMO-Q-002'
UNION ALL SELECT q.Id, @VTblOak, 3,  6000000, 18000000 FROM @Quotes q WHERE q.QuoteCode = 'DEMO-Q-003'
UNION ALL SELECT q.Id, @VBedOak, 2, 19500000, 39000000 FROM @Quotes q WHERE q.QuoteCode = 'DEMO-Q-004'
UNION ALL SELECT q.Id, @VSofaBlu, 2, 11000000, 22000000 FROM @Quotes q WHERE q.QuoteCode = 'DEMO-Q-005'
UNION ALL SELECT q.Id, @VSofaRed, 1, 12500000, 12500000 FROM @Quotes q WHERE q.QuoteCode = 'DEMO-Q-006'
UNION ALL SELECT q.Id, @VTblWal, 1,  8500000,  8500000 FROM @Quotes q WHERE q.QuoteCode = 'DEMO-Q-007'
UNION ALL SELECT q.Id, @VBedWht, 2, 15000000, 30000000 FROM @Quotes q WHERE q.QuoteCode = 'DEMO-Q-008'
UNION ALL SELECT q.Id, @VSofaGry, 3, 15000000, 45000000 FROM @Quotes q WHERE q.QuoteCode = 'DEMO-Q-009'
UNION ALL SELECT q.Id, @VBedOak, 3, 20000000, 60000000 FROM @Quotes q WHERE q.QuoteCode = 'DEMO-Q-010'
UNION ALL SELECT q.Id, @VTblOak, 3,  5000000, 15000000 FROM @Quotes q WHERE q.QuoteCode = 'DEMO-Q-011'
UNION ALL SELECT q.Id, @VTblWal, 1,  9500000,  9500000 FROM @Quotes q WHERE q.QuoteCode = 'DEMO-Q-012'
UNION ALL SELECT q.Id, @VSofaBlu, 1, 11000000, 11000000 FROM @Quotes q WHERE q.QuoteCode = 'DEMO-Q-013';

-- =============================================================================
-- 10) Orders ([Order]) — spread 30 ngày, mix B2C/B2B, mix status
-- =============================================================================

DECLARE @Orders TABLE (OrderCode NVARCHAR(450), Id INT);
INSERT INTO [Order] (OrderCode, CustomerId, QuoteId, ContractId, SalesId, VoucherId, PaymentMethod, PaymentStatus, OrderStatus, ShippingAddressId, CreatedAt, MerchandiseTotal, DiscountTotal, PayableTotal)
OUTPUT INSERTED.OrderCode, INSERTED.Id INTO @Orders
VALUES
  -- B2C
  ('DEMO-O-B2C-01', @C1, NULL, NULL, NULL,      NULL, 'PayOS',        'Paid',          'Completed',   @AddrC1, DATEADD(DAY, -28, @Now), 12500000,       0, 12500000),
  ('DEMO-O-B2C-02', @C2, NULL, NULL, NULL,      NULL, 'PayOS',        'Paid',          'Delivered',   @AddrC2, DATEADD(DAY, -22, @Now),  6500000,       0,  6500000),
  ('DEMO-O-B2C-03', @C3, NULL, NULL, NULL,      NULL, 'PayOS',        'Paid',          'Shipped',     @AddrC3, DATEADD(DAY, -10, @Now), 18500000,       0, 18500000),
  ('DEMO-O-B2C-04', @C4, NULL, NULL, NULL,      NULL, 'Cash',         'Unpaid',        'New',         @AddrC4, DATEADD(DAY,  -6, @Now),  5500000,       0,  5500000),
  ('DEMO-O-B2C-05', @C5, NULL, NULL, NULL,      NULL, 'PayOS',        'Paid',          'Confirmed',   @AddrC5, DATEADD(DAY,  -5, @Now), 12500000,       0, 12500000),
  ('DEMO-O-B2C-06', @C1, NULL, NULL, NULL,      NULL, 'PayOS',        'Paid',          'Processing',  @AddrC1, DATEADD(DAY,  -4, @Now), 18500000,       0, 18500000),
  ('DEMO-O-B2C-07', @C2, NULL, NULL, NULL,      NULL, 'PayOS',        'Refunded',      'Cancelled',   @AddrC2, DATEADD(DAY, -18, @Now),  5500000,       0,  5500000),
  ('DEMO-O-B2C-08', @C3, NULL, NULL, NULL,      NULL, 'PayOS',        'Paid',          'Completed',   @AddrC3, DATEADD(DAY, -16, @Now),  6500000,       0,  6500000),
  ('DEMO-O-B2C-09', @C4, NULL, NULL, NULL,      NULL, 'PayOS',        'Paid',          'Completed',   @AddrC4, DATEADD(DAY, -12, @Now), 12500000,       0, 12500000),
  ('DEMO-O-B2C-10', @C5, NULL, NULL, NULL,      NULL, 'PayOS',        'Paid',          'ReadyToShip', @AddrC5, DATEADD(DAY,  -2, @Now), 18500000,       0, 18500000),
  -- B2B
  ('DEMO-O-B2B-01', @B1, @Q9,  NULL, @Sales1Id, NULL, 'BankTransfer', 'PartiallyPaid', 'Completed',   @AddrB1, DATEADD(DAY, -16, @Now), 45000000, 3000000, 42000000),
  ('DEMO-O-B2B-02', @B2, @Q10, NULL, @Sales2Id, NULL, 'BankTransfer', 'Paid',          'Delivered',   @AddrB2, DATEADD(DAY, -19, @Now), 60000000, 4000000, 56000000),
  ('DEMO-O-B2B-03', @B3, NULL, NULL, @Sales1Id, NULL, 'BankTransfer', 'PartiallyPaid', 'Processing',  @AddrB3, DATEADD(DAY, -14, @Now), 30000000, 2000000, 28000000),
  ('DEMO-O-B2B-04', @B4, NULL, NULL, @Sales2Id, NULL, 'BankTransfer', 'Unpaid',        'Confirmed',   @AddrB4, DATEADD(DAY,  -3, @Now), 25000000,       0, 25000000),
  ('DEMO-O-B2B-05', @B1, NULL, NULL, @Sales1Id, NULL, 'BankTransfer', 'Unpaid',        'ReadyToShip', @AddrB1, DATEADD(DAY,  -8, @Now), 35000000, 2000000, 33000000),  -- LATE > 72h
  ('DEMO-O-B2B-06', @B5, NULL, NULL, @Sales2Id, NULL, 'BankTransfer', 'Paid',          'Shipped',     @AddrB5, DATEADD(DAY,  -7, @Now), 22000000, 1000000, 21000000),
  ('DEMO-O-B2B-07', @B2, NULL, NULL, @Sales1Id, NULL, 'BankTransfer', 'Unpaid',        'Cancelled',   @AddrB2, DATEADD(DAY, -20, @Now), 18000000,       0, 18000000),
  ('DEMO-O-B2B-08', @B3, NULL, NULL, @Sales2Id, NULL, 'BankTransfer', 'Paid',          'Completed',   @AddrB3, DATEADD(DAY, -25, @Now), 28000000, 2000000, 26000000);

DECLARE @OB2C1 INT = (SELECT Id FROM @Orders WHERE OrderCode = 'DEMO-O-B2C-01');
DECLARE @OB2C2 INT = (SELECT Id FROM @Orders WHERE OrderCode = 'DEMO-O-B2C-02');
DECLARE @OB2C3 INT = (SELECT Id FROM @Orders WHERE OrderCode = 'DEMO-O-B2C-03');
DECLARE @OB2C5 INT = (SELECT Id FROM @Orders WHERE OrderCode = 'DEMO-O-B2C-05');
DECLARE @OB2C6 INT = (SELECT Id FROM @Orders WHERE OrderCode = 'DEMO-O-B2C-06');
DECLARE @OB2C8 INT = (SELECT Id FROM @Orders WHERE OrderCode = 'DEMO-O-B2C-08');
DECLARE @OB2C9 INT = (SELECT Id FROM @Orders WHERE OrderCode = 'DEMO-O-B2C-09');
DECLARE @OB2C10 INT = (SELECT Id FROM @Orders WHERE OrderCode = 'DEMO-O-B2C-10');
DECLARE @OB2B1  INT = (SELECT Id FROM @Orders WHERE OrderCode = 'DEMO-O-B2B-01');
DECLARE @OB2B2  INT = (SELECT Id FROM @Orders WHERE OrderCode = 'DEMO-O-B2B-02');
DECLARE @OB2B3  INT = (SELECT Id FROM @Orders WHERE OrderCode = 'DEMO-O-B2B-03');
DECLARE @OB2B4  INT = (SELECT Id FROM @Orders WHERE OrderCode = 'DEMO-O-B2B-04');
DECLARE @OB2B5  INT = (SELECT Id FROM @Orders WHERE OrderCode = 'DEMO-O-B2B-05');
DECLARE @OB2B6  INT = (SELECT Id FROM @Orders WHERE OrderCode = 'DEMO-O-B2B-06');
DECLARE @OB2B8  INT = (SELECT Id FROM @Orders WHERE OrderCode = 'DEMO-O-B2B-08');

-- OrderItems (1-2 dòng/đơn)
INSERT INTO OrderItems (OrderId, VariantId, SkuSnapshot, PriceSnapshot, Quantity, SubTotal)
VALUES
  (@OB2C1, @VSofaRed, 'DEMO-SOFA-RED', 12500000, 1, 12500000),
  (@OB2C2, @VTblWal,  'DEMO-TBL-WAL',   6500000, 1,  6500000),
  (@OB2C3, @VBedWht,  'DEMO-BED-WHT',  18500000, 1, 18500000),
  (@OB2C5, @VSofaRed, 'DEMO-SOFA-RED', 12500000, 1, 12500000),
  (@OB2C6, @VBedWht,  'DEMO-BED-WHT',  18500000, 1, 18500000),
  (@OB2C8, @VTblWal,  'DEMO-TBL-WAL',   6500000, 1,  6500000),
  (@OB2C9, @VSofaRed, 'DEMO-SOFA-RED', 12500000, 1, 12500000),
  (@OB2C10,@VBedWht,  'DEMO-BED-WHT',  18500000, 1, 18500000),
  (@OB2B1, @VSofaGry, 'DEMO-SOFA-GRY', 12500000, 3, 37500000),
  (@OB2B1, @VTblOak,  'DEMO-TBL-OAK',   5500000, 1,  5500000),
  (@OB2B2, @VBedOak,  'DEMO-BED-OAK',  19500000, 3, 58500000),
  (@OB2B3, @VBedWht,  'DEMO-BED-WHT',  18500000, 1, 18500000),
  (@OB2B3, @VSofaBlu, 'DEMO-SOFA-BLU', 13000000, 1, 13000000),
  (@OB2B4, @VSofaBlu, 'DEMO-SOFA-BLU', 13000000, 2, 26000000),
  (@OB2B5, @VSofaGry, 'DEMO-SOFA-GRY', 12500000, 3, 37500000),
  (@OB2B6, @VTblOak,  'DEMO-TBL-OAK',   5500000, 4, 22000000),
  (@OB2B8, @VBedOak,  'DEMO-BED-OAK',  19500000, 1, 19500000);

-- =============================================================================
-- 11) Invoices — DueDate trải khắp các bucket aging (Current, 1-30, 31-60, 61-90, >90)
-- =============================================================================

DECLARE @Invoices TABLE (InvoiceNumber NVARCHAR(450), Id INT);
INSERT INTO Invoices (InvoiceNumber, OrderId, ContractId, CustomerId, TaxCode, CompanyName, BillingAddress, SubTotal, TaxAmount, TotalAmount, IssueDate, DueDate, Status)
OUTPUT INSERTED.InvoiceNumber, INSERTED.Id INTO @Invoices
VALUES
  -- Paid (đã đóng)
  ('DEMO-INV-001', @OB2B2, NULL, @B2, '0312345672', N'Công ty CP XYZ',    N'Hà Nội',     56000000, 0, 56000000, DATEADD(DAY, -19, @Now), DATEADD(DAY, 11, @Now), 'Paid'),
  ('DEMO-INV-002', @OB2B8, NULL, @B3, '0312345673', N'Công ty CP MNO',    N'TP HCM',     26000000, 0, 26000000, DATEADD(DAY, -25, @Now), DATEADD(DAY,  5, @Now), 'Paid'),
  -- PartiallyPaid (chưa hết)
  ('DEMO-INV-003', @OB2B1, NULL, @B1, '0312345671', N'Công ty TNHH ABC',  N'Hà Nội',     42000000, 0, 42000000, DATEADD(DAY, -16, @Now), DATEADD(DAY, 14, @Now), 'PartiallyPaid'),
  ('DEMO-INV-004', @OB2B3, NULL, @B3, '0312345673', N'Công ty CP MNO',    N'TP HCM',     28000000, 0, 28000000, DATEADD(DAY, -14, @Now), DATEADD(DAY, 16, @Now), 'PartiallyPaid'),
  -- Unpaid current (chưa đến hạn)
  ('DEMO-INV-005', @OB2B4, NULL, @B4, '0312345674', N'Công ty TNHH PQR',  N'Đà Nẵng',    25000000, 0, 25000000, DATEADD(DAY,  -3, @Now), DATEADD(DAY, 27, @Now), 'Unpaid'),
  -- Unpaid due-soon (trong 7 ngày)
  ('DEMO-INV-006', @OB2B5, NULL, @B1, '0312345671', N'Công ty TNHH ABC',  N'Hà Nội',     33000000, 0, 33000000, DATEADD(DAY, -28, @Now), DATEADD(DAY,  2, @Now), 'Unpaid'),
  -- Overdue 1-30
  ('DEMO-INV-007', NULL,   NULL, @B2, '0312345672', N'Công ty CP XYZ',    N'Hà Nội',      8500000, 0,  8500000, DATEADD(DAY, -45, @Now), DATEADD(DAY, -15, @Now), 'Overdue'),
  -- Overdue 31-60
  ('DEMO-INV-008', NULL,   NULL, @B3, '0312345673', N'Công ty CP MNO',    N'TP HCM',     12500000, 0, 12500000, DATEADD(DAY, -75, @Now), DATEADD(DAY, -45, @Now), 'Overdue'),
  -- Overdue 61-90
  ('DEMO-INV-009', NULL,   NULL, @B4, '0312345674', N'Công ty TNHH PQR',  N'Đà Nẵng',     5500000, 0,  5500000, DATEADD(DAY,-110, @Now), DATEADD(DAY, -75, @Now), 'Overdue'),
  -- Overdue >90
  ('DEMO-INV-010', NULL,   NULL, @B1, '0312345671', N'Công ty TNHH ABC',  N'Hà Nội',      4000000, 0,  4000000, DATEADD(DAY,-150, @Now), DATEADD(DAY,-120, @Now), 'Overdue'),
  -- Cancelled (không tính trong AR)
  ('DEMO-INV-011', NULL, NULL, @B2, '0312345672', N'Công ty CP XYZ', N'Hà Nội', 18000000, 0, 18000000, DATEADD(DAY, -20, @Now), DATEADD(DAY,  10, @Now), 'Cancelled');

DECLARE @InvId1 INT = (SELECT Id FROM @Invoices WHERE InvoiceNumber = 'DEMO-INV-001');
DECLARE @InvId2 INT = (SELECT Id FROM @Invoices WHERE InvoiceNumber = 'DEMO-INV-002');
DECLARE @InvId3 INT = (SELECT Id FROM @Invoices WHERE InvoiceNumber = 'DEMO-INV-003');
DECLARE @InvId4 INT = (SELECT Id FROM @Invoices WHERE InvoiceNumber = 'DEMO-INV-004');
DECLARE @InvId5 INT = (SELECT Id FROM @Invoices WHERE InvoiceNumber = 'DEMO-INV-005');
DECLARE @InvId6 INT = (SELECT Id FROM @Invoices WHERE InvoiceNumber = 'DEMO-INV-006');

-- =============================================================================
-- 12) PaymentTransactions — Income/Outcome trải 30 ngày để vẽ timeseries
-- =============================================================================

INSERT INTO PaymentTransactions (CustomerId, InvoiceId, Amount, PaymentMethod, TransactionType, PaymentDate, ReferenceCode, Note)
VALUES
  -- B2C PayOS (income)
  (@C1, NULL,      12500000, 'PayOS',        'Payment',           DATEADD(DAY, -28, @Now), 'DEMO-PAY-001', 'PayOS B2C-01'),
  (@C2, NULL,       6500000, 'PayOS',        'Payment',           DATEADD(DAY, -22, @Now), 'DEMO-PAY-002', 'PayOS B2C-02'),
  (@C3, NULL,      18500000, 'PayOS',        'Payment',           DATEADD(DAY, -10, @Now), 'DEMO-PAY-003', 'PayOS B2C-03'),
  (@C5, NULL,      12500000, 'PayOS',        'Payment',           DATEADD(DAY,  -5, @Now), 'DEMO-PAY-004', 'PayOS B2C-05'),
  (@C1, NULL,      18500000, 'PayOS',        'Payment',           DATEADD(DAY,  -4, @Now), 'DEMO-PAY-005', 'PayOS B2C-06'),
  (@C3, NULL,       6500000, 'PayOS',        'Payment',           DATEADD(DAY, -16, @Now), 'DEMO-PAY-006', 'PayOS B2C-08'),
  (@C4, NULL,      12500000, 'PayOS',        'Payment',           DATEADD(DAY, -12, @Now), 'DEMO-PAY-007', 'PayOS B2C-09'),
  (@C5, NULL,      18500000, 'PayOS',        'Payment',           DATEADD(DAY,  -2, @Now), 'DEMO-PAY-008', 'PayOS B2C-10'),
  -- B2C refund (outcome)
  (@C2, NULL,       5500000, 'PayOS',        'Refund',            DATEADD(DAY, -17, @Now), 'DEMO-PAY-009', 'Refund B2C-07'),
  -- B2B BankTransfer (income)
  (@B2, @InvId1,   56000000, 'BankTransfer', 'Payment',           DATEADD(DAY, -17, @Now), 'DEMO-PAY-010', 'CK B2B-02'),
  (@B3, @InvId2,   26000000, 'BankTransfer', 'Payment',           DATEADD(DAY, -23, @Now), 'DEMO-PAY-011', 'CK B2B-08'),
  (@B1, @InvId3,   20000000, 'BankTransfer', 'Payment',           DATEADD(DAY, -14, @Now), 'DEMO-PAY-012', 'CK đợt 1 B2B-01'),
  (@B3, @InvId4,   10000000, 'BankTransfer', 'Payment',           DATEADD(DAY, -12, @Now), 'DEMO-PAY-013', 'CK đợt 1 B2B-03'),
  -- B2B điều chỉnh tăng (income)
  (@B1, @InvId3,    1500000, 'BankTransfer', 'AdjustmentIncrease',DATEADD(DAY,  -7, @Now), 'DEMO-PAY-014', 'Điều chỉnh tăng'),
  -- B2B điều chỉnh giảm (outcome)
  (@B2, NULL,        500000, 'BankTransfer', 'AdjustmentDecrease',DATEADD(DAY, -11, @Now), 'DEMO-PAY-015', 'Điều chỉnh giảm');

-- =============================================================================
-- 13) FulfillmentTickets — Pending/Picking/Packed/Shipped + UpdatedAt cho SLA
-- =============================================================================

INSERT INTO FulfillmentTickets (OrderId, TicketType, AssignedWorkerId, Status, CreatedBy, CreatedAt, UpdatedAt, Notes)
VALUES
  -- Đã shipped: tính SLA Confirmed → Shipped
  (@OB2C1,  'Picking', @WorkerId, 'Shipped',   @StockId, DATEADD(DAY, -27, @Now), DATEADD(DAY, -25, @Now), 'DEMO ship'),  -- ~48h
  (@OB2C2,  'Picking', @WorkerId, 'Shipped',   @StockId, DATEADD(DAY, -21, @Now), DATEADD(DAY, -20, @Now), 'DEMO ship'),  -- ~24h
  (@OB2C3,  'Picking', @WorkerId, 'Shipped',   @StockId, DATEADD(DAY,  -9, @Now), DATEADD(DAY,  -8, @Now), 'DEMO ship'),  -- ~24h
  (@OB2C8,  'Picking', @WorkerId, 'Shipped',   @StockId, DATEADD(DAY, -15, @Now), DATEADD(DAY, -14, @Now), 'DEMO ship'),
  (@OB2C9,  'Picking', @WorkerId, 'Shipped',   @StockId, DATEADD(DAY, -11, @Now), DATEADD(DAY, -10, @Now), 'DEMO ship'),
  (@OB2B1,  'Picking', @WorkerId, 'Shipped',   @StockId, DATEADD(DAY, -15, @Now), DATEADD(DAY, -13, @Now), 'DEMO ship'),
  (@OB2B2,  'Picking', @WorkerId, 'Shipped',   @StockId, DATEADD(DAY, -18, @Now), DATEADD(DAY, -17, @Now), 'DEMO ship'),
  (@OB2B6,  'Picking', @WorkerId, 'Shipped',   @StockId, DATEADD(DAY,  -6, @Now), DATEADD(DAY,  -5, @Now), 'DEMO ship'),
  (@OB2B8,  'Picking', @WorkerId, 'Shipped',   @StockId, DATEADD(DAY, -24, @Now), DATEADD(DAY, -22, @Now), 'DEMO ship'),  -- 48h
  -- Đang xử lý
  (@OB2C5,  'Picking', @WorkerId, 'Picking',   @StockId, DATEADD(DAY,  -5, @Now), DATEADD(DAY,  -4, @Now), 'DEMO picking'),
  (@OB2C6,  'Picking', @WorkerId, 'Packed',    @StockId, DATEADD(DAY,  -3, @Now), DATEADD(DAY,  -1, @Now), 'DEMO packed'),
  (@OB2C10, 'Picking', @WorkerId, 'Pending',   @StockId, DATEADD(DAY,  -1, @Now), NULL,                     'DEMO pending'),
  (@OB2B3,  'Picking', @WorkerId, 'Picking',   @StockId, DATEADD(DAY, -13, @Now), DATEADD(DAY,  -8, @Now), 'DEMO picking'),
  (@OB2B4,  'Picking', @WorkerId, 'Pending',   @StockId, DATEADD(DAY,  -2, @Now), NULL,                     'DEMO pending'),
  (@OB2B5,  'Picking', @WorkerId, 'Pending',   @StockId, DATEADD(DAY,  -7, @Now), NULL,                     'DEMO pending late');

-- =============================================================================
-- 14) TransferNotifications (mục 9 store B2B + dashboard ar-related)
-- =============================================================================

INSERT INTO TransferNotifications (CustomerId, InvoiceId, ReferenceCode, Amount, Note, AttachmentUrl, Status, ProcessNote, ProcessedBy, CreatedAt, ProcessedAt)
VALUES
  (@B1, @InvId3, 'DEMO-CK-001',  20000000, N'CK đợt 1 đơn B2B-01', NULL, 'Verified', N'Khớp lệnh', @ManagerId, DATEADD(DAY, -14, @Now), DATEADD(DAY, -13, @Now)),
  (@B3, @InvId4, 'DEMO-CK-002',  10000000, N'CK đợt 1 đơn B2B-03', NULL, 'Verified', N'Khớp lệnh', @ManagerId, DATEADD(DAY, -12, @Now), DATEADD(DAY, -11, @Now)),
  (@B4, @InvId5, 'DEMO-CK-003',  25000000, N'CK đặt cọc',          NULL, 'Pending',  NULL,         NULL,       DATEADD(DAY,  -2, @Now), NULL),
  (@B1, @InvId6, 'DEMO-CK-004',  33000000, N'CK toàn bộ B2B-05',   NULL, 'Pending',  NULL,         NULL,       DATEADD(DAY,  -1, @Now), NULL),
  (@B2, NULL,    'DEMO-CK-005',   1500000, N'CK chứng từ sai',     NULL, 'Rejected', N'Mã CK không khớp ngân hàng', @ManagerId, DATEADD(DAY, -3, @Now), DATEADD(DAY, -2, @Now));

COMMIT TRAN;
PRINT 'Demo data seeded successfully.';
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK TRAN;
    DECLARE @ErrMsg NVARCHAR(4000) = ERROR_MESSAGE();
    DECLARE @ErrLine INT = ERROR_LINE();
    PRINT 'ERROR at line ' + CAST(@ErrLine AS NVARCHAR(20)) + ': ' + @ErrMsg;
    THROW;
END CATCH;

-- =============================================================================
-- Sau khi chạy, dashboard có dữ liệu lên xuống cho:
--   /api/admin/dashboard/revenue/timeseries          (line/area)
--   /api/admin/dashboard/revenue/by-payment-method   (donut PayOS / BankTransfer / Cash)
--   /api/admin/dashboard/revenue/by-channel          (B2C vs B2B stacked)
--   /api/admin/dashboard/revenue/overview            (KPI)
--   /api/admin/dashboard/ar/aging                    (5 buckets có dữ liệu)
--   /api/admin/dashboard/ar/top-debtors              (5 KH B2B có DebtBalance)
--   /api/admin/dashboard/ar/timeseries               (snapshot remaining/overdue)
--   /api/admin/dashboard/sales-pipeline/funnel       (đủ 6 trạng thái chính)
--   /api/admin/dashboard/sales-pipeline/conversion   (có ApprovedAt/CustomerAcceptedAt)
--   /api/admin/dashboard/sales-pipeline/expiring-soon (Q006/Q007 sắp hết hạn)
--   /api/admin/dashboard/inventory/low-stock         (SOFA-RED, BED-OAK)
--   /api/admin/dashboard/inventory/days-of-cover     (avg OUT 30 ngày)
--   /api/admin/dashboard/inventory/transactions-trend (5 type)
--   /api/admin/dashboard/inventory/top-moving        (SKU OUT nhiều)
--   /api/admin/dashboard/operations/order-status-breakdown (đủ status)
--   /api/admin/dashboard/operations/fulfillment-status     (Pending/Picking/Packed/Shipped)
--   /api/admin/dashboard/operations/sla-confirmed-to-shipped (avg/p50/p90 + histogram)
--   /api/admin/dashboard/operations/late-orders            (DEMO-O-B2B-05 trễ 8 ngày)
--   /api/admin/dashboard/sales-performance/top-sales       (sales1, sales2)
--   /api/admin/dashboard/sales-performance/per-sales-detail (?salesId=<demo_sales1.Id>)
--   /api/admin/dashboard/sales-performance/quote-conversion-by-sales
-- =============================================================================
