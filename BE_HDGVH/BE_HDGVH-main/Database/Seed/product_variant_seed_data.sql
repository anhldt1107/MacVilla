/*
  Seed ProductVariants (+ Inventories) cho các sản phẩm trong product_seed_data.sql.

  Chạy sau: Database/Seed/product_seed_data.sql

  - Mỗi sản phẩm seed: 1 biến thể mặc định.
  - RetailPrice = CostPrice = 10000.00 (đồng giá).
  - ImageUrl: https://dovavietnam.com/wp-content/uploads/2024/09/ga-thoat-san-gs400.jpg
  - SKU: seed-v-{product-slug} (duy nhất toàn hệ thống).
  - Idempotent: bỏ qua nếu SKU đã tồn tại; tồn kho chỉ insert khi variant chưa có dòng Inventories.

  Tham khảo ảnh: https://dovavietnam.com/wp-content/uploads/2024/09/ga-thoat-san-gs400.jpg
*/

SET NOCOUNT ON;
SET XACT_ABORT ON;

DECLARE @Img nvarchar(max) =
    N'https://dovavietnam.com/wp-content/uploads/2024/09/ga-thoat-san-gs400.jpg';
DECLARE @Price decimal(18, 2) = 10000.00;
DECLARE @Wh nvarchar(max) = N'SEED-DEFAULT';

BEGIN TRANSACTION;

/* Helper: chèn variant nếu chưa có SKU */
-- Phòng khách
IF NOT EXISTS (SELECT 1 FROM ProductVariants WHERE Sku = N'seed-v-seed-sp-combo-trang-tri-phong-khach')
    INSERT INTO ProductVariants (ProductId, Sku, VariantName, RetailPrice, CostPrice, Weight, Dimensions, ImageUrl)
    SELECT p.Id, N'seed-v-seed-sp-combo-trang-tri-phong-khach', N'Mặc định (seed)', @Price, @Price, NULL, NULL, @Img
    FROM Products p WHERE p.Slug = N'seed-sp-combo-trang-tri-phong-khach';

IF NOT EXISTS (SELECT 1 FROM ProductVariants WHERE Sku = N'seed-v-seed-sp-sofa-goc-l')
    INSERT INTO ProductVariants (ProductId, Sku, VariantName, RetailPrice, CostPrice, Weight, Dimensions, ImageUrl)
    SELECT p.Id, N'seed-v-seed-sp-sofa-goc-l', N'Mặc định (seed)', @Price, @Price, NULL, NULL, @Img
    FROM Products p WHERE p.Slug = N'seed-sp-sofa-goc-l';

IF NOT EXISTS (SELECT 1 FROM ProductVariants WHERE Sku = N'seed-v-seed-sp-sofa-vang-dai')
    INSERT INTO ProductVariants (ProductId, Sku, VariantName, RetailPrice, CostPrice, Weight, Dimensions, ImageUrl)
    SELECT p.Id, N'seed-v-seed-sp-sofa-vang-dai', N'Mặc định (seed)', @Price, @Price, NULL, NULL, @Img
    FROM Products p WHERE p.Slug = N'seed-sp-sofa-vang-dai';

IF NOT EXISTS (SELECT 1 FROM ProductVariants WHERE Sku = N'seed-v-seed-sp-ban-tra-go-oc-cho')
    INSERT INTO ProductVariants (ProductId, Sku, VariantName, RetailPrice, CostPrice, Weight, Dimensions, ImageUrl)
    SELECT p.Id, N'seed-v-seed-sp-ban-tra-go-oc-cho', N'Mặc định (seed)', @Price, @Price, NULL, NULL, @Img
    FROM Products p WHERE p.Slug = N'seed-sp-ban-tra-go-oc-cho';

