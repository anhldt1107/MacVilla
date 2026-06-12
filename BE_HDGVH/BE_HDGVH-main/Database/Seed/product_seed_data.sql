/*
  Seed sản phẩm (Products) gắn với slug danh mục trong category_seed_data.sql.
  Chạy sau: Database/Seed/category_seed_data.sql
  Yêu cầu: migration đã có cột Products.ImageUrl.

  ImageUrl: xen kênh 2 URL mẫu — gán cố định theo slug (ABS(BINARY_CHECKSUM(slug)) % 2),
  không đổi giữa các lần chạy lại script (idempotent).

  Tiếp theo: Database/Seed/product_variant_seed_data.sql (variant đồng giá 10.000 + tồn kho seed).
*/

SET NOCOUNT ON;
SET XACT_ABORT ON;

DECLARE @UrlDova nvarchar(max) =
    N'https://dovavietnam.com/wp-content/uploads/2024/01/1-hinh-anh-cua-bon-cau-1-khoi.jpg';
DECLARE @UrlPlo nvarchar(max) =
    N'https://image.plo.vn/w1000/Uploaded/2026/obflucp/2014_04_03/82801_20140402170734.jpg82801_20140402170734_GXJU.jpg.ashx.webp?width=500';

BEGIN TRANSACTION;

/* --- Phòng khách (cha + con) --- */
IF NOT EXISTS (SELECT 1 FROM Products WHERE Slug = N'seed-sp-combo-trang-tri-phong-khach')
    INSERT INTO Products (CategoryId, Name, Slug, Description, ImageUrl, BasePrice, WarrantyPeriodMonths, Status)
    SELECT c.Id, N'Combo trang trí phòng khách (seed)', N'seed-sp-combo-trang-tri-phong-khach', N'Seed demo.',
        CASE WHEN ABS(BINARY_CHECKSUM(N'seed-sp-combo-trang-tri-phong-khach')) % 2 = 0 THEN @UrlDova ELSE @UrlPlo END,
        8900000.00, 12, N'Active'
    FROM Categories c WHERE c.Slug = N'noi-that-phong-khach';

IF NOT EXISTS (SELECT 1 FROM Products WHERE Slug = N'seed-sp-sofa-goc-l')
    INSERT INTO Products (CategoryId, Name, Slug, Description, ImageUrl, BasePrice, WarrantyPeriodMonths, Status)
    SELECT c.Id, N'Sofa góc L (seed)', N'seed-sp-sofa-goc-l', N'Seed demo.',
        CASE WHEN ABS(BINARY_CHECKSUM(N'seed-sp-sofa-goc-l')) % 2 = 0 THEN @UrlDova ELSE @UrlPlo END,
        18500000.00, 24, N'Active'
    FROM Categories c WHERE c.Slug = N'sofa-ghe-salon';

IF NOT EXISTS (SELECT 1 FROM Products WHERE Slug = N'seed-sp-sofa-vang-dai')
    INSERT INTO Products (CategoryId, Name, Slug, Description, ImageUrl, BasePrice, WarrantyPeriodMonths, Status)
    SELECT c.Id, N'Sofa văng dài 3 chỗ (seed)', N'seed-sp-sofa-vang-dai', N'Seed demo.',
        CASE WHEN ABS(BINARY_CHECKSUM(N'seed-sp-sofa-vang-dai')) % 2 = 0 THEN @UrlDova ELSE @UrlPlo END,
        12200000.00, 24, N'Active'
    FROM Categories c WHERE c.Slug = N'sofa-ghe-salon';

IF NOT EXISTS (SELECT 1 FROM Products WHERE Slug = N'seed-sp-ban-tra-go-oc-cho')
    INSERT INTO Products (CategoryId, Name, Slug, Description, ImageUrl, BasePrice, WarrantyPeriodMonths, Status)
    SELECT c.Id, N'Bàn trà gỗ óc chó (seed)', N'seed-sp-ban-tra-go-oc-cho', N'Seed demo.',
        CASE WHEN ABS(BINARY_CHECKSUM(N'seed-sp-ban-tra-go-oc-cho')) % 2 = 0 THEN @UrlDova ELSE @UrlPlo END,
        4500000.00, 12, N'Active'
    FROM Categories c WHERE c.Slug = N'ban-tra-ke-tivi';

