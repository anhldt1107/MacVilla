using System.Text.Json.Nodes;

namespace BE_API.Service.Ai;

/// <summary>Một message gửi cho Gemini (đã được chuyển đổi từ AiChatMessage trong DB).</summary>
public class GeminiContentMessage
{
    /// <summary>"user" | "model" | "function".</summary>
    public string Role { get; set; } = "user";

    /// <summary>Text content (cho user/model/function-response).</summary>
    public string? Text { get; set; }

    /// <summary>Tên function khi role = "model" và đây là tool-call, hoặc role = "function" và đây là tool-result.</summary>
    public string? FunctionName { get; set; }

    /// <summary>Args JSON (object) khi assistant gọi tool.</summary>
    public JsonObject? FunctionArgs { get; set; }

    /// <summary>Result JSON (object) khi gửi tool result về Gemini.</summary>
    public JsonObject? FunctionResponse { get; set; }
}

/// <summary>Request gửi đến Gemini.</summary>
public class GeminiRequest
{
    public string SystemInstruction { get; set; } = string.Empty;
    public List<GeminiContentMessage> Messages { get; set; } = new();

    /// <summary>Mảng functionDeclarations (mỗi cái là JsonObject với name/description/parameters).</summary>
    public List<JsonObject> FunctionDeclarations { get; set; } = new();
}

/// <summary>Response phẳng từ Gemini sau khi parse.</summary>
public class GeminiResponse
{
    /// <summary>Text trả về (null khi đây là function-call).</summary>
    public string? Text { get; set; }

    public string? FunctionCallName { get; set; }
    public JsonObject? FunctionCallArgs { get; set; }

    public int? PromptTokens { get; set; }
    public int? CompletionTokens { get; set; }

    /// <summary>Raw JSON gốc của Gemini (để log nếu cần).</summary>
    public string? RawJson { get; set; }
}