IF NOT EXISTS (SELECT 1 FROM ProductVariants WHERE Sku = N'seed-v-seed-sp-ke-tivi-2m')
    INSERT INTO ProductVariants (ProductId, Sku, VariantName, RetailPrice, CostPrice, Weight, Dimensions, ImageUrl)
    SELECT p.Id, N'seed-v-seed-sp-ke-tivi-2m', N'Mặc định (seed)', @Price, @Price, NULL, NULL, @Img
    FROM Products p WHERE p.Slug = N'seed-sp-ke-tivi-2m';

-- Phòng ngủ
IF NOT EXISTS (SELECT 1 FROM ProductVariants WHERE Sku = N'seed-v-seed-sp-set-rem-cua')
    INSERT INTO ProductVariants (ProductId, Sku, VariantName, RetailPrice, CostPrice, Weight, Dimensions, ImageUrl)
    SELECT p.Id, N'seed-v-seed-sp-set-rem-cua', N'Mặc định (seed)', @Price, @Price, NULL, NULL, @Img
    FROM Products p WHERE p.Slug = N'seed-sp-set-rem-cua';

IF NOT EXISTS (SELECT 1 FROM ProductVariants WHERE Sku = N'seed-v-seed-sp-giuong-queen-go')
    INSERT INTO ProductVariants (ProductId, Sku, VariantName, RetailPrice, CostPrice, Weight, Dimensions, ImageUrl)
    SELECT p.Id, N'seed-v-seed-sp-giuong-queen-go', N'Mặc định (seed)', @Price, @Price, NULL, NULL, @Img
    FROM Products p WHERE p.Slug = N'seed-sp-giuong-queen-go';

IF NOT EXISTS (SELECT 1 FROM ProductVariants WHERE Sku = N'seed-v-seed-sp-nem-cooling-180')
    INSERT INTO ProductVariants (ProductId, Sku, VariantName, RetailPrice, CostPrice, Weight, Dimensions, ImageUrl)
    SELECT p.Id, N'seed-v-seed-sp-nem-cooling-180', N'Mặc định (seed)', @Price, @Price, NULL, NULL, @Img
    FROM Products p WHERE p.Slug = N'seed-sp-nem-cooling-180';

IF NOT EXISTS (SELECT 1 FROM ProductVariants WHERE Sku = N'seed-v-seed-sp-tu-4-canh-trang')
    INSERT INTO ProductVariants (ProductId, Sku, VariantName, RetailPrice, CostPrice, Weight, Dimensions, ImageUrl)
    SELECT p.Id, N'seed-v-seed-sp-tu-4-canh-trang', N'Mặc định (seed)', @Price, @Price, NULL, NULL, @Img
    FROM Products p WHERE p.Slug = N'seed-sp-tu-4-canh-trang';

IF NOT EXISTS (SELECT 1 FROM ProductVariants WHERE Sku = N'seed-v-seed-sp-ban-trang-diem-led')
    INSERT INTO ProductVariants (ProductId, Sku, VariantName, RetailPrice, CostPrice, Weight, Dimensions, ImageUrl)
    SELECT p.Id, N'seed-v-seed-sp-ban-trang-diem-led', N'Mặc định (seed)', @Price, @Price, NULL, NULL, @Img
    FROM Products p WHERE p.Slug = N'seed-sp-ban-trang-diem-led';

-- Đèn
IF NOT EXISTS (SELECT 1 FROM ProductVariants WHERE Sku = N'seed-v-seed-sp-bong-led-a60')
    INSERT INTO ProductVariants (ProductId, Sku, VariantName, RetailPrice, CostPrice, Weight, Dimensions, ImageUrl)
    SELECT p.Id, N'seed-v-seed-sp-bong-led-a60', N'Mặc định (seed)', @Price, @Price, NULL, NULL, @Img
    FROM Products p WHERE p.Slug = N'seed-sp-bong-led-a60';