IF NOT EXISTS (SELECT 1 FROM Products WHERE Slug = N'seed-sp-ke-tivi-2m')
    INSERT INTO Products (CategoryId, Name, Slug, Description, ImageUrl, BasePrice, WarrantyPeriodMonths, Status)
    SELECT c.Id, N'Kệ TV 2m (seed)', N'seed-sp-ke-tivi-2m', N'Seed demo.',
        CASE WHEN ABS(BINARY_CHECKSUM(N'seed-sp-ke-tivi-2m')) % 2 = 0 THEN @UrlDova ELSE @UrlPlo END,
        6800000.00, 12, N'Active'
    FROM Categories c WHERE c.Slug = N'tu-ke-trang-tri';

/* --- Phòng ngủ --- */
IF NOT EXISTS (SELECT 1 FROM Products WHERE Slug = N'seed-sp-set-rem-cua')
    INSERT INTO Products (CategoryId, Name, Slug, Description, ImageUrl, BasePrice, WarrantyPeriodMonths, Status)
    SELECT c.Id, N'Set rèm cửa 2 lớp (seed)', N'seed-sp-set-rem-cua', N'Seed demo.',
        CASE WHEN ABS(BINARY_CHECKSUM(N'seed-sp-set-rem-cua')) % 2 = 0 THEN @UrlDova ELSE @UrlPlo END,
        3200000.00, 6, N'Active'
    FROM Categories c WHERE c.Slug = N'noi-that-phong-ngu';

IF NOT EXISTS (SELECT 1 FROM Products WHERE Slug = N'seed-sp-giuong-queen-go')
    INSERT INTO Products (CategoryId, Name, Slug, Description, ImageUrl, BasePrice, WarrantyPeriodMonths, Status)
    SELECT c.Id, N'Giường Queen gỗ tự nhiên (seed)', N'seed-sp-giuong-queen-go', N'Seed demo.',
        CASE WHEN ABS(BINARY_CHECKSUM(N'seed-sp-giuong-queen-go')) % 2 = 0 THEN @UrlDova ELSE @UrlPlo END,
        15900000.00, 24, N'Active'
    FROM Categories c WHERE c.Slug = N'giuong-nem-chan-ga';

IF NOT EXISTS (SELECT 1 FROM Products WHERE Slug = N'seed-sp-nem-cooling-180')
    INSERT INTO Products (CategoryId, Name, Slug, Description, ImageUrl, BasePrice, WarrantyPeriodMonths, Status)
    SELECT c.Id, N'Nệm cooling 180×200 (seed)', N'seed-sp-nem-cooling-180', N'Seed demo.',
        CASE WHEN ABS(BINARY_CHECKSUM(N'seed-sp-nem-cooling-180')) % 2 = 0 THEN @UrlDova ELSE @UrlPlo END,
        8900000.00, 60, N'Active'
    FROM Categories c WHERE c.Slug = N'giuong-nem-chan-ga';

IF NOT EXISTS (SELECT 1 FROM Products WHERE Slug = N'seed-sp-tu-4-canh-trang')
    INSERT INTO Products (CategoryId, Name, Slug, Description, ImageUrl, BasePrice, WarrantyPeriodMonths, Status)
    SELECT c.Id, N'Tủ quần áo 4 cánh trắng (seed)', N'seed-sp-tu-4-canh-trang', N'Seed demo.',
        CASE WHEN ABS(BINARY_CHECKSUM(N'seed-sp-tu-4-canh-trang')) % 2 = 0 THEN @UrlDova ELSE @UrlPlo END,
        11200000.00, 24, N'Active'
    FROM Categories c WHERE c.Slug = N'tu-quan-ao-phong-ngu';

IF NOT EXISTS (SELECT 1 FROM Products WHERE Slug = N'seed-sp-ban-trang-diem-led')
    INSERT INTO Products (CategoryId, Name, Slug, Description, ImageUrl, BasePrice, WarrantyPeriodMonths, Status)
    SELECT c.Id, N'Bàn trang điểm có LED (seed)', N'seed-sp-ban-trang-diem-led', N'Seed demo.',
        CASE WHEN ABS(BINARY_CHECKSUM(N'seed-sp-ban-trang-diem-led')) % 2 = 0 THEN @UrlDova ELSE @UrlPlo END,
        3650000.00, 12, N'Active'
    FROM Categories c WHERE c.Slug = N'ban-trang-diem';

