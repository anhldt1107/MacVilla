-- Migration: luồng đơn post-Confirmed — audit + cột fulfillment
-- Chạy trên SQL Server production sau khi deploy BE fulfillment mới.
-- Lưu ý: EF map bảng audit tên OrderStatusHistory (không phải OrderStatusHistories).

-- 1) Cột audit trên đơn
IF COL_LENGTH('[Order]', 'UpdatedAt') IS NULL
    ALTER TABLE [Order] ADD UpdatedAt DATETIME2 NULL;

IF COL_LENGTH('[Order]', 'CancelledAt') IS NULL
    ALTER TABLE [Order] ADD CancelledAt DATETIME2 NULL;

IF COL_LENGTH('[Order]', 'CancelReason') IS NULL
    ALTER TABLE [Order] ADD CancelReason NVARCHAR(1000) NULL;

-- 2) Bảng lịch sử trạng thái đơn (tên bảng phải khớp BeContext.ToTable)
IF OBJECT_ID(N'OrderStatusHistories', N'U') IS NOT NULL
   AND OBJECT_ID(N'OrderStatusHistory', N'U') IS NULL
BEGIN
    EXEC sp_rename N'OrderStatusHistories', N'OrderStatusHistory';
END;

IF OBJECT_ID(N'OrderStatusHistory', N'U') IS NULL
BEGIN
    CREATE TABLE OrderStatusHistory (
        Id INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        OrderId INT NOT NULL,
        FromStatus NVARCHAR(50) NOT NULL,
        ToStatus NVARCHAR(50) NOT NULL,
        Note NVARCHAR(1000) NULL,
        Source NVARCHAR(50) NOT NULL CONSTRAINT DF_OrderStatusHistory_Source DEFAULT ('OrderManual'),
        ActorUserId INT NULL,
        CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_OrderStatusHistory_CreatedAt DEFAULT (SYSUTCDATETIME()),
        CONSTRAINT FK_OrderStatusHistory_Order FOREIGN KEY (OrderId) REFERENCES [Order](Id) ON DELETE CASCADE,
        CONSTRAINT FK_OrderStatusHistory_Actor FOREIGN KEY (ActorUserId) REFERENCES AppUsers(Id) ON DELETE SET NULL
    );
    CREATE INDEX IX_OrderStatusHistory_OrderId_CreatedAt ON OrderStatusHistory (OrderId, CreatedAt);
END;

-- Sửa FK Actor nếu script cũ trỏ nhầm AppUser (bảng không tồn tại)
IF OBJECT_ID(N'FK_OrderStatusHistory_Actor', N'F') IS NULL
   AND OBJECT_ID(N'OrderStatusHistory', N'U') IS NOT NULL
BEGIN
    ALTER TABLE OrderStatusHistory
        ADD CONSTRAINT FK_OrderStatusHistory_Actor
        FOREIGN KEY (ActorUserId) REFERENCES AppUsers(Id) ON DELETE SET NULL;
END;

-- 3) Cột phiếu công việc (EF migration AddFulfillmentTicketFields — hay thiếu trên DB cũ)
IF COL_LENGTH('FulfillmentTickets', 'CreatedAt') IS NULL
BEGIN
    ALTER TABLE FulfillmentTickets
        ADD CreatedAt DATETIME2 NOT NULL
            CONSTRAINT DF_FulfillmentTickets_CreatedAt DEFAULT (SYSUTCDATETIME());
END;

IF COL_LENGTH('FulfillmentTickets', 'Notes') IS NULL
    ALTER TABLE FulfillmentTickets ADD Notes NVARCHAR(MAX) NULL;

IF COL_LENGTH('FulfillmentTickets', 'UpdatedAt') IS NULL
    ALTER TABLE FulfillmentTickets ADD UpdatedAt DATETIME2 NULL;

-- 4) Kiểm tra nhanh (kết quả phải đều = 1)
SELECT
    CASE WHEN COL_LENGTH('[Order]', 'UpdatedAt') IS NOT NULL THEN 1 ELSE 0 END AS HasOrderUpdatedAt,
    CASE WHEN OBJECT_ID(N'OrderStatusHistory', N'U') IS NOT NULL THEN 1 ELSE 0 END AS HasOrderStatusHistory,
    CASE WHEN COL_LENGTH('FulfillmentTickets', 'CreatedAt') IS NOT NULL THEN 1 ELSE 0 END AS HasFulfillmentCreatedAt,
    CASE WHEN COL_LENGTH('FulfillmentTickets', 'Notes') IS NOT NULL THEN 1 ELSE 0 END AS HasFulfillmentNotes;
