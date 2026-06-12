# Dev Docs

Thư mục này lưu tài liệu nội bộ cho dev trong team: nghiệp vụ, database, và **ghi chú khớp với code hiện tại** trong repo `BE_API`.

## Các file hiện có

| File | Nội dung |
|------|----------|
| [`DB_EXPLANATION.md`](DB_EXPLANATION.md) | Giải thích database theo entity trong code: bảng dùng để làm gì, quan hệ, ví dụ nghiệp vụ. |
| [`tong_quan_database.md`](tong_quan_database.md) | Tóm tắt theo **khối nghiệp vụ** và các field quan trọng (ngôn ngữ gần với tên cột SQL hơn). |
| [`danh_sach_entities.md`](danh_sach_entities.md) | Đặc tả thuộc tính từng thực thể (chuẩn thiết kế); dùng kèm bảng ánh xạ tên ở đầu file. |
| [`chi_tiet_nghiep_vu.md`](chi_tiet_nghiep_vu.md) | Luồng nghiệp vụ B2C/B2B, actor, quy trình (không thay thế tài liệu DB kỹ thuật). |
| [`api_response_va_xu_ly_loi.md`](api_response_va_xu_ly_loi.md) | **Wrap response (`ResponseDto`) + xử lý lỗi toàn cục** (`IExceptionHandler`), validation, map exception → HTTP. |
| [`nghiep_vu/`](nghiep_vu/) | Kế hoạch API theo luồng nghiệp vụ: [admin master data](nghiep_vu/plan_api_master_data_san_pham_admin.md), [khách lẻ B2C](nghiep_vu/plan_api_khach_le_b2c.md), [khách doanh nghiệp B2B](nghiep_vu/plan_api_khach_doanh_nghiep_b2b.md). |
| [`authorization.md`](authorization.md) | Đăng nhập JWT, thư mục `Authorization/`, policy, seed admin. |

## Tổng quan backend (trạng thái code, cập nhật theo repo)

- **Dự án:** ASP.NET Core **9** (`BE_API.csproj`), minimal hosting (`Program.cs`).
- **CSDL:** SQL Server, **Entity Framework Core 9**, migration trong thư mục `Migrations/`. Khi app chạy gọi `Database.Migrate()` (tự áp migration).
- **API & tài liệu:** Swagger (kèm JWT Bearer); JSON bật `ReferenceHandler.IgnoreCycles`.
- **Xác thực:** JWT Bearer đã cấu hình; claim role: `RoleClaimType = "Role"`.
- **CORS:** policy `AllowAllOrigin` — chỉ nên dùng cho dev; production cần thu hẹp origin.
- **Kiến trúc:** `Controllers` → `Service` → `Repository` (generic `IRepository<>`). Đăng ký DI trong `Extensions/ServiceCollectionExtensions.cs`.
- **API đã có controller rõ ràng:** hiện chủ yếu **`RoleController`** (CRUD/list role). Các entity khác đã có trong `BeContext` nhưng endpoint tương ứng có thể chưa đủ — kiểm tra thư mục `Controllers/` khi làm feature.
- **Thư mục `Entites/`:** tên folder viết tắt; **namespace trong code là `BE_API.Entities`** (khớp với `using` trong project).
- **Package đáng nhớ:** BCrypt (mật khẩu), MailKit, **payOS** (thanh toán). Không commit secret thật vào `appsettings.json`; dùng User Secrets / biến môi trường cho connection string và JWT key.
- **Response & lỗi:** xem [`api_response_va_xu_ly_loi.md`](api_response_va_xu_ly_loi.md).

## Mục đích thư mục `dev/`

- Giúp người mới vào dự án đọc nhanh và hiểu hệ thống.
- Ưu tiên ngôn ngữ nghiệp vụ, không chỉ mô tả kỹ thuật thuần.
- Làm tài liệu nội bộ để code đúng hướng.

## Nguyên tắc bổ sung tài liệu

- Mỗi file viết sao cho người mới đọc là hiểu.
- Ưu tiên có ví dụ thực tế.
- Khi thêm bảng/đổi nghiệp vụ: cập nhật `DB_EXPLANATION.md` và các file liên quan; thêm dòng vào bảng ánh xạ tên (ở đầu `tong_quan_database.md` / `danh_sach_entities.md`) nếu tên tài liệu khác tên class/SQL.
