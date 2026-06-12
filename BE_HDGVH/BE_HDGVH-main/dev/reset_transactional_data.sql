-- =============================================================================
-- RESET dữ liệu nghiệp vụ — chạy tay trên SQL Server (dev/staging)
--
-- GIỮ LẠI:
--   • Roles, AppUsers (tài khoản nội bộ)
--   • Customers, CustomerAddresses (khách + địa chỉ)
--   • Categories, Products, ProductAttributes, ProductAttributeValues, ProductVariants
--   • Inventories (tồn kho hiện tại — chỉ xóa lịch sử giao dịch kho)
--   • PromotionCampaigns, Vouchers (master khuyến mãi — reset UsedCount về 0)
--
-- XÓA / RESET:
--   • Báo giá, hợp đồng, đơn hàng, phiếu xuất, hóa đơn, thanh toán, công nợ
--   • Bảo hành, đổi/trả, giỏ hàng, thông báo CK, AI chat
--   • Customer.DebtBalance → 0, Inventories.QuantityReserved → 0, Vouchers.UsedCount → 0
--
-- CẢNH BÁO: Không chạy trên production nếu chưa backup. Thao tác không hoàn tác.
-- Cách chạy: SSMS / Azure Data Studio → chọn đúng database BE → Execute toàn file.
-- =============================================================================

SET NOCOUNT ON;
SET XACT_ABORT ON;

BEGIN TRY
    BEGIN TRAN;

    PRINT N'[1/6] AI chat…';
    IF OBJECT_ID(N'AiChatMessages', N'U') IS NOT NULL DELETE FROM AiChatMessages;
    IF OBJECT_ID(N'AiChatThreads', N'U') IS NOT NULL DELETE FROM AiChatThreads;

    PRINT N'[2/6] Thanh toán / công nợ / hậu mãi…';
    IF OBJECT_ID(N'TransferNotifications', N'U') IS NOT NULL DELETE FROM TransferNotifications;
    IF OBJECT_ID(N'PaymentTransactions', N'U') IS NOT NULL DELETE FROM PaymentTransactions;
    IF OBJECT_ID(N'ReturnItems', N'U') IS NOT NULL DELETE FROM ReturnItems;
    IF OBJECT_ID(N'ReturnExchangeTickets', N'U') IS NOT NULL DELETE FROM ReturnExchangeTickets;
    IF OBJECT_ID(N'WarrantyClaims', N'U') IS NOT NULL DELETE FROM WarrantyClaims;
    IF OBJECT_ID(N'WarrantyTicketLines', N'U') IS NOT NULL DELETE FROM WarrantyTicketLines;
    IF OBJECT_ID(N'WarrantyTickets', N'U') IS NOT NULL DELETE FROM WarrantyTickets;

    PRINT N'[3/6] Đơn hàng / kho / hóa đơn…';
    IF OBJECT_ID(N'FulfillmentTickets', N'U') IS NOT NULL DELETE FROM FulfillmentTickets;
    IF OBJECT_ID(N'OrderStatusHistory', N'U') IS NOT NULL DELETE FROM OrderStatusHistory;
    IF OBJECT_ID(N'Invoices', N'U') IS NOT NULL DELETE FROM Invoices;
    IF OBJECT_ID(N'OrderItems', N'U') IS NOT NULL DELETE FROM OrderItems;
    IF OBJECT_ID(N'[Order]', N'U') IS NOT NULL DELETE FROM [Order];

    PRINT N'[4/6] Báo giá / hợp đồng…';
    IF OBJECT_ID(N'Contracts', N'U') IS NOT NULL DELETE FROM Contracts;
    IF OBJECT_ID(N'QuoteItems', N'U') IS NOT NULL DELETE FROM QuoteItems;
    IF OBJECT_ID(N'Quotes', N'U') IS NOT NULL DELETE FROM Quotes;

    PRINT N'[5/6] Lịch sử kho / giỏ hàng…';
    IF OBJECT_ID(N'InventoryTransactions', N'U') IS NOT NULL DELETE FROM InventoryTransactions;
    IF OBJECT_ID(N'ShoppingCartItems', N'U') IS NOT NULL DELETE FROM ShoppingCartItems;
    IF OBJECT_ID(N'ShoppingCarts', N'U') IS NOT NULL DELETE FROM ShoppingCarts;

    PRINT N'[6/6] Reset số dư công nợ, tồn giữ chỗ, lượt dùng voucher…';
    UPDATE Customers SET DebtBalance = 0;
    UPDATE Inventories SET QuantityReserved = 0;
    IF OBJECT_ID(N'Vouchers', N'U') IS NOT NULL
        UPDATE Vouchers SET UsedCount = 0;

    -- Reseed IDENTITY (tuỳ chọn — ID mới bắt đầu từ 1 cho bảng đã xóa sạch)
    IF OBJECT_ID(N'Quotes', N'U') IS NOT NULL
        AND NOT EXISTS (SELECT 1 FROM Quotes)
        DBCC CHECKIDENT ('Quotes', RESEED, 0);

    IF OBJECT_ID(N'[Order]', N'U') IS NOT NULL
        AND NOT EXISTS (SELECT 1 FROM [Order])
        DBCC CHECKIDENT ('Order', RESEED, 0);

    IF OBJECT_ID(N'Invoices', N'U') IS NOT NULL
        AND NOT EXISTS (SELECT 1 FROM Invoices)
        DBCC CHECKIDENT ('Invoices', RESEED, 0);

    IF OBJECT_ID(N'PaymentTransactions', N'U') IS NOT NULL
        AND NOT EXISTS (SELECT 1 FROM PaymentTransactions)
        DBCC CHECKIDENT ('PaymentTransactions', RESEED, 0);

    IF OBJECT_ID(N'FulfillmentTickets', N'U') IS NOT NULL
        AND NOT EXISTS (SELECT 1 FROM FulfillmentTickets)
        DBCC CHECKIDENT ('FulfillmentTickets', RESEED, 0);

    COMMIT TRAN;

    PRINT N'';
    PRINT N'✓ Hoàn tất reset dữ liệu nghiệp vụ.';
    PRINT N'  Giữ: AppUsers, Roles, Customers, CustomerAddresses, catalog sản phẩm, Inventories, PromotionCampaigns, Vouchers.';
    PRINT N'  Đã xóa: báo giá, đơn, hóa đơn, thanh toán, phiếu kho, bảo hành/đổi trả, lịch sử giao dịch kho, giỏ hàng.';
    PRINT N'  DebtBalance = 0; QuantityReserved = 0; Vouchers.UsedCount = 0.';

