# Đăng nhập JWT & phân quyền (cấu trúc code)

## Vị trí file

| Khu vực | Mục đích |
|---------|----------|
| `Authorization/` | **Hằng số & đăng ký**: `AppRoles`, `Policies`, `JwtClaimTypes`, `PrincipalKinds`, `StoreCustomerPrincipal`, `JwtOptions`, `AuthorizationExtensions.AddAppAuthenticationAndAuthorization` |
| `Service/AuthService.cs`, `JwtTokenService.cs` | Nghiệp vụ đăng nhập + ký JWT |
| `Service/IService/IAuthService.cs`, `IJwtTokenService.cs` | Interface để test/mock |
| `Dto/Auth/` | Request/response đăng nhập (DTO chung theo feature) |
| `Controllers/AuthController.cs` | `POST api/auth/login`, `GET api/auth/me` (nhân sự) |
| `Controllers/StoreAuthController.cs` | `POST api/store/auth/register`, `login`, `GET/PUT me` (khách B2C) |
| `Service/CustomerAuthService.cs`, `ICustomerAuthService` | Đăng ký / đăng nhập khách, BCrypt trên `Customer.PasswordHash` |
| `Service/CustomerCartService.cs`, `StoreOrderService.cs`, `StoreVoucherService.cs` | Giỏ B2C, đơn từ giỏ, voucher (dùng `VoucherComputation`) |
| `Controllers/StoreCartController.cs`, `StoreOrdersController.cs`, `StoreMyOrdersController.cs` | API mục 4.5 |
| `ExceptionHandling/AuthenticationFailedException.cs` | Lỗi đăng nhập → **401** + `AUTH_INVALID_CREDENTIALS` |

`Program.cs` chỉ gọi `AddAppAuthenticationAndAuthorization(configuration)` — không nhân đôi cấu hình JWT.

## Quy ước nâng cấp

1. **Tên role trong DB** (`Role.RoleName`) phải khớp hằng số trong `AppRoles` khi muốn dùng trong code/policy.
2. **Controller**: ưu tiên `[Authorize(Policy = Policies.xxx)]` thay vì `[Authorize(Roles = "Admin")]` rải rác — sau này đổi policy sang `RequireAssertion` (permission JSON) tại một chỗ.
3. **Claim role trong JWT**: type `"Role"` — khớp `JwtClaimTypes.Role` và `RoleClaimType` trong JWT bearer (đăng ký trong `AuthorizationExtensions`).
4. Thêm policy mới: mở `AuthorizationExtensions` → `options.AddPolicy(Policies.TenMoi, ...)` → thêm hằng trong `Policies.cs` → gắn lên controller.

## Policy hiện có

- **`Policies.AdminOnly`**: chỉ role `AppRoles.Admin` — đang dùng cho `RoleController`.
- **`Policies.StaffAuthenticated`**: JWT hợp lệ **và** claim `principal_kind` = `staff` (JWT nhân sự do `JwtTokenService.CreateAccessToken` cấp). Token cũ không có claim này sẽ **bị từ chối** — cần đăng nhập lại `POST /api/auth/login`.
- **`Policies.CustomerAuthenticated`**: JWT hợp lệ **và** `principal_kind` = `customer` (đăng nhập/đăng ký qua `api/store/auth`).

JWT nhân sự và khách dùng chung cấu hình `Jwt:*` (issuer, audience, signing key); phân biệt bằng claim `principal_kind` (`JwtClaimTypes.PrincipalKind`).

## Tạo user admin đầu tiên

Cần có bản ghi `Roles` với `RoleName = 'Admin'` và `AppUsers` trỏ `RoleId` tương ứng. `PasswordHash` phải là **BCrypt** (cùng thư viện `BCrypt.Net-Next` như khi verify).

Ví dụ tạo hash trong C# interactive hoặc snippet tạm:

```csharp
BCrypt.Net.BCrypt.HashPassword("YourPassword");
```

Chèn vào SQL (chỉ minh họa — điều chỉnh cột theo migration thực tế):

```sql
-- Đảm bảo đã có role Admin
INSERT INTO Roles (RoleName, Description, Permissions) VALUES (N'Admin', N'Quản trị', NULL);

DECLARE @rid INT = SCOPE_IDENTITY(); -- hoặc SELECT Id FROM Roles WHERE RoleName = N'Admin'

INSERT INTO AppUsers (Username, PasswordHash, FullName, Email, Phone, RoleId, Status, CreatedAt)
VALUES (N'admin', N'<bcrypt_hash>', N'Administrator', NULL, N'', @rid, N'Active', SYSUTCDATETIME());
```

Sau đó gọi `POST /api/auth/login` với `username` / `password`, dùng `accessToken` trong header `Authorization: Bearer ...`.

## Endpoint

- **`POST /api/auth/login`** — `[AllowAnonymous]`, body `LoginRequestDto`.
- **`GET /api/auth/me`** — policy `StaffAuthenticated`; trả lại claims cơ bản (không hit DB).
- **`POST /api/store/auth/register`** — đăng ký B2C, body `StoreCustomerRegisterDto`, trả JWT + profile.
- **`POST /api/store/auth/login`** — body `StoreCustomerLoginDto` (`email` + `password`).
- **`GET|PUT /api/store/auth/me`** — policy `CustomerAuthenticated`; `GET/PUT` đọc/ghi profile từ DB.
- **`GET|POST /api/store/me/addresses`**, **`PUT|DELETE .../addresses/{id}`**, **`POST .../addresses/{id}/set-default`** — sổ địa chỉ giao hàng (policy `CustomerAuthenticated`). Claim `sub` = `CustomerId` qua `StoreCustomerPrincipal.GetCustomerId`.
- **`GET|POST|PUT|DELETE /api/store/me/cart`** — giỏ server (C1–C5).
- **`POST /api/store/orders/preview`**, **`POST /api/store/orders`** — xem trước / đặt hàng từ giỏ.
- **`GET /api/store/me/orders`**, **`GET /api/store/me/orders/{orderCode}`** — lịch sử & chi tiết đơn.