/* --- Đèn --- */
IF NOT EXISTS (SELECT 1 FROM Products WHERE Slug = N'seed-sp-bong-led-a60')
    INSERT INTO Products (CategoryId, Name, Slug, Description, ImageUrl, BasePrice, WarrantyPeriodMonths, Status)
    SELECT c.Id, N'Bóng LED A60 tiết kiệm điện (seed)', N'seed-sp-bong-led-a60', N'Seed demo.',
        CASE WHEN ABS(BINARY_CHECKSUM(N'seed-sp-bong-led-a60')) % 2 = 0 THEN @UrlDova ELSE @UrlPlo END,
        85000.00, 12, N'Active'
    FROM Categories c WHERE c.Slug = N'den-chieu-sang';

IF NOT EXISTS (SELECT 1 FROM Products WHERE Slug = N'seed-sp-den-tha-thuy-tinh')
    INSERT INTO Products (CategoryId, Name, Slug, Description, ImageUrl, BasePrice, WarrantyPeriodMonths, Status)
    SELECT c.Id, N'Đèn thả thủy tinh (seed)', N'seed-sp-den-tha-thuy-tinh', N'Seed demo.',
        CASE WHEN ABS(BINARY_CHECKSUM(N'seed-sp-den-tha-thuy-tinh')) % 2 = 0 THEN @UrlDova ELSE @UrlPlo END,
        2450000.00, 12, N'Active'
    FROM Categories c WHERE c.Slug = N'den-tran-tha';

IF NOT EXISTS (SELECT 1 FROM Products WHERE Slug = N'seed-sp-den-led-op-tran')
    INSERT INTO Products (CategoryId, Name, Slug, Description, ImageUrl, BasePrice, WarrantyPeriodMonths, Status)
    SELECT c.Id, N'Đèn LED ốp trần vuông (seed)', N'seed-sp-den-led-op-tran', N'Seed demo.',
        CASE WHEN ABS(BINARY_CHECKSUM(N'seed-sp-den-led-op-tran')) % 2 = 0 THEN @UrlDova ELSE @UrlPlo END,
        890000.00, 12, N'Active'
    FROM Categories c WHERE c.Slug = N'den-tran-tha';

IF NOT EXISTS (SELECT 1 FROM Products WHERE Slug = N'seed-sp-den-ban-hoc-sinh')
    INSERT INTO Products (CategoryId, Name, Slug, Description, ImageUrl, BasePrice, WarrantyPeriodMonths, Status)
    SELECT c.Id, N'Đèn bàn học sinh chống cận (seed)', N'seed-sp-den-ban-hoc-sinh', N'Seed demo.',
        CASE WHEN ABS(BINARY_CHECKSUM(N'seed-sp-den-ban-hoc-sinh')) % 2 = 0 THEN @UrlDova ELSE @UrlPlo END,
        420000.00, 12, N'Active'
    FROM Categories c WHERE c.Slug = N'den-ban-den-cay';

IF NOT EXISTS (SELECT 1 FROM Products WHERE Slug = N'seed-sp-led-day-10m')
    INSERT INTO Products (CategoryId, Name, Slug, Description, ImageUrl, BasePrice, WarrantyPeriodMonths, Status)
    SELECT c.Id, N'Dây LED trang trí 10m (seed)', N'seed-sp-led-day-10m', N'Seed demo.',
        CASE WHEN ABS(BINARY_CHECKSUM(N'seed-sp-led-day-10m')) % 2 = 0 THEN @UrlDova ELSE @UrlPlo END,
        290000.00, 6, N'Active'
    FROM Categories c WHERE c.Slug = N'den-led-day';

