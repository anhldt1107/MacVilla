namespace BE_API.Dto.Common;

public class ResponseDto
{
    public bool Success { get; set; } = true;

    public object? Data { get; set; }

    public string Message { get; set; } = string.Empty;

    /// <summary>Mã lỗi ổn định cho client (ví dụ NOT_FOUND, VALIDATION_ERROR).</summary>
    public string? ErrorCode { get; set; }

    /// <summary>Lỗi validation theo tên field (chỉ dùng khi Success = false và có lỗi model).</summary>
    public IDictionary<string, string[]>? Errors { get; set; }

    /// <summary>Chỉ gửi khi môi trường Development (hỗ trợ debug).</summary>
    public string? TraceId { get; set; }

    /// <summary>Stack / chi tiết exception; chỉ Development.</summary>
    public string? Detail { get; set; }
}
