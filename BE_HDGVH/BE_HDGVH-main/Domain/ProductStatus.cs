namespace BE_API.Domain;

/// <summary>Giá trị <see cref="Entities.Product.Status"/> được API chấp nhận.</summary>
public static class ProductStatus
{
    public const string Active = "Active";
    public const string Draft = "Draft";
    public const string Hidden = "Hidden";

    private static readonly HashSet<string> Allowed = new(StringComparer.OrdinalIgnoreCase)
    {
        Active,
        Draft,
        Hidden
    };

    public static void EnsureValid(string status)
    {
        if (string.IsNullOrWhiteSpace(status) || !Allowed.Contains(status.Trim()))
            throw new ArgumentException($"Trạng thái không hợp lệ. Dùng: {Active}, {Draft}, {Hidden}.");
    }

    public static string Normalize(string status) => status.Trim();
}
