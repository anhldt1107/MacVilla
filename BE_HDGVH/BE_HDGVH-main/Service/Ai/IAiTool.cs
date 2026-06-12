using System.Text.Json.Nodes;
using BE_API.Dto.Ai;

namespace BE_API.Service.Ai;

public interface IAiTool
{
    /// <summary>Tên function (dùng cho Gemini functionCall.name). Snake_case khuyến nghị.</summary>
    string Name { get; }

    /// <summary>Mô tả ngắn gọn nhất chức năng tool (Gemini đọc để biết khi nào dùng).</summary>
    string Description { get; }

    /// <summary>JSON schema mô tả parameters (kiểu OpenAPI 3.0 mà Gemini tools chấp nhận).</summary>
    JsonObject ParametersSchema { get; }

    /// <summary>Scope: ai được phép gọi tool này.</summary>
    AiActorScope Scope { get; }

    /// <summary>Thực thi tool, trả về data (gửi Gemini) và optional attachments (FE render).</summary>
    Task<AiToolResult> ExecuteAsync(JsonObject args, AiCallerContext caller, CancellationToken cancellationToken);
}

/// <summary>Kết quả 1 lần gọi tool: phần dữ liệu cho Gemini + cards cho FE.</summary>
public class AiToolResult
{
    public JsonObject Data { get; set; } = new();
    public List<AiAttachmentDto>? Attachments { get; set; }

    public static AiToolResult FromData(JsonObject data) => new() { Data = data };
    public static AiToolResult Of(JsonObject data, List<AiAttachmentDto>? cards) => new() { Data = data, Attachments = cards };
}