/* --- Bếp --- */
IF NOT EXISTS (SELECT 1 FROM Products WHERE Slug = N'seed-sp-tu-lanh-mini')
    INSERT INTO Products (CategoryId, Name, Slug, Description, ImageUrl, BasePrice, WarrantyPeriodMonths, Status)
    SELECT c.Id, N'Tủ lạnh mini bar (seed)', N'seed-sp-tu-lanh-mini', N'Seed demo.',
        CASE WHEN ABS(BINARY_CHECKSUM(N'seed-sp-tu-lanh-mini')) % 2 = 0 THEN @UrlDova ELSE @UrlPlo END,
        4500000.00, 24, N'Active'
    FROM Categories c WHERE c.Slug = N'thiet-bi-nha-bep';

IF NOT EXISTS (SELECT 1 FROM Products WHERE Slug = N'seed-sp-bo-noi-inox-5')
    INSERT INTO Products (CategoryId, Name, Slug, Description, ImageUrl, BasePrice, WarrantyPeriodMonths, Status)
    SELECT c.Id, N'Bộ nồi inox 5 chiếc (seed)', N'seed-sp-bo-noi-inox-5', N'Seed demo.',
        CASE WHEN ABS(BINARY_CHECKSUM(N'seed-sp-bo-noi-inox-5')) % 2 = 0 THEN @UrlDova ELSE @UrlPlo END,
        2100000.00, 12, N'Active'
    FROM Categories c WHERE c.Slug = N'noi-chao-xoong';

IF NOT EXISTS (SELECT 1 FROM Products WHERE Slug = N'seed-sp-chao-chong-dinh-28')
    INSERT INTO Products (CategoryId, Name, Slug, Description, ImageUrl, BasePrice, WarrantyPeriodMonths, Status)
    SELECT c.Id, N'Chảo chống dính 28cm (seed)', N'seed-sp-chao-chong-dinh-28', N'Seed demo.',
        CASE WHEN ABS(BINARY_CHECKSUM(N'seed-sp-chao-chong-dinh-28')) % 2 = 0 THEN @UrlDova ELSE @UrlPlo END,
        450000.00, 12, N'Active'
    FROM Categories c WHERE c.Slug = N'noi-chao-xoong';

IF NOT EXISTS (SELECT 1 FROM Products WHERE Slug = N'seed-sp-may-xay-da-nang')
    INSERT INTO Products (CategoryId, Name, Slug, Description, ImageUrl, BasePrice, WarrantyPeriodMonths, Status)
    SELECT c.Id, N'Máy xay đa năng (seed)', N'seed-sp-may-xay-da-nang', N'Seed demo.',
        CASE WHEN ABS(BINARY_CHECKSUM(N'seed-sp-may-xay-da-nang')) % 2 = 0 THEN @UrlDova ELSE @UrlPlo END,
        1650000.00, 12, N'Active'
    FROM Categories c WHERE c.Slug = N'may-xay-pha-che';

/* --- Trang trí --- */
IF NOT EXISTS (SELECT 1 FROM Products WHERE Slug = N'seed-sp-binh-gom-bat-trang')
    INSERT INTO Products (CategoryId, Name, Slug, Description, ImageUrl, BasePrice, WarrantyPeriodMonths, Status)
    SELECT c.Id, N'Bình gốm Bát Tràng (seed)', N'seed-sp-binh-gom-bat-trang', N'Seed demo.',
        CASE WHEN ABS(BINARY_CHECKSUM(N'seed-sp-binh-gom-bat-trang')) % 2 = 0 THEN @UrlDova ELSE @UrlPlo END,
        680000.00, 0, N'Active'
    FROM Categories c WHERE c.Slug = N'binh-hoa-tuong';

IF NOT EXISTS (SELECT 1 FROM Products WHERE Slug = N'seed-sp-guong-bo-tron-60')
    INSERT INTO Products (CategoryId, Name, Slug, Description, ImageUrl, BasePrice, WarrantyPeriodMonths, Status)
    SELECT c.Id, N'Gương bo tròn Ø60 (seed)', N'seed-sp-guong-bo-tron-60', N'Seed demo.',
        CASE WHEN ABS(BINARY_CHECKSUM(N'seed-sp-guong-bo-tron-60')) % 2 = 0 THEN @UrlDova ELSE @UrlPlo END,
        920000.00, 12, N'Active'
    FROM Categories c WHERE c.Slug = N'khung-anh-guong';

