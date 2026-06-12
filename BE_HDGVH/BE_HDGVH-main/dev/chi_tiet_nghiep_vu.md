# Tài liệu Đặc tả Nghiệp vụ Website Bán hàng & Quản lý Kho nội bộ

**Vai trò:** mô tả **nghiệp vụ và actor** (B2C/B2B, kho, kế toán). Không thay thế tài liệu kỹ thuật DB.

**Tài liệu kèm theo trong `dev/`:** [`README.md`](README.md) — mục lục và snapshot backend; [`DB_EXPLANATION.md`](DB_EXPLANATION.md) — giải thích bảng/entity; [`tong_quan_database.md`](tong_quan_database.md) — tóm tắt khối dữ liệu.

---

## 1. Tổng quan hệ thống
Hệ thống là một nền tảng thương mại điện tử (E-commerce) kết hợp Quản lý Kho (Inventory Management) nội bộ, chuyên phục vụ việc bán sản phẩm, cho phép kết nối giữa khách mua lẻ, khách bán buôn (doanh nghiệp) và quản lý luồng cung ứng, xuất hàng trong kho. Hệ thống phục vụ hai nhóm đối tượng chính: Khách lẻ (B2C) mua sắm trực tiếp và Khách doanh nghiệp/công trình (B2B) yêu cầu báo giá khối lượng lớn.

## 2. Các đối tượng tham gia (Actors) & Quyền hạn

1. **Admin (Quản trị viên hệ thống):**
   - Không trực tiếp tham gia vào các thao tác xử lý luồng đơn hàng hàng ngày.
   - Có toàn quyền vận hành nền tảng: Cài đặt cấu hình hệ thống (thông tin website, banner, chính sách...).
   - Quản lý phân quyền, thêm/sửa/xóa/khóa tài khoản nhân sự (Sales, Manager, nhân viên Kho...).

2. **Customer - Khách lẻ (B2C):**
   - Đăng kí/Đăng nhập tài khoản cá nhân.
   - Tìm kiếm, xem sản phẩm, quản lý giỏ hàng.
   - Tự lên đơn, sử dụng mã giảm giá (voucher), thanh toán trực tuyến hoặc chọn ship COD.
   - Theo dõi tiến độ đơn hàng, lịch sử mua hàng.

3. **Customer - Khách Doanh nghiệp/Công trình (B2B):**
   - Gửi yêu cầu "Báo giá" (Quote) cho các dự án mua số lượng lớn thay vì mua thanh toán trực tiếp.
   - Nhận báo giá từ phía Sale, phản hồi, đồng ý mức chiết khấu.
   - Quản lý hợp đồng, lịch sử thanh toán, theo dõi công nợ doanh nghiệp.

4. **Sales (Nhân viên kinh doanh):**
   - Chăm sóc khách hàng lẻ: Tư vấn, thao tác tạo đơn hộ khách nếu khách tới mua trực tiếp tại showroom.
   - Phụ trách chính nhóm B2B: Nhận yêu cầu doanh nghiệp, lên danh sách sản phẩm, tạo báo giá nháp, xin chỉ đạo/mức chiết khấu từ Manager.
   - Cập nhật trạng thái thanh toán/đặt cọc của khách, đôn đốc bộ phận kho và thông báo tiến độ cho khách.

5. **Manager (Quản lý / Giám đốc kinh doanh):**
   - Giám sát toàn bộ hoạt động kinh doanh, nhân sự và kho.
   - Xét duyệt các Báo giá B2B (Duyệt giá: mức chiết khấu đặc biệt vượt chuẩn của Sales).
   - Xét duyệt các đơn thả nổi về giá hoặc mã giảm giá đặc biệt của khách lẻ (nếu cần).
   - Truy cập các báo cáo doanh thu, hiệu suất Sales và tình trạng xuất/nhập/tồn kho.

6. **Stock Manager (Quản lý kho / Thủ kho):**
   - Chịu trách nhiệm chính tại trung tâm kho bãi về số liệu.
   - Nhận thông báo xuất hàng/giữ hàng tự động từ phần mềm.
   - Kiểm tra tồn kho thực tế, in các mẫu phiếu lấy hàng (Pick list), phiếu xuất kho.
   - Điều phối công việc cho nhân sự kho (Worker), thao tác xác nhận xuất kho phần mềm, trực tiếp khấu trừ số lượng tồn kho theo số liệu chính thức.

7. **Worker (Nhân viên kho / Đóng gói xuất nhập):**
   - Nhận lệnh và chỉ đạo trực tiếp từ Stock Manager.
   - Cầm phiếu lấy hàng đi nhặt hàng (Picking) đúng loại, đúng vị trí kệ/kho.
   - Thực hiện đóng gói (Packing) đúng quy chuẩn độ an toàn (đặc biệt các đồ đắt tiền/dễ vỡ/dễ xước).
   - Bốc xếp hàng hóa lên xe vận chuyển và báo lại cho Stock Manager hoàn thành quy trình xuất hàng vật lý.

