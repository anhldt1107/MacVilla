namespace BE_API.Dto.Store;

public class StoreNotificationListItemDto
{
    public int Id { get; set; }
    public string EventType { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string? Body { get; set; }
    public string? EntityType { get; set; }
    public string? EntityId { get; set; }
    public string DeepLinkPath { get; set; } = string.Empty;
    public string Priority { get; set; } = "Normal";
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset? ReadAt { get; set; }
    public bool IsRead => ReadAt.HasValue;
}

public class StoreNotificationUnreadCountDto
{
    public int UnreadCount { get; set; }
}
