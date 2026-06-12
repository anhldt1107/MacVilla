# API: Wrap response và xử lý lỗi (tổng quan)

Tài liệu mô tả cách API `BE_API` chuẩn hóa body JSON (`ResponseDto`) và luồng lỗi toàn cục. Code tham chiếu: `Dto/Common/ResponseDto.cs`, `ExceptionHandling/GlobalExceptionHandler.cs`, `Program.cs`, `Controllers/RoleController.cs`.

---

## 1. Envelope chung: `ResponseDto`

Mọi endpoint nên trả về (hoặc lỗi thống nhất qua handler) cùng một dạng object.


| Thuộc tính  | Thành công                                       | Lỗi (handler / validation)                                            |
| ----------- | ------------------------------------------------ | --------------------------------------------------------------------- |
| `success`   | `true`                                           | `false`                                                               |
| `data`      | Payload (object, mảng, …)                        | Thường `null`                                                         |
| `message`   | Thông báo thành công (tiếng Việt tùy controller) | Thông báo lỗi cho người dùng / client                                 |
| `errorCode` | `null` (hoặc bỏ qua)                             | Mã ổn định để client phân nhánh (vd: `NOT_FOUND`, `VALIDATION_ERROR`) |
| `errors`    | `null`                                           | Chỉ dùng khi lỗi validation: dictionary field → mảng message          |
| `traceId`   | —                                                | Chỉ **Development**: hỗ trợ debug                                     |
| `detail`    | —                                                | Chỉ **Development**: chuỗi exception đầy đủ                           |


**JSON:** Controller dùng serializer mặc định của ASP.NET (thường **camelCase**). Handler lỗi toàn cục serialize tay với cùng quy ước camelCase và `WhenWritingNull` để body gọn.

**Ví dụ thành công:**

```json
{
  "success": true,
  "data": { "id": 1, "roleName": "Admin" },
  "message": "Lấy role thành công"
}
```

**Ví dụ lỗi nghiệp vụ (404):**

```json
{
  "success": false,
  "message": "Không tìm thấy role",
  "errorCode": "NOT_FOUND"
}
```

---

## 2. Controller: không try/catch từng action

- Controller gọi service, trả `Ok(new ResponseDto { Success = true, Data = …, Message = … })`.
- Exception từ service/repository **để nổi lên**; `GlobalExceptionHandler` xử lý và set HTTP status + body `ResponseDto` với `success: false`.
- Tránh lặp `try/catch` + `BadRequest` cho mọi lỗi như trước — tránh đồng loạt trả 400 cho cả “không tìm thấy”.

Tham khảo: `Controllers/RoleController.cs`.

---

## 3. Đăng ký pipeline (`Program.cs`)

1. `**AddProblemDetails()`** — bắt buộc kèm `UseExceptionHandler()` ở .NET 8+ để middleware cấu hình hợp lệ (không có sẽ lỗi runtime).
2. `**AddExceptionHandler<GlobalExceptionHandler>()`** — đăng ký `IExceptionHandler` tùy chỉnh.
3. `**app.UseExceptionHandler()`** — đặt sớm trong pipeline (sau `Build`, trước CORS và phần còn lại).

---

## 4. Validation model (`ApiBehaviorOptions`)

`ConfigureApiBehaviorOptions` + `InvalidModelStateResponseFactory`: khi DTO không hợp lệ, trả **HTTP 400** và `ResponseDto` với:

- `success: false`
- `errorCode: "VALIDATION_ERROR"`
- `errors`: map từ `ModelState` (tên field → danh sách message)

Không đi qua `GlobalExceptionHandler` (đây là kết quả xử lý sẵn của framework).

---

## 5. Map exception → HTTP status + `errorCode`

Logic nằm trong `ExceptionHandling/GlobalExceptionHandler.cs` (method `MapException` / `MapDbUpdateException`).


| Exception                                                        | HTTP | `errorCode` (gợi ý)        |
| ---------------------------------------------------------------- | ---- | -------------------------- |
| `AuthenticationFailedException` (đăng nhập sai / khóa tài khoản) | 401  | `AUTH_INVALID_CREDENTIALS` |
| `KeyNotFoundException`                                           | 404  | `NOT_FOUND`                |
| `ArgumentNullException`, `ArgumentException`, `FormatException`  | 400  | `BAD_REQUEST`              |
| `UnauthorizedAccessException`                                    | 403  | `FORBIDDEN`                |
| `InvalidOperationException`                                      | 409  | `CONFLICT`                 |
| `NotImplementedException`                                        | 501  | `NOT_IMPLEMENTED`          |
| `DbUpdateConcurrencyException`                                   | 409  | `CONCURRENCY_CONFLICT`     |
| `DbUpdateException` + SQL 2601 / 2627 (trùng key)                | 409  | `DUPLICATE_KEY`            |
| `DbUpdateException` (khác)                                       | 400  | `DATABASE_ERROR`           |
| Còn lại                                                          | 500  | `INTERNAL_ERROR`           |


**Production:** lỗi 500 không trả `exception.Message` gốc cho client; dùng message chung (tránh lộ chi tiết hệ thống).

**Development:** thêm `traceId` và `detail` (full exception) trên `ResponseDto` để debug.

---

## 6. Gợi ý cho tầng Service

- **Không tìm thấy tài nguyên:** `throw new KeyNotFoundException("…")` → 404.
- **Vi phạm nghiệp vụ / trạng thái xung đột** (trùng tên, không xóa vì còn ràng buộc): `throw new InvalidOperationException("…")` → 409.
- Tránh `throw new Exception("…")` cho lỗi có thể dự đoán — sẽ rơi vào 500 trừ khi sau này bổ sung loại exception riêng.

Ví dụ hiện tại: `Service/RoleService.cs`.

---

## 7. Giới hạn / lưu ý

- **401 Unauthorized** từ JWT middleware có thể vẫn là định dạng mặc định của ASP.NET Core, **không** tự động bọc `ResponseDto`. Nếu cần thống nhất hoàn toàn, cân nhắc `JwtBearerEvents` hoặc middleware riêng.
- Khi thêm controller mới: giữ pattern `Ok(new ResponseDto { … })` và throw exception đúng loại ở service.
- Đổi bảng map exception: sửa `GlobalExceptionHandler` và **cập nhật lại mục 5** trong file này cho đồng bộ.

