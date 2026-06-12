-- Migration: bảo hành theo từng dòng đơn (WarrantyTicketLine + OrderItemId trên claim)
-- Chạy trên SQL Server sau khi deploy BE có WarrantyTicketLines.

-- 1) Bảng phạm vi BH theo OrderItem
IF OBJECT_ID(N'WarrantyTicketLines', N'U') IS NULL
BEGIN
    CREATE TABLE WarrantyTicketLines (
        Id INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        WarrantyTicketId INT NOT NULL,
        OrderItemId INT NOT NULL,
        VariantId INT NOT NULL,
        IssueDate DATETIME2 NOT NULL,
        ValidUntil DATETIME2 NOT NULL,
        WarrantyPeriodMonths INT NOT NULL CONSTRAINT DF_WarrantyTicketLines_Months DEFAULT (12),
        SkuSnapshot NVARCHAR(100) NULL,
        Quantity INT NOT NULL CONSTRAINT DF_WarrantyTicketLines_Qty DEFAULT (1),
        CONSTRAINT FK_WarrantyTicketLines_Ticket FOREIGN KEY (WarrantyTicketId) REFERENCES WarrantyTickets(Id) ON DELETE CASCADE,
        CONSTRAINT FK_WarrantyTicketLines_OrderItem FOREIGN KEY (OrderItemId) REFERENCES OrderItems(Id) ON DELETE NO ACTION,
        CONSTRAINT FK_WarrantyTicketLines_Variant FOREIGN KEY (VariantId) REFERENCES ProductVariants(Id) ON DELETE NO ACTION
    );
    CREATE UNIQUE INDEX UX_WarrantyTicketLines_Ticket_OrderItem
        ON WarrantyTicketLines (WarrantyTicketId, OrderItemId);
END;

-- 2) Claim gắn OrderItem
IF COL_LENGTH('WarrantyClaims', 'OrderItemId') IS NULL
    ALTER TABLE WarrantyClaims ADD OrderItemId INT NULL;

IF OBJECT_ID(N'FK_WarrantyClaims_OrderItem', N'F') IS NULL
   AND COL_LENGTH('WarrantyClaims', 'OrderItemId') IS NOT NULL
BEGIN
    ALTER TABLE WarrantyClaims
        ADD CONSTRAINT FK_WarrantyClaims_OrderItem
        FOREIGN KEY (OrderItemId) REFERENCES OrderItems(Id) ON DELETE NO ACTION;
END;

-- 3) Backfill lines từ phiếu + đơn hiện có
INSERT INTO WarrantyTicketLines (
    WarrantyTicketId, OrderItemId, VariantId, IssueDate, ValidUntil,
    WarrantyPeriodMonths, SkuSnapshot, Quantity)
SELECT
    wt.Id,
    oi.Id,
    oi.VariantId,
    wt.IssueDate,
    DATEADD(MONTH, CASE WHEN ISNULL(p.WarrantyPeriodMonths, 0) > 0 THEN p.WarrantyPeriodMonths ELSE 12 END, wt.IssueDate),
    CASE WHEN ISNULL(p.WarrantyPeriodMonths, 0) > 0 THEN p.WarrantyPeriodMonths ELSE 12 END,
    oi.SkuSnapshot,
    oi.Quantity
FROM WarrantyTickets wt
INNER JOIN [Order] o ON o.Id = wt.OrderId
INNER JOIN OrderItems oi ON oi.OrderId = o.Id
INNER JOIN ProductVariants pv ON pv.Id = oi.VariantId
INNER JOIN Products p ON p.Id = pv.ProductId
WHERE wt.OrderId IS NOT NULL
  AND NOT EXISTS (
      SELECT 1 FROM WarrantyTicketLines wtl
      WHERE wtl.WarrantyTicketId = wt.Id AND wtl.OrderItemId = oi.Id
  );

-- Cập nhật ValidUntil phiếu = max dòng (nếu có lines)
UPDATE wt
SET wt.ValidUntil = agg.MaxValidUntil
FROM WarrantyTickets wt
INNER JOIN (
    SELECT WarrantyTicketId, MAX(ValidUntil) AS MaxValidUntil
    FROM WarrantyTicketLines
    GROUP BY WarrantyTicketId
) agg ON agg.WarrantyTicketId = wt.Id
WHERE wt.ValidUntil IS NULL OR wt.ValidUntil < agg.MaxValidUntil;

-- 4) Backfill OrderItemId cho claim cũ (khớp duy nhất variant trên đơn của phiếu)
UPDATE wc
SET wc.OrderItemId = map.OrderItemId
FROM WarrantyClaims wc
INNER JOIN WarrantyTickets wt ON wt.Id = wc.WarrantyTicketId
INNER JOIN (
    SELECT wc2.Id AS ClaimId, MIN(oi.Id) AS OrderItemId, COUNT(*) AS Cnt
    FROM WarrantyClaims wc2
    INNER JOIN WarrantyTickets wt2 ON wt2.Id = wc2.WarrantyTicketId
    INNER JOIN OrderItems oi ON oi.OrderId = wt2.OrderId AND oi.VariantId = wc2.VariantId
    WHERE wc2.OrderItemId IS NULL AND wt2.OrderId IS NOT NULL
    GROUP BY wc2.Id
    HAVING COUNT(*) = 1
) map ON map.ClaimId = wc.Id
WHERE wc.OrderItemId IS NULL;

-- 5) Kiểm tra nhanh
SELECT
    CASE WHEN OBJECT_ID(N'WarrantyTicketLines', N'U') IS NOT NULL THEN 1 ELSE 0 END AS HasWarrantyTicketLines,
    CASE WHEN COL_LENGTH('WarrantyClaims', 'OrderItemId') IS NOT NULL THEN 1 ELSE 0 END AS HasClaimOrderItemId,
    (SELECT COUNT(*) FROM WarrantyTicketLines) AS LineCount,
    (SELECT COUNT(*) FROM WarrantyClaims WHERE OrderItemId IS NOT NULL) AS ClaimsWithOrderItem;
