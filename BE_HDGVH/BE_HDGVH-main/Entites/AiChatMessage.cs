namespace BE_API.Entities;

/// <summary>
/// Một tin trong phiên chat — có thể là user, assistant text, assistant tool-call, hoặc tool result.
/// </summary>
public class AiChatMessage : IEntity
{
    public int Id { get; set; }

    public int ThreadId { get; set; }

    /// <summary>"system" | "user" | "assistant" | "tool".</summary>
    public string MessageRole { get; set; } = null!;

    /// <summary>Nội dung text (user message hoặc assistant text). Null khi là tool-call thuần.</summary>
    public string? Content { get; set; }

    /// <summary>Tên function khi MessageRole = "assistant" (tool-call) hoặc "tool" (tool result).</summary>
    public string? ToolName { get; set; }

    /// <summary>JSON args function-call (assistant) — Gemini gửi.</summary>
    public string? ToolArgsJson { get; set; }

    /// <summary>JSON result của tool sau khi BE chạy.</summary>
    public string? ToolResultJson { get; set; }

    public int? TokensIn { get; set; }
    public int? TokensOut { get; set; }
    public int? LatencyMs { get; set; }

    public DateTime CreatedAt { get; set; }

    public AiChatThread Thread { get; set; } = null!;
}