/* --- Văn phòng --- */
IF NOT EXISTS (SELECT 1 FROM Products WHERE Slug = N'seed-sp-ban-lam-viec-12m')
    INSERT INTO Products (CategoryId, Name, Slug, Description, ImageUrl, BasePrice, WarrantyPeriodMonths, Status)
    SELECT c.Id, N'Bàn làm việc 1,2m (seed)', N'seed-sp-ban-lam-viec-12m', N'Seed demo.',
        CASE WHEN ABS(BINARY_CHECKSUM(N'seed-sp-ban-lam-viec-12m')) % 2 = 0 THEN @UrlDova ELSE @UrlPlo END,
        3200000.00, 12, N'Active'
    FROM Categories c WHERE c.Slug = N'ban-ghe-van-phong';

IF NOT EXISTS (SELECT 1 FROM Products WHERE Slug = N'seed-sp-ghe-xoay-luoi')
    INSERT INTO Products (CategoryId, Name, Slug, Description, ImageUrl, BasePrice, WarrantyPeriodMonths, Status)
    SELECT c.Id, N'Ghế xoay lưng lưới (seed)', N'seed-sp-ghe-xoay-luoi', N'Seed demo.',
        CASE WHEN ABS(BINARY_CHECKSUM(N'seed-sp-ghe-xoay-luoi')) % 2 = 0 THEN @UrlDova ELSE @UrlPlo END,
        1890000.00, 12, N'Active'
    FROM Categories c WHERE c.Slug = N'ban-ghe-van-phong';

IF NOT EXISTS (SELECT 1 FROM Products WHERE Slug = N'seed-sp-ke-sach-5-tang')
    INSERT INTO Products (CategoryId, Name, Slug, Description, ImageUrl, BasePrice, WarrantyPeriodMonths, Status)
    SELECT c.Id, N'Kệ sách 5 tầng (seed)', N'seed-sp-ke-sach-5-tang', N'Seed demo.',
        CASE WHEN ABS(BINARY_CHECKSUM(N'seed-sp-ke-sach-5-tang')) % 2 = 0 THEN @UrlDova ELSE @UrlPlo END,
        2750000.00, 12, N'Active'
    FROM Categories c WHERE c.Slug = N'ke-sach-ho-so';

/* --- Điện tử --- */
IF NOT EXISTS (SELECT 1 FROM Products WHERE Slug = N'seed-sp-lo-vi-song')
    INSERT INTO Products (CategoryId, Name, Slug, Description, ImageUrl, BasePrice, WarrantyPeriodMonths, Status)
    SELECT c.Id, N'Lò vi sóng 25L (seed)', N'seed-sp-lo-vi-song', N'Seed demo.',
        CASE WHEN ABS(BINARY_CHECKSUM(N'seed-sp-lo-vi-song')) % 2 = 0 THEN @UrlDova ELSE @UrlPlo END,
        2350000.00, 12, N'Active'
    FROM Categories c WHERE c.Slug = N'thiet-bi-dien-tu';

IF NOT EXISTS (SELECT 1 FROM Products WHERE Slug = N'seed-sp-op-lung-trong')
    INSERT INTO Products (CategoryId, Name, Slug, Description, ImageUrl, BasePrice, WarrantyPeriodMonths, Status)
    SELECT c.Id, N'Ốp lưng trong suốt (seed)', N'seed-sp-op-lung-trong', N'Seed demo.',
        CASE WHEN ABS(BINARY_CHECKSUM(N'seed-sp-op-lung-trong')) % 2 = 0 THEN @UrlDova ELSE @UrlPlo END,
        120000.00, 3, N'Active'
    FROM Categories c WHERE c.Slug = N'phu-kien-dien-thoai';

IF NOT EXISTS (SELECT 1 FROM Products WHERE Slug = N'seed-sp-sac-khong-day-15w')
    INSERT INTO Products (CategoryId, Name, Slug, Description, ImageUrl, BasePrice, WarrantyPeriodMonths, Status)
    SELECT c.Id, N'Sạc không dây 15W (seed)', N'seed-sp-sac-khong-day-15w', N'Seed demo.',
        CASE WHEN ABS(BINARY_CHECKSUM(N'seed-sp-sac-khong-day-15w')) % 2 = 0 THEN @UrlDova ELSE @UrlPlo END,
        350000.00, 6, N'Active'
    FROM Categories c WHERE c.Slug = N'phu-kien-dien-thoai';

