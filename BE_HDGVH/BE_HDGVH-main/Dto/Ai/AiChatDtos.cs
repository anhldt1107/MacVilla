using System.ComponentModel.DataAnnotations;

namespace BE_API.Dto.Ai;

public class AiChatRequestDto
{
    /// <summary>Id thread (null = tạo mới).</summary>
    public int? ThreadId { get; set; }

    [Required(AllowEmptyStrings = false, ErrorMessage = "Vui lòng nhập nội dung.")]
    [StringLength(4000, ErrorMessage = "Tin nhắn quá dài (tối đa 4000 ký tự).")]
    public string Message { get; set; } = string.Empty;
}

public class AiToolUsageDto
{
    public string ToolName { get; set; } = string.Empty;
    public int? LatencyMs { get; set; }
    public bool Success { get; set; }
    public string? Error { get; set; }
}

public class AiChatResponseDto
{
    public int ThreadId { get; set; }
    public string AssistantMessage { get; set; } = string.Empty;
    public List<AiToolUsageDto> ToolsUsed { get; set; } = new();

    /// <summary>Cards đính kèm để FE render UI giàu (sản phẩm, đơn...). Có thể rỗng nếu lượt chat không tham chiếu dữ liệu cấu trúc.</summary>
    public List<AiAttachmentDto> Attachments { get; set; } = new();

    public int? TokensIn { get; set; }
    public int? TokensOut { get; set; }
    public int LatencyMs { get; set; }
}

public class AiThreadListItemDto
{
    public int Id { get; set; }
    public string Role { get; set; } = string.Empty;
    public string? Title { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public int MessageCount { get; set; }
    public string? LastMessagePreview { get; set; }
}

public class AiMessageDto
{
    public int Id { get; set; }
    public string MessageRole { get; set; } = string.Empty;
    public string? Content { get; set; }
    public string? ToolName { get; set; }
    public string? ToolArgsJson { get; set; }
    public string? ToolResultJson { get; set; }
    public DateTime CreatedAt { get; set; }
}