IF NOT EXISTS (SELECT 1 FROM ProductVariants WHERE Sku = N'seed-v-seed-sp-den-tha-thuy-tinh')
    INSERT INTO ProductVariants (ProductId, Sku, VariantName, RetailPrice, CostPrice, Weight, Dimensions, ImageUrl)
    SELECT p.Id, N'seed-v-seed-sp-den-tha-thuy-tinh', N'Mặc định (seed)', @Price, @Price, NULL, NULL, @Img
    FROM Products p WHERE p.Slug = N'seed-sp-den-tha-thuy-tinh';

IF NOT EXISTS (SELECT 1 FROM ProductVariants WHERE Sku = N'seed-v-seed-sp-den-led-op-tran')
    INSERT INTO ProductVariants (ProductId, Sku, VariantName, RetailPrice, CostPrice, Weight, Dimensions, ImageUrl)
    SELECT p.Id, N'seed-v-seed-sp-den-led-op-tran', N'Mặc định (seed)', @Price, @Price, NULL, NULL, @Img
    FROM Products p WHERE p.Slug = N'seed-sp-den-led-op-tran';

IF NOT EXISTS (SELECT 1 FROM ProductVariants WHERE Sku = N'seed-v-seed-sp-den-ban-hoc-sinh')
    INSERT INTO ProductVariants (ProductId, Sku, VariantName, RetailPrice, CostPrice, Weight, Dimensions, ImageUrl)
    SELECT p.Id, N'seed-v-seed-sp-den-ban-hoc-sinh', N'Mặc định (seed)', @Price, @Price, NULL, NULL, @Img
    FROM Products p WHERE p.Slug = N'seed-sp-den-ban-hoc-sinh';

IF NOT EXISTS (SELECT 1 FROM ProductVariants WHERE Sku = N'seed-v-seed-sp-led-day-10m')
    INSERT INTO ProductVariants (ProductId, Sku, VariantName, RetailPrice, CostPrice, Weight, Dimensions, ImageUrl)
    SELECT p.Id, N'seed-v-seed-sp-led-day-10m', N'Mặc định (seed)', @Price, @Price, NULL, NULL, @Img
    FROM Products p WHERE p.Slug = N'seed-sp-led-day-10m';

-- Bếp / gia dụng
IF NOT EXISTS (SELECT 1 FROM ProductVariants WHERE Sku = N'seed-v-seed-sp-tu-lanh-mini')
    INSERT INTO ProductVariants (ProductId, Sku, VariantName, RetailPrice, CostPrice, Weight, Dimensions, ImageUrl)
    SELECT p.Id, N'seed-v-seed-sp-tu-lanh-mini', N'Mặc định (seed)', @Price, @Price, NULL, NULL, @Img
    FROM Products p WHERE p.Slug = N'seed-sp-tu-lanh-mini';

IF NOT EXISTS (SELECT 1 FROM ProductVariants WHERE Sku = N'seed-v-seed-sp-bo-noi-inox-5')
    INSERT INTO ProductVariants (ProductId, Sku, VariantName, RetailPrice, CostPrice, Weight, Dimensions, ImageUrl)
    SELECT p.Id, N'seed-v-seed-sp-bo-noi-inox-5', N'Mặc định (seed)', @Price, @Price, NULL, NULL, @Img
    FROM Products p WHERE p.Slug = N'seed-sp-bo-noi-inox-5';

IF NOT EXISTS (SELECT 1 FROM ProductVariants WHERE Sku = N'seed-v-seed-sp-chao-chong-dinh-28')
    INSERT INTO ProductVariants (ProductId, Sku, VariantName, RetailPrice, CostPrice, Weight, Dimensions, ImageUrl)
    SELECT p.Id, N'seed-v-seed-sp-chao-chong-dinh-28', N'Mặc định (seed)', @Price, @Price, NULL, NULL, @Img
    FROM Products p WHERE p.Slug = N'seed-sp-chao-chong-dinh-28';