/* --- Nhà cửa & đời sống --- */
IF NOT EXISTS (SELECT 1 FROM Products WHERE Slug = N'seed-sp-may-hut-bui-cam-tay')
    INSERT INTO Products (CategoryId, Name, Slug, Description, ImageUrl, BasePrice, WarrantyPeriodMonths, Status)
    SELECT c.Id, N'Máy hút bụi cầm tay (seed)', N'seed-sp-may-hut-bui-cam-tay', N'Seed demo.',
        CASE WHEN ABS(BINARY_CHECKSUM(N'seed-sp-may-hut-bui-cam-tay')) % 2 = 0 THEN @UrlDova ELSE @UrlPlo END,
        1990000.00, 12, N'Active'
    FROM Categories c WHERE c.Slug = N'nha-cua-doi-song';

IF NOT EXISTS (SELECT 1 FROM Products WHERE Slug = N'seed-sp-cay-lau-360')
    INSERT INTO Products (CategoryId, Name, Slug, Description, ImageUrl, BasePrice, WarrantyPeriodMonths, Status)
    SELECT c.Id, N'Cây lau nhà xoay 360 (seed)', N'seed-sp-cay-lau-360', N'Seed demo.',
        CASE WHEN ABS(BINARY_CHECKSUM(N'seed-sp-cay-lau-360')) % 2 = 0 THEN @UrlDova ELSE @UrlPlo END,
        280000.00, 6, N'Active'
    FROM Categories c WHERE c.Slug = N'dung-cu-ve-sinh';

IF NOT EXISTS (SELECT 1 FROM Products WHERE Slug = N'seed-sp-bon-cau-mot-khoi')
    INSERT INTO Products (CategoryId, Name, Slug, Description, ImageUrl, BasePrice, WarrantyPeriodMonths, Status)
    SELECT c.Id, N'Bồn cầu một khối (seed)', N'seed-sp-bon-cau-mot-khoi', N'Seed demo.',
        CASE WHEN ABS(BINARY_CHECKSUM(N'seed-sp-bon-cau-mot-khoi')) % 2 = 0 THEN @UrlDova ELSE @UrlPlo END,
        5200000.00, 24, N'Active'
    FROM Categories c WHERE c.Slug = N'dung-cu-ve-sinh';

/* --- Sân vườn --- */
IF NOT EXISTS (SELECT 1 FROM Products WHERE Slug = N'seed-sp-voi-tuoi-cay')
    INSERT INTO Products (CategoryId, Name, Slug, Description, ImageUrl, BasePrice, WarrantyPeriodMonths, Status)
    SELECT c.Id, N'Vòi tưới cây xoay 360 (seed)', N'seed-sp-voi-tuoi-cay', N'Seed demo.',
        CASE WHEN ABS(BINARY_CHECKSUM(N'seed-sp-voi-tuoi-cay')) % 2 = 0 THEN @UrlDova ELSE @UrlPlo END,
        190000.00, 6, N'Active'
    FROM Categories c WHERE c.Slug = N'san-vuon-ngoai-troi';

IF NOT EXISTS (SELECT 1 FROM Products WHERE Slug = N'seed-sp-chau-dat-nung')
    INSERT INTO Products (CategoryId, Name, Slug, Description, ImageUrl, BasePrice, WarrantyPeriodMonths, Status)
    SELECT c.Id, N'Chậu đất nung trồng cây (seed)', N'seed-sp-chau-dat-nung', N'Seed demo.',
        CASE WHEN ABS(BINARY_CHECKSUM(N'seed-sp-chau-dat-nung')) % 2 = 0 THEN @UrlDova ELSE @UrlPlo END,
        150000.00, 0, N'Active'
    FROM Categories c WHERE c.Slug = N'chau-cay-canh';

