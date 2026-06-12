# Sidebar đề xuất — **Khách B2C** (khách lẻ / cửa hàng)

**Vai trò:** Mua lẻ trên web/app; giỏ hàng, voucher, đặt hàng, thanh toán; **không** có báo giá/hợp đồng/công nợ doanh nghiệp trong DB như B2B.

**Auth:** JWT **customer** (store B2C — route thường `api/store/...`, không phải `b2b`).

---

## 1. Trang chủ


| Mục                      | Mô tả                                                                              |
| ------------------------ | ---------------------------------------------------------------------------------- |
| **Trang chủ / Khám phá** | Danh mục, sản phẩm nổi bật — catalog store (`api/store/...` categories, products). |


---

## 2. Mua sắm


| Mục            | Ghi chú                                                                     |
| -------------- | --------------------------------------------------------------------------- |
| **Danh mục**   | Cây danh mục — `api/store/categories` (theo controller thực tế trong repo). |
| **Sản phẩm**   | List / detail — `api/store/products` …                                      |
| **Giỏ hàng**   | `api/store/cart` …                                                          |
| **Thanh toán** | Checkout, PayOS/COD tùy cấu hình — `api/store/orders` …                     |


---

## 3. Đơn hàng cá nhân


| Mục                    | Ghi chú                                        |
| ---------------------- | ---------------------------------------------- |
| **Đơn của tôi**        | Trạng thái, chi tiết — store orders.           |
| **Theo dõi giao hàng** | Trạng thái đơn / vận chuyển (nếu có tích hợp). |


---

## 4. Ưu đãi


| Mục             | Ghi chú                                            |
| --------------- | -------------------------------------------------- |
| **Mã giảm giá** | Nhập voucher tại checkout — `api/store/vouchers` … |


---

## 5. Tài khoản


| Mục            | Ghi chú                                           |
| -------------- | ------------------------------------------------- |
| **Hồ sơ**      | Sửa thông tin — `api/store/...` customer profile. |
| **Sổ địa chỉ** | CRUD địa chỉ — `api/store/...` addresses.         |
| **Đăng xuất**  | Header menu.                                      |


---

## 6. Không hiển thị B2C


| Mục                              | Lý do                               |
| -------------------------------- | ----------------------------------- |
| **Báo giá / Hợp đồng / Công nợ** | Thuộc B2B.                          |
| **Hóa đơn VAT doanh nghiệp**     | Trừ khi có luồng riêng cho cá nhân. |


---

*Đối chiếu loại khách trong DB: `Customer.CustomerType` = B2C — [`../../tong_quan_database.md`](../../tong_quan_database.md).*