IF NOT EXISTS (SELECT 1 FROM ProductVariants WHERE Sku = N'seed-v-seed-sp-may-xay-da-nang')
    INSERT INTO ProductVariants (ProductId, Sku, VariantName, RetailPrice, CostPrice, Weight, Dimensions, ImageUrl)
    SELECT p.Id, N'seed-v-seed-sp-may-xay-da-nang', N'Mặc định (seed)', @Price, @Price, NULL, NULL, @Img
    FROM Products p WHERE p.Slug = N'seed-sp-may-xay-da-nang';

IF NOT EXISTS (SELECT 1 FROM ProductVariants WHERE Sku = N'seed-v-seed-sp-binh-gom-bat-trang')
    INSERT INTO ProductVariants (ProductId, Sku, VariantName, RetailPrice, CostPrice, Weight, Dimensions, ImageUrl)
    SELECT p.Id, N'seed-v-seed-sp-binh-gom-bat-trang', N'Mặc định (seed)', @Price, @Price, NULL, NULL, @Img
    FROM Products p WHERE p.Slug = N'seed-sp-binh-gom-bat-trang';

-- Văn phòng
IF NOT EXISTS (SELECT 1 FROM ProductVariants WHERE Sku = N'seed-v-seed-sp-guong-bo-tron-60')
    INSERT INTO ProductVariants (ProductId, Sku, VariantName, RetailPrice, CostPrice, Weight, Dimensions, ImageUrl)
    SELECT p.Id, N'seed-v-seed-sp-guong-bo-tron-60', N'Mặc định (seed)', @Price, @Price, NULL, NULL, @Img
    FROM Products p WHERE p.Slug = N'seed-sp-guong-bo-tron-60';

IF NOT EXISTS (SELECT 1 FROM ProductVariants WHERE Sku = N'seed-v-seed-sp-ban-lam-viec-12m')
    INSERT INTO ProductVariants (ProductId, Sku, VariantName, RetailPrice, CostPrice, Weight, Dimensions, ImageUrl)
    SELECT p.Id, N'seed-v-seed-sp-ban-lam-viec-12m', N'Mặc định (seed)', @Price, @Price, NULL, NULL, @Img
    FROM Products p WHERE p.Slug = N'seed-sp-ban-lam-viec-12m';

IF NOT EXISTS (SELECT 1 FROM ProductVariants WHERE Sku = N'seed-v-seed-sp-ghe-xoay-luoi')
    INSERT INTO ProductVariants (ProductId, Sku, VariantName, RetailPrice, CostPrice, Weight, Dimensions, ImageUrl)
    SELECT p.Id, N'seed-v-seed-sp-ghe-xoay-luoi', N'Mặc định (seed)', @Price, @Price, NULL, NULL, @Img
    FROM Products p WHERE p.Slug = N'seed-sp-ghe-xoay-luoi';

IF NOT EXISTS (SELECT 1 FROM ProductVariants WHERE Sku = N'seed-v-seed-sp-ke-sach-5-tang')
    INSERT INTO ProductVariants (ProductId, Sku, VariantName, RetailPrice, CostPrice, Weight, Dimensions, ImageUrl)
    SELECT p.Id, N'seed-v-seed-sp-ke-sach-5-tang', N'Mặc định (seed)', @Price, @Price, NULL, NULL, @Img
    FROM Products p WHERE p.Slug = N'seed-sp-ke-sach-5-tang';

-- Điện tử / linh kiện
IF NOT EXISTS (SELECT 1 FROM ProductVariants WHERE Sku = N'seed-v-seed-sp-lo-vi-song')
    INSERT INTO ProductVariants (ProductId, Sku, VariantName, RetailPrice, CostPrice, Weight, Dimensions, ImageUrl)
    SELECT p.Id, N'seed-v-seed-sp-lo-vi-song', N'Mặc định (seed)', @Price, @Price, NULL, NULL, @Img
    FROM Products p WHERE p.Slug = N'seed-sp-lo-vi-song';

