namespace BE_API.Entities;

/// <summary>
/// Phiên hội thoại Gemini của một caller (staff hoặc customer).
/// </summary>
public class AiChatThread : IEntity
{
    public int Id { get; set; }

    /// <summary>"Staff" hoặc "Customer".</summary>
    public string OwnerType { get; set; } = null!;

    /// <summary>Id của AppUser (staff) hoặc Customer (B2B/B2C).</summary>
    public int OwnerId { get; set; }

    /// <summary>"Admin" / "Manager" / "Sales" / "B2B" / "B2C" — quyết định system prompt và tool scope.</summary>
    public string Role { get; set; } = null!;

    /// <summary>Tiêu đề hiển thị (FE có thể để Gemini tự đặt sau lượt đầu, hoặc lấy 60 ký tự đầu của user message).</summary>
    public string? Title { get; set; }

    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    public ICollection<AiChatMessage> Messages { get; set; } = new List<AiChatMessage>();
}