IF NOT EXISTS (SELECT 1 FROM Products WHERE Slug = N'seed-sp-ban-ghe-nhua-ngoai-troi')
    INSERT INTO Products (CategoryId, Name, Slug, Description, ImageUrl, BasePrice, WarrantyPeriodMonths, Status)
    SELECT c.Id, N'Bộ bàn ghế nhựa ngoài trời (seed)', N'seed-sp-ban-ghe-nhua-ngoai-troi', N'Seed demo.',
        CASE WHEN ABS(BINARY_CHECKSUM(N'seed-sp-ban-ghe-nhua-ngoai-troi')) % 2 = 0 THEN @UrlDova ELSE @UrlPlo END,
        4100000.00, 12, N'Active'
    FROM Categories c WHERE c.Slug = N'ban-ghe-ngoai-troi';

/* --- Phụ kiện / đồ chơi / quà --- */
IF NOT EXISTS (SELECT 1 FROM Products WHERE Slug = N'seed-sp-cap-hdmi-2m')
    INSERT INTO Products (CategoryId, Name, Slug, Description, ImageUrl, BasePrice, WarrantyPeriodMonths, Status)
    SELECT c.Id, N'Cáp HDMI 2m (seed)', N'seed-sp-cap-hdmi-2m', N'Seed demo.',
        CASE WHEN ABS(BINARY_CHECKSUM(N'seed-sp-cap-hdmi-2m')) % 2 = 0 THEN @UrlDova ELSE @UrlPlo END,
        180000.00, 6, N'Active'
    FROM Categories c WHERE c.Slug = N'phu-kien-linh-kien';

IF NOT EXISTS (SELECT 1 FROM Products WHERE Slug = N'seed-sp-o-cam-chong-giat')
    INSERT INTO Products (CategoryId, Name, Slug, Description, ImageUrl, BasePrice, WarrantyPeriodMonths, Status)
    SELECT c.Id, N'Ổ cắm chống giật 4 lỗ (seed)', N'seed-sp-o-cam-chong-giat', N'Seed demo.',
        CASE WHEN ABS(BINARY_CHECKSUM(N'seed-sp-o-cam-chong-giat')) % 2 = 0 THEN @UrlDova ELSE @UrlPlo END,
        420000.00, 12, N'Active'
    FROM Categories c WHERE c.Slug = N'phu-kien-linh-kien';

IF NOT EXISTS (SELECT 1 FROM Products WHERE Slug = N'seed-sp-do-choi-nhua-cho-cho')
    INSERT INTO Products (CategoryId, Name, Slug, Description, ImageUrl, BasePrice, WarrantyPeriodMonths, Status)
    SELECT c.Id, N'Đồ chơi nhựa cho chó (seed)', N'seed-sp-do-choi-nhua-cho-cho', N'Seed demo.',
        CASE WHEN ABS(BINARY_CHECKSUM(N'seed-sp-do-choi-nhua-cho-cho')) % 2 = 0 THEN @UrlDova ELSE @UrlPlo END,
        95000.00, 0, N'Active'
    FROM Categories c WHERE c.Slug = N'do-choi-thu-cung';

IF NOT EXISTS (SELECT 1 FROM Products WHERE Slug = N'seed-sp-cot-cao-meo')
    INSERT INTO Products (CategoryId, Name, Slug, Description, ImageUrl, BasePrice, WarrantyPeriodMonths, Status)
    SELECT c.Id, N'Cột cào mèo 1m2 (seed)', N'seed-sp-cot-cao-meo', N'Seed demo.',
        CASE WHEN ABS(BINARY_CHECKSUM(N'seed-sp-cot-cao-meo')) % 2 = 0 THEN @UrlDova ELSE @UrlPlo END,
        890000.00, 6, N'Active'
    FROM Categories c WHERE c.Slug = N'do-choi-thu-cung';

IF NOT EXISTS (SELECT 1 FROM Products WHERE Slug = N'seed-sp-hop-qua-te')
    INSERT INTO Products (CategoryId, Name, Slug, Description, ImageUrl, BasePrice, WarrantyPeriodMonths, Status)
    SELECT c.Id, N'Hộp quà Tết (seed)', N'seed-sp-hop-qua-te', N'Seed demo.',
        CASE WHEN ABS(BINARY_CHECKSUM(N'seed-sp-hop-qua-te')) % 2 = 0 THEN @UrlDova ELSE @UrlPlo END,
        450000.00, 0, N'Active'
    FROM Categories c WHERE c.Slug = N'qua-tang-dac-san';

COMMIT TRANSACTION;