IF NOT EXISTS (SELECT 1 FROM ProductVariants WHERE Sku = N'seed-v-seed-sp-op-lung-trong')
    INSERT INTO ProductVariants (ProductId, Sku, VariantName, RetailPrice, CostPrice, Weight, Dimensions, ImageUrl)
    SELECT p.Id, N'seed-v-seed-sp-op-lung-trong', N'Mặc định (seed)', @Price, @Price, NULL, NULL, @Img
    FROM Products p WHERE p.Slug = N'seed-sp-op-lung-trong';

IF NOT EXISTS (SELECT 1 FROM ProductVariants WHERE Sku = N'seed-v-seed-sp-sac-khong-day-15w')
    INSERT INTO ProductVariants (ProductId, Sku, VariantName, RetailPrice, CostPrice, Weight, Dimensions, ImageUrl)
    SELECT p.Id, N'seed-v-seed-sp-sac-khong-day-15w', N'Mặc định (seed)', @Price, @Price, NULL, NULL, @Img
    FROM Products p WHERE p.Slug = N'seed-sp-sac-khong-day-15w';

IF NOT EXISTS (SELECT 1 FROM ProductVariants WHERE Sku = N'seed-v-seed-sp-may-hut-bui-cam-tay')
    INSERT INTO ProductVariants (ProductId, Sku, VariantName, RetailPrice, CostPrice, Weight, Dimensions, ImageUrl)
    SELECT p.Id, N'seed-v-seed-sp-may-hut-bui-cam-tay', N'Mặc định (seed)', @Price, @Price, NULL, NULL, @Img
    FROM Products p WHERE p.Slug = N'seed-sp-may-hut-bui-cam-tay';

IF NOT EXISTS (SELECT 1 FROM ProductVariants WHERE Sku = N'seed-v-seed-sp-cay-lau-360')
    INSERT INTO ProductVariants (ProductId, Sku, VariantName, RetailPrice, CostPrice, Weight, Dimensions, ImageUrl)
    SELECT p.Id, N'seed-v-seed-sp-cay-lau-360', N'Mặc định (seed)', @Price, @Price, NULL, NULL, @Img
    FROM Products p WHERE p.Slug = N'seed-sp-cay-lau-360';

-- Ngoài trời / vườn / WC
IF NOT EXISTS (SELECT 1 FROM ProductVariants WHERE Sku = N'seed-v-seed-sp-bon-cau-mot-khoi')
    INSERT INTO ProductVariants (ProductId, Sku, VariantName, RetailPrice, CostPrice, Weight, Dimensions, ImageUrl)
    SELECT p.Id, N'seed-v-seed-sp-bon-cau-mot-khoi', N'Mặc định (seed)', @Price, @Price, NULL, NULL, @Img
    FROM Products p WHERE p.Slug = N'seed-sp-bon-cau-mot-khoi';

IF NOT EXISTS (SELECT 1 FROM ProductVariants WHERE Sku = N'seed-v-seed-sp-voi-tuoi-cay')
    INSERT INTO ProductVariants (ProductId, Sku, VariantName, RetailPrice, CostPrice, Weight, Dimensions, ImageUrl)
    SELECT p.Id, N'seed-v-seed-sp-voi-tuoi-cay', N'Mặc định (seed)', @Price, @Price, NULL, NULL, @Img
    FROM Products p WHERE p.Slug = N'seed-sp-voi-tuoi-cay';

IF NOT EXISTS (SELECT 1 FROM ProductVariants WHERE Sku = N'seed-v-seed-sp-chau-dat-nung')
    INSERT INTO ProductVariants (ProductId, Sku, VariantName, RetailPrice, CostPrice, Weight, Dimensions, ImageUrl)
    SELECT p.Id, N'seed-v-seed-sp-chau-dat-nung', N'Mặc định (seed)', @Price, @Price, NULL, NULL, @Img
    FROM Products p WHERE p.Slug = N'seed-sp-chau-dat-nung';