---

## 3. Quy trình các luồng nghiệp vụ chi tiết

### Luồng 3.1: Mua sắm Khách lẻ (B2C Order Flow)
*   **Bước 1: Khởi tạo đơn hàng**
    *   *Actor:* Customer (lẻ) / Sales
    *   *Thao tác:* Khách đặt trên web/app hoặc Sales tạo đơn tại quầy.
    *   *Trạng thái:* `Đơn hàng mới tạo`.
*   **Bước 2: Xử lý thanh toán**
    *   *Actor:* Customer (lẻ) / Sales
    *   *Thao tác:* Khách thanh toán online, chuyển khoản cọc hoặc chọn COD. Hệ thống/Sales xác nhận có tiền.
    *   *Trạng thái:* `Đã xác nhận thanh toán / Chờ xử lý kho`.

### Luồng 3.2: Yêu cầu Báo giá Khách Doanh nghiệp (B2B Quote to Order Flow)
*   **Bước 1: Gửi yêu cầu**
    *   *Actor:* Customer (doanh nghiệp)
    *   *Thao tác:* Điền form yêu cầu báo giá số lượng lớn trên website, chọn các list sản phẩm.
    *   *Trạng thái:* `Yêu cầu báo giá mới`.
*   **Bước 2: Tạo báo giá**
    *   *Actor:* Sales
    *   *Thao tác:* Lên báo giá nháp (Quote) trên phần mềm, áp dụng mức chiết khấu khối lượng. Gửi yêu cầu lên cấp trên để duyệt mức giảm.
    *   *Trạng thái:* `Chờ duyệt giá`.
*   **Bước 3: Phê duyệt báo giá**
    *   *Actor:* Manager
    *   *Thao tác:* Kiểm tra số lượng, tỷ suất lợi nhuận, ra quyết định. Bấm "Phê duyệt" hoặc "Từ chối/Yêu cầu làm lại".
    *   *Trạng thái:* `Báo giá đã duyệt` (Hệ thống hoặc Sales gửi bản cuối cho Khách hàng).
*   **Bước 4: Xác nhận & Ký kết**
    *   *Actor:* Customer (doanh nghiệp) & Sales
    *   *Thao tác:* Khách đồng ý, phản hồi ký hợp đồng và tiến hành thanh toán tiền cọc. Sales xác nhận thanh toán và chuyển đổi Báo giá (Quote) thành Đơn hàng thực tế (Order).
    *   *Trạng thái:* `Đã xác nhận / Chờ xử lý kho`.

### Luồng 3.3: Xử lý tồn kho & Xuất hàng (Inventory & Fulfillment Flow)
*   **Bước 1: Kiểm tra & Giữ hàng (Reservation)**
    *   *Actor:* Stock Manager
    *   *Thao tác:* Đơn hàng chuyển tới kho. Stock Manager tiếp nhận.
        *   *Kịch bản A (Đủ hàng):* Thao tác `Giữ hàng (Reserve)`. Cập nhật tồn kho tạm tính trên phân hệ để dừng khả năng bán sản phẩm đó đi cho người khác.
        *   *Kịch bản B (Thiếu hàng):* Đưa ra thời hạn dự kiến nhập thêm hoặc sản xuất đồ nội thất -> Hệ thống báo về cho Sales đàm phán lại ngày giao hàng với khách.
*   **Bước 2: Chuẩn bị Lấy hàng & Đóng gói (Picking & Packing)**
    *   *Actor:* Stock Manager & Worker
    *   *Thao tác:* 
        *   Stock Manager in `Phiếu lấy hàng` (Pick list) giao cho Worker.
        *   Worker đi nhặt hàng theo số lượng, sau đó tiến hành đóng gói (Packing).
        *   Worker báo lại cho Stock Manager khi kiện hàng đã hoàn thiện.
    *   *Trạng thái:* `Đang chuẩn bị` -> `Sẵn sàng xuất hàng/Giao hàng`.
*   **Bước 3: Bàn giao & Xuất kho (Dispatch)**
    *   *Actor:* Stock Manager & Worker
    *   *Thao tác:* Worker đưa hàng ra xe của hãng vận chuyển. Stock Manager in `Phiếu xuất kho`, thao tác Xác nhận xuất.
    *   *Trạng thái:* `Đã xuất kho / Đang giao`. Khách hàng và Sales đều có thể check chặng giao hàng.
*   **Bước 4: Hoàn thành**
    *   Khi có cập nhật nhận hàng thành công -> Trạng thái cuối: `Hoàn thành`.

### Luồng 3.4: Xuất Hóa Đơn & Quản Lý Công Nợ (Invoicing & Debt Flow - B2B Focus)
*   **Bước 1: Lập Hóa Đơn (Invoicing)**
    *   *Actor:* Admin / Kế toán nội bộ (hoặc Manager)
    *   *Thao tác:* Sau khi hợp đồng chốt hoặc giao hàng thành công, tiến hành nhập thông tin xuất VAT (Mã số thuế, tên pháp nhân) và in Hóa đơn (`Invoice`).
    *   *Trạng thái:* Công nợ (`Debt_Balance`) của doanh nghiệp bị tính là tự động tăng lên dựa theo lượng tiền trên hóa đơn (Nếu chưa trả cọc trước đó).