END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK TRAN;

    DECLARE @Err NVARCHAR(4000) = ERROR_MESSAGE();
    DECLARE @Line INT = ERROR_LINE();
    RAISERROR(N'Reset thất bại (dòng %d): %s', 16, 1, @Line, @Err);
END CATCH;

-- Kiểm tra nhanh sau khi chạy (uncomment nếu cần):
/*
SELECT 'Quotes' AS Tbl, COUNT(*) AS Cnt FROM Quotes
UNION ALL SELECT 'Order', COUNT(*) FROM [Order]
UNION ALL SELECT 'Invoices', COUNT(*) FROM Invoices
UNION ALL SELECT 'PaymentTransactions', COUNT(*) FROM PaymentTransactions
UNION ALL SELECT 'Customers', COUNT(*) FROM Customers
UNION ALL SELECT 'ProductVariants', COUNT(*) FROM ProductVariants
UNION ALL SELECT 'AppUsers', COUNT(*) FROM AppUsers
UNION ALL SELECT 'Debt>0', COUNT(*) FROM Customers WHERE DebtBalance <> 0
UNION ALL SELECT 'PromotionCampaigns', COUNT(*) FROM PromotionCampaigns
UNION ALL SELECT 'Vouchers', COUNT(*) FROM Vouchers
UNION ALL SELECT 'VoucherUsed>0', COUNT(*) FROM Vouchers WHERE UsedCount > 0;
*/