IF NOT EXISTS (SELECT 1 FROM ProductVariants WHERE Sku = N'seed-v-seed-sp-ban-ghe-nhua-ngoai-troi')
    INSERT INTO ProductVariants (ProductId, Sku, VariantName, RetailPrice, CostPrice, Weight, Dimensions, ImageUrl)
    SELECT p.Id, N'seed-v-seed-sp-ban-ghe-nhua-ngoai-troi', N'Mặc định (seed)', @Price, @Price, NULL, NULL, @Img
    FROM Products p WHERE p.Slug = N'seed-sp-ban-ghe-nhua-ngoai-troi';

IF NOT EXISTS (SELECT 1 FROM ProductVariants WHERE Sku = N'seed-v-seed-sp-cap-hdmi-2m')
    INSERT INTO ProductVariants (ProductId, Sku, VariantName, RetailPrice, CostPrice, Weight, Dimensions, ImageUrl)
    SELECT p.Id, N'seed-v-seed-sp-cap-hdmi-2m', N'Mặc định (seed)', @Price, @Price, NULL, NULL, @Img
    FROM Products p WHERE p.Slug = N'seed-sp-cap-hdmi-2m';

IF NOT EXISTS (SELECT 1 FROM ProductVariants WHERE Sku = N'seed-v-seed-sp-o-cam-chong-giat')
    INSERT INTO ProductVariants (ProductId, Sku, VariantName, RetailPrice, CostPrice, Weight, Dimensions, ImageUrl)
    SELECT p.Id, N'seed-v-seed-sp-o-cam-chong-giat', N'Mặc định (seed)', @Price, @Price, NULL, NULL, @Img
    FROM Products p WHERE p.Slug = N'seed-sp-o-cam-chong-giat';

-- Thú cưng / quà
IF NOT EXISTS (SELECT 1 FROM ProductVariants WHERE Sku = N'seed-v-seed-sp-do-choi-nhua-cho-cho')
    INSERT INTO ProductVariants (ProductId, Sku, VariantName, RetailPrice, CostPrice, Weight, Dimensions, ImageUrl)
    SELECT p.Id, N'seed-v-seed-sp-do-choi-nhua-cho-cho', N'Mặc định (seed)', @Price, @Price, NULL, NULL, @Img
    FROM Products p WHERE p.Slug = N'seed-sp-do-choi-nhua-cho-cho';

IF NOT EXISTS (SELECT 1 FROM ProductVariants WHERE Sku = N'seed-v-seed-sp-cot-cao-meo')
    INSERT INTO ProductVariants (ProductId, Sku, VariantName, RetailPrice, CostPrice, Weight, Dimensions, ImageUrl)
    SELECT p.Id, N'seed-v-seed-sp-cot-cao-meo', N'Mặc định (seed)', @Price, @Price, NULL, NULL, @Img
    FROM Products p WHERE p.Slug = N'seed-sp-cot-cao-meo';

IF NOT EXISTS (SELECT 1 FROM ProductVariants WHERE Sku = N'seed-v-seed-sp-hop-qua-te')
    INSERT INTO ProductVariants (ProductId, Sku, VariantName, RetailPrice, CostPrice, Weight, Dimensions, ImageUrl)
    SELECT p.Id, N'seed-v-seed-sp-hop-qua-te', N'Mặc định (seed)', @Price, @Price, NULL, NULL, @Img
    FROM Products p WHERE p.Slug = N'seed-sp-hop-qua-te';

/* Tồn kho: mỗi variant seed SKU trên — 500 đơn vị khả dụng (nếu chưa có dòng Inventories) */
INSERT INTO Inventories (VariantId, WarehouseLocation, QuantityOnHand, QuantityReserved, QuantityAvailable)
SELECT v.Id, @Wh, 500, 0, 500
FROM ProductVariants v
WHERE v.Sku LIKE N'seed-v-seed-sp-%'
  AND NOT EXISTS (SELECT 1 FROM Inventories i WHERE i.VariantId = v.Id);

COMMIT TRANSACTION;
