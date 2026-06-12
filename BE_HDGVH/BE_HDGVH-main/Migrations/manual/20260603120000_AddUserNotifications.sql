/*
  Tương đương migration: 20260603120000_AddUserNotifications
  Chạy thủ công trên SQL Server (SSMS / Azure Data Studio / sqlcmd).

  Tạo bảng inbox thông báo in-app (UserNotifications).
  Idempotent — an toàn chạy lại nếu bảng/index đã tồn tại.

  Lưu ý:
  - Bảng mặc định dbo.UserNotifications.
  - Ghi __EFMigrationsHistory (tuỳ chọn, tránh dotnet ef update chạy lại).
*/

SET NOCOUNT ON;

-- ========== Bảng ==========
IF OBJECT_ID(N'dbo.UserNotifications', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.UserNotifications
    (
        Id            INT            IDENTITY(1, 1) NOT NULL,
        RecipientKind NVARCHAR(20)   NOT NULL,
        RecipientId   INT            NOT NULL,
        EventType     NVARCHAR(80)   NOT NULL,
        Title         NVARCHAR(300)  NOT NULL,
        Body          NVARCHAR(MAX)  NULL,
        EntityType    NVARCHAR(50)   NULL,
        EntityId      NVARCHAR(100)  NULL,
        DeepLinkPath  NVARCHAR(500)  NOT NULL,
        Priority      NVARCHAR(20)   NOT NULL,
        CreatedAt     DATETIME2      NOT NULL,
        ReadAt        DATETIME2      NULL,
        CONSTRAINT PK_UserNotifications PRIMARY KEY CLUSTERED (Id)
    );
END;

-- ========== Index ==========
IF OBJECT_ID(N'dbo.UserNotifications', N'U') IS NOT NULL
   AND NOT EXISTS (
       SELECT 1
       FROM sys.indexes
       WHERE name = N'IX_UserNotifications_RecipientKind_RecipientId_ReadAt_CreatedAt'
         AND object_id = OBJECT_ID(N'dbo.UserNotifications', N'U')
   )
BEGIN
    CREATE NONCLUSTERED INDEX IX_UserNotifications_RecipientKind_RecipientId_ReadAt_CreatedAt
    ON dbo.UserNotifications (RecipientKind, RecipientId, ReadAt, CreatedAt);
END;

-- ========== Lịch sử EF (tuỳ chọn) ==========
IF OBJECT_ID(N'dbo.__EFMigrationsHistory', N'U') IS NOT NULL
   AND NOT EXISTS (
       SELECT 1
       FROM dbo.__EFMigrationsHistory
       WHERE MigrationId = N'20260603120000_AddUserNotifications'
   )
BEGIN
    INSERT INTO dbo.__EFMigrationsHistory (MigrationId, ProductVersion)
    VALUES (N'20260603120000_AddUserNotifications', N'9.0.7');
END;

-- Kiểm tra nhanh sau khi chạy:
-- SELECT TOP 5 * FROM dbo.UserNotifications ORDER BY Id DESC;
-- SELECT * FROM dbo.__EFMigrationsHistory WHERE MigrationId LIKE N'%UserNotifications%';
