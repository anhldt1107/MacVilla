# Database Explanation

Tai lieu nay giai thich database hien tai theo bo entity moi cua du an.

**Lien ket tai lieu trong `dev/`:** [`README.md`](README.md) (muc luc + tong quan backend). Tom tat theo khoi nghiep vu: [`tong_quan_database.md`](tong_quan_database.md). Dac ta actor/luong: [`chi_tiet_nghiep_vu.md`](chi_tiet_nghiep_vu.md). Bang anh xa ten `User` → `AppUser`, `Order` → `CustomerOrder`: xem dau file [`tong_quan_database.md`](tong_quan_database.md) / [`danh_sach_entities.md`](danh_sach_entities.md).

**Code:** `BeContext` (`Database/BeContext.cs`), entity trong `Entites/` (namespace `BE_API.Entities`). Bang SQL cua don hang: ten bang **`Order`** (entity class `CustomerOrder`).

## 1. Muc tieu cua database

Database nay phuc vu luong:

- quan ly nguoi dung noi bo va phan quyen
- quan ly khach hang B2C va B2B
- quan ly san pham, variant, SKU
- bao gia, hop dong, don hang
- ton kho, giao hang, xuat kho
- hoa don, thanh toan
- voucher, campaign khuyen mai
- bao hanh va doi tra

## 2. Nhom bang chinh

He thong co the nhin thanh 8 nhom:

1. Nguoi dung noi bo
- `AppUser`
- `Role`

2. Khach hang
- `Customer`
- `CustomerAddress`
- `ShoppingCart` / `ShoppingCartItem` (gio hang server, mot gio / khach dang nhap)

3. Danh muc va san pham
- `Category`
- `Product`
- `ProductAttribute`
- `ProductAttributeValue`
- `ProductVariant`

4. Bao gia va hop dong
- `Quote`
- `QuoteItem`
- `Contract`

5. Don hang
- `CustomerOrder`
- `OrderItem`

6. Kho va xuat hang
- `Inventory`
- `InventoryTransaction`
- `FulfillmentTicket`

7. Hoa don va thanh toan
- `Invoice`
- `PaymentTransaction`
- `PromotionCampaign`
- `Voucher`

8. Bao hanh va doi tra
- `WarrantyTicket`
- `WarrantyClaim`
- `ReturnExchangeTicket`
- `ReturnItem`

## 3. Giai thich tung bang

### 3.1 `Role`

Bang nay luu vai tro cua nguoi dung noi bo.

Vi du:

- Admin
- Manager
- Saler
- Stock Manager

### 3.2 `AppUser`

Bang nay luu tai khoan nhan su trong he thong.

Dung cho:

- dang nhap backend
- phan quyen
- gan nguoi tao bao gia
- gan manager duyet
- gan nhan vien kho

Vi du:

- saler A tao bao gia
- manager B duyet bao gia
- nhan vien kho C xu ly xuat hang

### 3.3 `Customer`

Bang nay luu khach hang.

Co the la:

- khach le
- doanh nghiep

Thong tin chinh:

- loai khach
- ten
- email
- so dien thoai
- thong tin cong ty
- cong no hien tai

### 3.4 `CustomerAddress`

Bang dia chi cua khach hang.

Dung cho:

- giao hang
- luu nhieu dia chi
- chon dia chi mac dinh

Vi du:

- tru so cong ty
- dia chi cong trinh
- dia chi nha rieng cua khach le

### 3.4.1 `ShoppingCart` va `ShoppingCartItem`

Gio hang luu tren server cho khach da dang nhap: **mot ban ghi `ShoppingCarts` / `CustomerId` (unique)**.

- `ShoppingCartItem`: `VariantId`, `Quantity`; unique cap `(ShoppingCartId, VariantId)`.
- Xoa `Customer` cascade xoa gio; xoa `ProductVariant` bi chan neu con dong trong gio (FK Restrict).

### 3.5 `Category`

Bang danh muc san pham.

Ho tro cha con.

Vi du:

