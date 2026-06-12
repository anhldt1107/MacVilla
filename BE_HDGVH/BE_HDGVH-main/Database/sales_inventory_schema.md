# Sales Inventory Schema

Tai lieu nay tom tat schema theo bo entity moi.

## Bang chinh

- `AppUser`
- `Role`
- `Customer`
- `CustomerAddress`
- `Category`
- `Product`
- `ProductAttribute`
- `ProductAttributeValue`
- `ProductVariant`
- `Quote`
- `QuoteItem`
- `Contract`
- `CustomerOrder`
- `OrderItem`
- `Inventory`
- `InventoryTransaction`
- `FulfillmentTicket`
- `Invoice`
- `PaymentTransaction`
- `PromotionCampaign`
- `Voucher`
- `WarrantyTicket`
- `WarrantyClaim`
- `ReturnExchangeTicket`
- `ReturnItem`

## Quy uoc nghiep vu

- `ProductVariant.Sku` la ma SKU de ban hang
- `Quote` la bao gia truoc don hang
- `Contract` danh cho B2B hoac cong trinh
- `CustomerOrder` la don hang chinh
- `Inventory` la ton hien tai
- `InventoryTransaction` la lich su bien dong kho
- `FulfillmentTicket` la phieu kho / giao hang
- `WarrantyTicket` la phieu bao hanh
- `WarrantyClaim` la yeu cau bao hanh
- `ReturnExchangeTicket` la phieu doi tra

## Vi du SKU

- Product: `Laptop CSI`
- Variant: `i7 / 250G`
- SKU: `CSI-I7-250G`

He thong se ban hang, bao gia, ton kho, va bao hanh dua tren `ProductVariant`.

## Luong chinh

1. `Quote` -> `QuoteItem`
2. `Contract` neu can
3. `CustomerOrder` -> `OrderItem`
4. `Inventory` + `InventoryTransaction`
5. `FulfillmentTicket`
6. `Invoice` + `PaymentTransaction`
7. `WarrantyTicket` + `WarrantyClaim`
8. `ReturnExchangeTicket` + `ReturnItem`