*   **Bước 2: Theo dõi hạn thanh toán (Due Date)**
    *   *Actor:* Hệ thống / Sales
    *   *Thao tác:* Dựa trên `Due_Date` của hóa đơn/hợp đồng, nếu tới hoặc quá hạn hệ thống tự động sinh thông báo (Noti/Email) đến Sales để Sales đôn đốc khách hàng B2B chuyển khoản.
*   **Bước 3: Khách hàng thanh toán & Trừ nợ**
    *   *Actor:* Manager / Admin xử lý sổ phụ ngân hàng
    *   *Thao tác:* Ghi nhận Giao dịch (`Payment_Transaction`) ứng với hóa đơn hoặc hợp đồng đã phát sinh. Hệ thống ghi nhận biên lai.
    *   *Kết quả:* Hệ thống tự động giảm `Debt_Balance` (Dư nợ doanh nghiệp hiện hành). Nếu hóa đơn được thanh toán đủ, trạng thái chuyển thành `Paid`.

### Luồng 3.5: Áp dụng Ưu đãi & Mã Giảm Giá (Discount & Vouchers Flow)
- **Cơ chế:** Admin/Sales thiết lập `Voucher` (Giảm tiền trực tiếp / Giảm % / Mức trần). Mã này thường phát hành để kích cầu Khách lẻ (B2C).
- **Áp dụng tại Web:** Khách lẻ (B2C) thêm đồ nội thất vào giỏ. Ở bước thanh toán, khách nhập mã Voucher. Hệ thống tức thời kiểm tra logic (còn lượt không, đủ hóa đơn tối thiểu không) -> Tự động tính chênh lệch trước khi gen ra hóa đơn cuối.
- **Ngoại lệ riêng với B2B:** Với đối tượng B2B, giá giảm thường được áp dụng bằng chiết khấu thỏa thuận (Discount_Value) trong lúc đàm phán ngay ở Bước Tạo `Quote` (Báo giá). Việc này Manager kiểm soát riêng qua quy trình Duyệt giá. Tuy nhiên nếu B2B muốn áp dụng Voucher, quyền lợi vẫn được nền tảng thiết kế xử lý như bình thường.

### Luồng 3.6: Yêu cầu Bảo hành & CSKH (Warranty Flow)
1. **Tiếp nhận:** Khách hàng báo hỏng hóc, bong tróc sản phẩm trong thời hạn hóa đơn còn hiệu lực bảo hành.
2. **Khởi tạo:** Đại diện CSKH hoặc Sales vào hệ thống, mở sổ `Warranty_Ticket` của đơn hàng cũ, và tạo 1 Báo cáo sự cố (`Warranty_Claim`) gồm Tên sản phẩm lỗi, Tải ảnh hỏng hóc khách gửi lên, và Tình trạng mong muốn.
3. **Xử lý:** Bộ phận xử lý chốt phương án: Vác về xưởng sửa, Đổi cái mới, hay Cử thợ qua nhà dán/mài lại.
4. **Hoàn tất:** Khi làm xong, cập nhật trạng thái `Resolved`. Khách được CSKH gọi lại xác nhận.

### Luồng 3.7: Xử lý Đổi / Trả Hàng (Return & Exchange Flow)
*Luồng này phức tạp do ảnh hưởng ngược về cả Tiền và Tồn Kho vật lý.*
1. **Yêu cầu (Requested):** Khách hàng phản hồi muốn Trả nguyên lấy lại tiền (Return: Refund) hoặc Đổi sang màu khác (Exchange: ghế nệm đỏ thay vì nệm xám).
2. **Phê duyệt (Approved):** Do liên quan dòng tiền, `Manager` sẽ phải duyệt chứng từ `Return_Exchange_Ticket` trước.
3. **Điều phối với Kho & Stock Manager:**
   - **Với Trả hàng:** Stock Manager đưa lệnh điều phối Worker đi lấy/thu nhận hàng lỗi. Đồng thời cập nhật trạng thái `Kho Thực tế`. Nếu hàng nguyên vẹn (Restock) -> Tồn ảo tự động ++. Nếu hàng hỏng nát (Defect) -> Xác nhận chuyển kho chờ tiêu hủy/Sửa chứa.
   - **Với Đổi hàng:** Hệ thống sinh ra 2 nghiệp vụ cho kho: 1 lệnh Thu hàng cũ về + 1 lệnh Xuất Biến thể Mới (`Variant_ID_Exchanged`) ngay tức thì cho Worker đi bốc.
4. **Hoàn tiền Kế toán (Hoàn tất phần Tiền):** Admin/Kế toán sinh giao dịch `Refund` xuất vào nhóm `Payment_Transaction`, khép kín đối soát hoàn tiền cho Khách.
