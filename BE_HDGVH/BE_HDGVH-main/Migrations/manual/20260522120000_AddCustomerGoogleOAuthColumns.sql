/*
  Tương đương migration: 20260522120000_AddCustomerGoogleOAuthColumns
  Chạy thủ công trên SQL Server (SSMS / sqlcmd).

  QUAN TRỌNG: Phải có lệnh GO giữa các batch. SQL Server parse cả batch một lượt;
  nếu CREATE INDEX cùng batch với ADD COLUMN, sẽ lỗi "Invalid column name"
  dù đặt trong IF ... END (dòng ~53).

  Lưu ý: bảng mặc định dbo.Customers. Chỉ chạy một lần.
*/

SET NOCOUNT ON;

-- ========== Batch 1: cột ==========
IF EXISTS (
    SELECT 1
    FROM sys.columns c
    INNER JOIN sys.tables t ON c.object_id = t.object_id
    INNER JOIN sys.schemas s ON t.schema_id = s.schema_id
    WHERE s.name = N'dbo' AND t.name = N'Customers'
      AND c.name = N'Phone'
      AND c.is_nullable = 0
)
BEGIN
    ALTER TABLE dbo.Customers ALTER COLUMN Phone NVARCHAR(MAX) NULL;
END;

IF NOT EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID(N'dbo.Customers', N'U') AND name = N'GoogleSubject'
)
BEGIN
    ALTER TABLE dbo.Customers ADD GoogleSubject NVARCHAR(255) NULL;
END;

IF NOT EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID(N'dbo.Customers', N'U') AND name = N'GoogleEmailVerified'
)
BEGIN
    ALTER TABLE dbo.Customers ADD GoogleEmailVerified BIT NULL;
END;

IF NOT EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID(N'dbo.Customers', N'U') AND name = N'GoogleLinkedAtUtc'
)
BEGIN
    ALTER TABLE dbo.Customers ADD GoogleLinkedAtUtc DATETIME2 NULL;
END;

GO

-- ========== Batch 2: index (sau khi cột đã tồn tại) ==========
IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = N'IX_Customers_GoogleSubject' AND object_id = OBJECT_ID(N'dbo.Customers', N'U')
)
BEGIN
    CREATE UNIQUE INDEX IX_Customers_GoogleSubject
    ON dbo.Customers (GoogleSubject)
    WHERE [GoogleSubject] IS NOT NULL;
END;

GO

-- ========== Batch 3: lịch sử EF (tuỳ chọn) ==========
IF OBJECT_ID(N'dbo.__EFMigrationsHistory', N'U') IS NOT NULL
   AND NOT EXISTS (
       SELECT 1 FROM dbo.__EFMigrationsHistory
       WHERE MigrationId = N'20260522120000_AddCustomerGoogleOAuthColumns'
   )
BEGIN
    INSERT INTO dbo.__EFMigrationsHistory (MigrationId, ProductVersion)
    VALUES (N'20260522120000_AddCustomerGoogleOAuthColumns', N'9.0.7');
END;