- Laptop
- Ban lam viec
- Ghe van phong
- Phu kien

### 3.6 `Product`

Day la san pham goc.

Vi du:

- Laptop CSI
- Ban hop 2m4

Thong tin chinh:

- CategoryId
- Name
- Slug
- Description
- BasePrice
- WarrantyPeriodMonths
- Status

### 3.7 `ProductAttribute`

Thuoc tinh cua san pham.

Vi du:

- CPU
- SSD
- Mau
- Kich thuoc

### 3.8 `ProductAttributeValue`

Gia tri cua thuoc tinh.

Vi du:

- CPU -> i7
- SSD -> 250G
- Mau -> Oak

### 3.9 `ProductVariant`

Bang nay la bien the de ban hang.

Day la bang tuong duong voi y tuong SKU trong nghiep vu.

Thong tin chinh:

- `Sku`
- `VariantName`
- `RetailPrice`
- `CostPrice`
- `Weight`
- `Dimensions`

Vi du:

- Product: `Laptop CSI`
- Variant: `i7 / 250G`
- SKU: `CSI-I7-250G`

Hoac:

- Product: `Ban hop`
- Variant: `2m4 / Mau Oak`
- SKU: `BANHOP-24-OAK`

### 3.10 `Quote`

Bang bao gia.

Dung cho:

- saler lap bao gia cho khach
- manager duyet muc gia dac biet
- buoc trung gian truoc khi ra hop dong hoac don hang

Thong tin chinh:

- QuoteCode
- CustomerId
- SalesId
- ManagerId
- TotalAmount
- DiscountType
- DiscountValue
- FinalAmount
- Status

### 3.11 `QuoteItem`

Chi tiet bao gia.

Moi dong la 1 `ProductVariant`.

Vi du:

- `CSI-I7-250G`
- so luong 5
- don gia 14,500,000

### 3.12 `Contract`

Bang hop dong.

Dung cho case B2B hoac cong trinh.

No thuong di sau `Quote`.

Vi du:

- bao gia duoc chap nhan
- tao hop dong cho khach doanh nghiep

### 3.13 `CustomerOrder`

Bang don hang chinh.

Day la bang trung tam cua qua trinh ban hang.

Thong tin chinh:

- OrderCode
- CustomerId
- QuoteId
- ContractId
- SalesId
- VoucherId
- PaymentMethod
- PaymentStatus
- OrderStatus
- ShippingAddressId
- MerchandiseTotal, DiscountTotal, PayableTotal (tong tien hang / giam gia voucher / thanh toan — B2C checkout)

Vi du:

- khach dat 2 may laptop
- don duoc tao tu bao gia da duyet

### 3.14 `OrderItem`

Chi tiet don hang.

Moi dong la 1 `ProductVariant`.

Thong tin chinh:

- VariantId
- SkuSnapshot
- PriceSnapshot
- Quantity
- SubTotal

### 3.15 `Inventory`

Ton kho hien tai theo `ProductVariant`.

Thong tin chinh:

- VariantId
- WarehouseLocation
- QuantityOnHand
- QuantityReserved
- QuantityAvailable

Vi du:

- `CSI-I7-250G`
- ton 10
- da giu 2
- kha dung 8

### 3.16 `InventoryTransaction`

Bang lich su bien dong kho.

Dung de luu:

- nhap kho
- giu hang
- xuat kho
- dieu chinh kho
- hoan kho

Co the gan:

- worker
- manager duyet
- reference toi don, phieu, hoac tac vu khac

### 3.17 `FulfillmentTicket`

Bang phieu xu ly don / phieu xuat / phieu giao hang noi bo.

Dung cho kho.

Thong tin chinh:

- OrderId
- TicketType
- AssignedWorkerId
- Status
- CreatedBy

Vi du:

- phieu nhat hang
- phieu dong goi
- phieu ban giao giao van

### 3.18 `Invoice`

Bang hoa don.

Co the gan voi:

- `CustomerOrder`
- `Contract`

Dung cho:

- hoa don ban hang
- cong no
- doi soat thanh toan

