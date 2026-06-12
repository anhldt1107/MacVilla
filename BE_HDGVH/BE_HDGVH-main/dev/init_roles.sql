-- =============================================================================
-- Khởi tạo bảng Roles (SQL Server) — khớp BE_API.Authorization.AppRoles
-- Phụ thuộc: migration đã tạo bảng [Roles] (Id identity, RoleName nvarchar(100),
--            Description / Permissions nvarchar(max) nullable).
-- Idempotent: chỉ INSERT khi chưa có RoleName tương ứng (không xóa / không đổi Id).
-- Chạy: SSMS / Azure Data Studio kết nối DB BE_API.
-- =============================================================================

SET NOCOUNT ON;

IF OBJECT_ID(N'dbo.Roles', N'U') IS NULL
BEGIN
    RAISERROR(N'Bảng dbo.Roles chưa tồn tại. Chạy dotnet ef database update / migrate app trước.', 16, 1);
    RETURN;
END;

-- admin — chữ thường, khớp JWT claim và Policies.AdminOnly
IF NOT EXISTS (SELECT 1 FROM dbo.Roles WHERE RoleName = N'admin')
    INSERT INTO dbo.Roles (RoleName, Description, Permissions)
    VALUES (N'admin', N'System administrator', NULL);

IF NOT EXISTS (SELECT 1 FROM dbo.Roles WHERE RoleName = N'Manager')
    INSERT INTO dbo.Roles (RoleName, Description, Permissions)
    VALUES (N'Manager', N'Quản lý', NULL);

IF NOT EXISTS (SELECT 1 FROM dbo.Roles WHERE RoleName = N'Sales')
    INSERT INTO dbo.Roles (RoleName, Description, Permissions)
    VALUES (N'Sales', N'Nhân viên kinh doanh / sales', NULL);

IF NOT EXISTS (SELECT 1 FROM dbo.Roles WHERE RoleName = N'StockManager')
    INSERT INTO dbo.Roles (RoleName, Description, Permissions)
    VALUES (N'StockManager', N'Quản lý kho', NULL);

IF NOT EXISTS (SELECT 1 FROM dbo.Roles WHERE RoleName = N'Worker')
    INSERT INTO dbo.Roles (RoleName, Description, Permissions)
    VALUES (N'Worker', N'Nhân viên kho', NULL);

SELECT Id, RoleName, Description FROM dbo.Roles ORDER BY Id;
