using System.Net;
using System.Text.Json;
using System.Text.Json.Serialization;
using BE_API.Dto.Common;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using PayOS.Exceptions;

namespace BE_API.ExceptionHandling;

public class GlobalExceptionHandler(ILogger<GlobalExceptionHandler> logger, IHostEnvironment environment)
    : IExceptionHandler
{
    public async ValueTask<bool> TryHandleAsync(
        HttpContext httpContext,
        Exception exception,
        CancellationToken cancellationToken)
    {
        if (exception is AuthenticationFailedException)
            logger.LogWarning("Authentication failed: {Message}", exception.Message);
        else
            logger.LogError(exception, "Unhandled exception: {Message}", exception.Message);

        var (statusCode, message, errorCode) = MapException(exception);

        if (!environment.IsDevelopment() && statusCode == (int)HttpStatusCode.InternalServerError)
        {
            message = "Đã xảy ra lỗi hệ thống. Vui lòng thử lại sau.";
        }

        httpContext.Response.StatusCode = statusCode;
        httpContext.Response.ContentType = "application/json";

        var response = new ResponseDto
        {
            Success = false,
            Message = message,
            ErrorCode = errorCode,
            Data = null
        };

        if (environment.IsDevelopment())
        {
            response.TraceId = httpContext.TraceIdentifier;
            response.Detail = exception.ToString();
        }

        await httpContext.Response.WriteAsync(
            JsonSerializer.Serialize(response, JsonSerializerOptionsCache.Options),
            cancellationToken);

        return true;
    }

    private static (int StatusCode, string Message, string? ErrorCode) MapException(Exception exception)
    {
        return exception switch
        {
            AuthenticationFailedException ex => ((int)HttpStatusCode.Unauthorized, ex.Message, "AUTH_INVALID_CREDENTIALS"),

            KeyNotFoundException ex => ((int)HttpStatusCode.NotFound, ex.Message, "NOT_FOUND"),

            ArgumentNullException ex => ((int)HttpStatusCode.BadRequest, ex.Message, "BAD_REQUEST"),
            ArgumentException ex => ((int)HttpStatusCode.BadRequest, ex.Message, "BAD_REQUEST"),
            FormatException ex => ((int)HttpStatusCode.BadRequest, ex.Message, "BAD_REQUEST"),

            UnauthorizedAccessException ex => ((int)HttpStatusCode.Forbidden, ex.Message, "FORBIDDEN"),

            InvalidOperationException ex => ((int)HttpStatusCode.Conflict, ex.Message, "CONFLICT"),

            ApiException ex => ((int)HttpStatusCode.BadGateway, ex.Message, "PAYOS_API_ERROR"),

            PayOSException ex => ((int)HttpStatusCode.BadRequest, ex.Message, "PAYOS_INVALID"),

            NotImplementedException ex => ((int)HttpStatusCode.NotImplemented, ex.Message, "NOT_IMPLEMENTED"),

            DbUpdateConcurrencyException ex => ((int)HttpStatusCode.Conflict, ex.Message, "CONCURRENCY_CONFLICT"),

            DbUpdateException ex => MapDbUpdateException(ex),

            _ => ((int)HttpStatusCode.InternalServerError, exception.Message, "INTERNAL_ERROR")
        };
    }

    private static (int StatusCode, string Message, string? ErrorCode) MapDbUpdateException(DbUpdateException ex)
    {
        if (ex.InnerException is SqlException sql)
        {
            if (sql.Number is 2601 or 2627)
            {
                return ((int)HttpStatusCode.Conflict, "Dữ liệu trùng hoặc vi phạm ràng buộc duy nhất.", "DUPLICATE_KEY");
            }

            // 207 = invalid column name, 208 = invalid object name
            if (sql.Number is 207 or 208)
            {
                return (
                    (int)HttpStatusCode.BadRequest,
                    $"Thiếu bảng/cột DB hoặc tên bảng lệch EF. Chạy migration SQL tương ứng (vd. migration_warranty_per_order_item.sql cho OrderItemId/WarrantyTicketLines) rồi restart BE. SQL: {sql.Message}",
                    "DATABASE_SCHEMA_MISSING");
            }

            if (sql.Number is 547)
            {
                return ((int)HttpStatusCode.BadRequest, "Dữ liệu không hợp lệ hoặc vi phạm ràng buộc khóa ngoại.", "DATABASE_ERROR");
            }
        }

        return ((int)HttpStatusCode.BadRequest, "Không thể lưu dữ liệu.", "DATABASE_ERROR");
    }

    private static class JsonSerializerOptionsCache
    {
        public static readonly JsonSerializerOptions Options = new()
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
            DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull
        };
    }
}
