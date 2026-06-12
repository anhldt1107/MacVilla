namespace BE_API.Entities;

/// <summary>Thông báo in-app cho nhân sự hoặc khách hàng.</summary>
public class UserNotification : IEntity
{
    public int Id { get; set; }

    /// <summary>Staff | Customer</summary>
    public string RecipientKind { get; set; } = string.Empty;

    public int RecipientId { get; set; }

    public string EventType { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string? Body { get; set; }

    public string? EntityType { get; set; }
    public string? EntityId { get; set; }

    /// <summary>Đường dẫn FE (shell-aware), ví dụ /manager/sales/quotations/42</summary>
    public string DeepLinkPath { get; set; } = string.Empty;

    public string Priority { get; set; } = "Normal";
    public DateTime CreatedAt { get; set; }
    public DateTime? ReadAt { get; set; }
}
