namespace BE_API.Configuration;

/// <summary>
/// Cấu hình Gemini chat (function-calling). Bind từ section "Gemini" trong appsettings + ENV (DotEnvLoader).
/// </summary>
public class GeminiOptions
{
    public const string SectionName = "Gemini";

    /// <summary>API key Google AI Studio. Đọc từ ENV GEMINI_API_KEY hoặc Gemini:ApiKey.</summary>
    public string ApiKey { get; set; } = string.Empty;

    /// <summary>Model id; mặc định "gemini-2.5-flash".</summary>
    public string Model { get; set; } = "gemini-2.5-flash";

    /// <summary>Base URL của Generative Language API.</summary>
    public string BaseUrl { get; set; } = "https://generativelanguage.googleapis.com/v1beta";

    /// <summary>Số vòng tool-calling tối đa cho 1 lượt user. Tránh loop vô hạn.</summary>
    public int MaxIterations { get; set; } = 5;

    /// <summary>Timeout HTTP / 1 lần gọi.</summary>
    public int RequestTimeoutSeconds { get; set; } = 60;

    /// <summary>Số tin gần nhất nạp lại từ DB cho mỗi lượt (history window).</summary>
    public int HistoryWindow { get; set; } = 30;

    /// <summary>
    /// Khách B2C/B2B: nối directive system prompt buộc trợ lý tránh trả lời câu hỏi ngoài cửa hàng.
    /// Tắt nếu QA cần hành vi chat tổng quát.
    /// </summary>
    public bool StrictTopicBoundaryStorefront { get; set; } = true;
}
