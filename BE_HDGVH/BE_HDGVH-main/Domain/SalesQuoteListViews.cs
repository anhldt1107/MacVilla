namespace BE_API.Domain;

/// <summary>Phạm vi danh sách báo giá khi caller là Sales.</summary>
public static class SalesQuoteListViews
{
    public const string Mine = "mine";
    public const string Queue = "queue";
    public const string All = "all";

    public static string Normalize(string? view)
    {
        if (string.IsNullOrWhiteSpace(view)) return Mine;
        var v = view.Trim().ToLowerInvariant();
        return v switch
        {
            Queue => Queue,
            All => All,
            _ => Mine
        };
    }
}
