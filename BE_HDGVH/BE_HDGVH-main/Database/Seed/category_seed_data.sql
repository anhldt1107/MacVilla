/*
  Seed danh mục (cha + con), idempotent theo Slug.
  Yêu cầu: đã chạy migration (bảng Categories, cột ImageUrl nếu có).

  Chạy ví dụ (sqlcmd):
    sqlcmd -S localhost -d YourDb -i Database/Seed/category_seed_data.sql

  Hoặc dán vào SSMS / Azure Data Studio và Execute.

  Sau khi có danh mục: có thể chạy tiếp product_seed_data.sql (sản phẩm seed gắn slug category).
*/

SET NOCOUNT ON;
SET XACT_ABORT ON;

BEGIN TRANSACTION;

/* --- 12 danh mục cha (>= 10 theo yêu cầu) --- */
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = N'noi-that-phong-khach')
    INSERT INTO Categories (Name, Slug, ParentId, ImageUrl)
    VALUES (N'Nội thất phòng khách', N'noi-that-phong-khach', NULL, NULL);

IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = N'noi-that-phong-ngu')
    INSERT INTO Categories (Name, Slug, ParentId, ImageUrl)
    VALUES (N'Nội thất phòng ngủ', N'noi-that-phong-ngu', NULL, NULL);

IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = N'den-chieu-sang')
    INSERT INTO Categories (Name, Slug, ParentId, ImageUrl)
    VALUES (N'Đèn & chiếu sáng', N'den-chieu-sang', NULL, NULL);

IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = N'thiet-bi-nha-bep')
    INSERT INTO Categories (Name, Slug, ParentId, ImageUrl)
    VALUES (N'Thiết bị nhà bếp', N'thiet-bi-nha-bep', NULL, NULL);

IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = N'do-trang-tri')
    INSERT INTO Categories (Name, Slug, ParentId, ImageUrl)
    VALUES (N'Đồ trang trí', N'do-trang-tri', NULL, NULL);

IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = N'van-phong-noi-that')
    INSERT INTO Categories (Name, Slug, ParentId, ImageUrl)
    VALUES (N'Văn phòng & nội thất', N'van-phong-noi-that', NULL, NULL);

IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = N'thiet-bi-dien-tu')
    INSERT INTO Categories (Name, Slug, ParentId, ImageUrl)
    VALUES (N'Thiết bị điện tử', N'thiet-bi-dien-tu', NULL, NULL);

IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = N'nha-cua-doi-song')
    INSERT INTO Categories (Name, Slug, ParentId, ImageUrl)
    VALUES (N'Nhà cửa & đời sống', N'nha-cua-doi-song', NULL, NULL);

IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = N'san-vuon-ngoai-troi')
    INSERT INTO Categories (Name, Slug, ParentId, ImageUrl)
    VALUES (N'Sân vườn & ngoài trời', N'san-vuon-ngoai-troi', NULL, NULL);

IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = N'phu-kien-linh-kien')
    INSERT INTO Categories (Name, Slug, ParentId, ImageUrl)
    VALUES (N'Phụ kiện & linh kiện', N'phu-kien-linh-kien', NULL, NULL);

IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = N'do-choi-thu-cung')
    INSERT INTO Categories (Name, Slug, ParentId, ImageUrl)
    VALUES (N'Đồ chơi & thú cưng', N'do-choi-thu-cung', NULL, NULL);

IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = N'qua-tang-dac-san')
    INSERT INTO Categories (Name, Slug, ParentId, ImageUrl)
    VALUES (N'Quà tặng & đặc sản', N'qua-tang-dac-san', NULL, NULL);

/* --- Con: phòng khách --- */
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = N'sofa-ghe-salon')
    INSERT INTO Categories (Name, Slug, ParentId, ImageUrl)
    SELECT N'Sofa & ghế salon', N'sofa-ghe-salon', c.Id, NULL
    FROM Categories c WHERE c.Slug = N'noi-that-phong-khach';

IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = N'ban-tra-ke-tivi')
    INSERT INTO Categories (Name, Slug, ParentId, ImageUrl)
    SELECT N'Bàn trà & kệ TV', N'ban-tra-ke-tivi', c.Id, NULL
    FROM Categories c WHERE c.Slug = N'noi-that-phong-khach';

IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = N'tu-ke-trang-tri')
    INSERT INTO Categories (Name, Slug, ParentId, ImageUrl)
    SELECT N'Tủ kệ trang trí', N'tu-ke-trang-tri', c.Id, NULL
    FROM Categories c WHERE c.Slug = N'noi-that-phong-khach';

/* --- Con: phòng ngủ --- */
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = N'giuong-nem-chan-ga')
    INSERT INTO Categories (Name, Slug, ParentId, ImageUrl)
    SELECT N'Giường, nệm & chăn ga', N'giuong-nem-chan-ga', c.Id, NULL
    FROM Categories c WHERE c.Slug = N'noi-that-phong-ngu';

IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = N'tu-quan-ao-phong-ngu')
    INSERT INTO Categories (Name, Slug, ParentId, ImageUrl)
    SELECT N'Tủ quần áo', N'tu-quan-ao-phong-ngu', c.Id, NULL
    FROM Categories c WHERE c.Slug = N'noi-that-phong-ngu';

IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = N'ban-trang-diem')
    INSERT INTO Categories (Name, Slug, ParentId, ImageUrl)
    SELECT N'Bàn trang điểm', N'ban-trang-diem', c.Id, NULL
    FROM Categories c WHERE c.Slug = N'noi-that-phong-ngu';

/* --- Con: đèn --- */
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = N'den-tran-tha')
    INSERT INTO Categories (Name, Slug, ParentId, ImageUrl)
    SELECT N'Đèn trần & đèn thả', N'den-tran-tha', c.Id, NULL
    FROM Categories c WHERE c.Slug = N'den-chieu-sang';

IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = N'den-ban-den-cay')
    INSERT INTO Categories (Name, Slug, ParentId, ImageUrl)
    SELECT N'Đèn bàn & đèn cây', N'den-ban-den-cay', c.Id, NULL
    FROM Categories c WHERE c.Slug = N'den-chieu-sang';

IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = N'den-led-day')
    INSERT INTO Categories (Name, Slug, ParentId, ImageUrl)
    SELECT N'Đèn LED & dây trang trí', N'den-led-day', c.Id, NULL
    FROM Categories c WHERE c.Slug = N'den-chieu-sang';

/* --- Con: bếp --- */
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = N'noi-chao-xoong')
    INSERT INTO Categories (Name, Slug, ParentId, ImageUrl)
    SELECT N'Nồi, chảo & xoong', N'noi-chao-xoong', c.Id, NULL
    FROM Categories c WHERE c.Slug = N'thiet-bi-nha-bep';

IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = N'may-xay-pha-che')
    INSERT INTO Categories (Name, Slug, ParentId, ImageUrl)
    SELECT N'Máy xay & pha chế', N'may-xay-pha-che', c.Id, NULL
    FROM Categories c WHERE c.Slug = N'thiet-bi-nha-bep';

/* --- Con: trang trí --- */
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = N'binh-hoa-tuong')
    INSERT INTO Categories (Name, Slug, ParentId, ImageUrl)
    SELECT N'Bình hoa & tượng', N'binh-hoa-tuong', c.Id, NULL
    FROM Categories c WHERE c.Slug = N'do-trang-tri';

IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = N'khung-anh-guong')
    INSERT INTO Categories (Name, Slug, ParentId, ImageUrl)
    SELECT N'Khung ảnh & gương', N'khung-anh-guong', c.Id, NULL
    FROM Categories c WHERE c.Slug = N'do-trang-tri';

/* --- Con: VP --- */
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = N'ban-ghe-van-phong')
    INSERT INTO Categories (Name, Slug, ParentId, ImageUrl)
    SELECT N'Bàn ghế văn phòng', N'ban-ghe-van-phong', c.Id, NULL
    FROM Categories c WHERE c.Slug = N'van-phong-noi-that';

IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = N'ke-sach-ho-so')
    INSERT INTO Categories (Name, Slug, ParentId, ImageUrl)
    SELECT N'Kệ sách & hồ sơ', N'ke-sach-ho-so', c.Id, NULL
    FROM Categories c WHERE c.Slug = N'van-phong-noi-that';

/* --- Con: điện tử --- */
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = N'phu-kien-dien-thoai')
    INSERT INTO Categories (Name, Slug, ParentId, ImageUrl)
    SELECT N'Phụ kiện điện thoại', N'phu-kien-dien-thoai', c.Id, NULL
    FROM Categories c WHERE c.Slug = N'thiet-bi-dien-tu';

/* --- Con: nhà cửa --- */
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = N'dung-cu-ve-sinh')
    INSERT INTO Categories (Name, Slug, ParentId, ImageUrl)
    SELECT N'Dụng cụ vệ sinh', N'dung-cu-ve-sinh', c.Id, NULL
    FROM Categories c WHERE c.Slug = N'nha-cua-doi-song';

/* --- Con: sân vườn --- */
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = N'chau-cay-canh')
    INSERT INTO Categories (Name, Slug, ParentId, ImageUrl)
    SELECT N'Chậu & cây cảnh', N'chau-cay-canh', c.Id, NULL
    FROM Categories c WHERE c.Slug = N'san-vuon-ngoai-troi';

IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = N'ban-ghe-ngoai-troi')
    INSERT INTO Categories (Name, Slug, ParentId, ImageUrl)
    SELECT N'Bàn ghế ngoài trời', N'ban-ghe-ngoai-troi', c.Id, NULL
    FROM Categories c WHERE c.Slug = N'san-vuon-ngoai-troi';

COMMIT TRANSACTION;