### 3.19 `PaymentTransaction`

Bang giao dich thanh toan.

Dung de ghi nhan:

- coc
- thanh toan mot phan
- thanh toan du
- hoan tien

### 3.20 `PromotionCampaign`

Bang chien dich khuyen mai.

Vi du:

- sale thang 3
- campaign khai truong

### 3.21 `Voucher`

Ma giam gia thuoc mot campaign.

Thong tin chinh:

- Code
- DiscountType
- DiscountValue
- MinOrderValue
- MaxDiscountAmount
- UsageLimit
- UsedCount

### 3.22 `WarrantyTicket`

Bang phieu bao hanh.

No co the gan voi:

- `CustomerOrder`
- `Contract`
- `Customer`

Dung de xac dinh khach nao dang so huu quyen bao hanh nao.

### 3.23 `WarrantyClaim`

Bang yeu cau bao hanh.

Thong tin chinh:

- WarrantyTicketId
- VariantId
- DefectDescription
- ImagesUrl
- Status
- EstimatedCost
- ResolvedDate

Vi du:

- khach bao may loi man hinh
- he thong tao claim de xu ly

### 3.24 `ReturnExchangeTicket`

Bang yeu cau tra hang / doi hang.

Thong tin chinh:

- OrderId
- CustomerId
- Type
- Reason
- ManagerIdApproved
- Status
- RefundAmount

### 3.25 `ReturnItem`

Chi tiet hang tra / hang doi.

Dung de xac dinh:

- variant tra lai
- variant doi sang
- so luong
- cach xu ly kho

## 4. Luong nghiep vu tong quat

Mot luong day du thuong nhu sau:

1. Khai bao san pham
- tao `Category`
- tao `Product`
- tao `ProductAttribute`
- tao `ProductVariant`

2. Tao bao gia
- tao `Quote`
- tao `QuoteItem`

3. Tao hop dong neu can
- tao `Contract`

4. Tao don hang
- tao `CustomerOrder`
- tao `OrderItem`

5. Giu va xu ly kho
- cap nhat `Inventory`
- tao `InventoryTransaction`
- tao `FulfillmentTicket`

6. Xuat hoa don va thu tien
- tao `Invoice`
- tao `PaymentTransaction`
- ap `Voucher` neu co

7. Bao hanh hoac doi tra
- tao `WarrantyTicket`
- tao `WarrantyClaim`
- tao `ReturnExchangeTicket`
- tao `ReturnItem`

## 5. Vi du thuc te

Khach doanh nghiep dat 5 may `CSI-I7-250G`:

1. Saler tao `Quote`
- 5 may
- don gia de xuat
- manager duyet giam gia

2. Khach dong y
- tao `Contract`

3. Tao `CustomerOrder`
- sinh `OrderItem` cho SKU `CSI-I7-250G`

4. Kho xu ly
- tru `Inventory`
- ghi `InventoryTransaction`
- tao `FulfillmentTicket`

5. Xuat hoa don
- tao `Invoice`
- ghi `PaymentTransaction`

6. Neu co loi sau ban
- tao `WarrantyTicket`
- tao `WarrantyClaim`

## 6. Bang quan trong nhat

Neu nhin theo nghiep vu app nay, cac bang quan trong nhat la:

- `Customer`
- `Product`
- `ProductVariant`
- `Quote`
- `CustomerOrder`
- `Inventory`
- `FulfillmentTicket`
- `Invoice`
- `WarrantyTicket`
- `ReturnExchangeTicket`

## 7. Nho nhanh

Muon nho nhanh thi doc theo chuoi nay:

- `Product` la hang goc
- `ProductVariant` la SKU de ban
- `Quote` la bao gia
- `Contract` la hop dong
- `CustomerOrder` la don hang
- `Inventory` la ton kho
- `FulfillmentTicket` la xu ly xuat hang
- `Invoice` va `PaymentTransaction` la tien
- `WarrantyTicket` va `WarrantyClaim` la bao hanh
- `ReturnExchangeTicket` la doi tra
