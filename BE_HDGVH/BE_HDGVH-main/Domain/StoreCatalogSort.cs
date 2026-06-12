namespace BE_API.Domain;

/// <summary>Tham số <c>sort</c> công khai cho danh sách sản phẩm storefront.</summary>
public static class StoreCatalogSort
{
    /// <summary>Khớp legacy: OrderBy(Name).</summary>
    public const string NameAsc = "name_asc";
    public const string NameDesc = "name_desc";
    public const string PriceAsc = "price_asc";
    public const string PriceDesc = "price_desc";

    public static bool TryNormalize(string? sort, out string normalized)
    {
        normalized = NameAsc;
        if (string.IsNullOrWhiteSpace(sort))
            return false;

        var k = sort.Trim().ToLowerInvariant();
        normalized = k switch
        {
            NameAsc => NameAsc,
            NameDesc => NameDesc,
            PriceAsc => PriceAsc,
            PriceDesc => PriceDesc,
            _ => NameAsc
        };
        return k is NameAsc or NameDesc or PriceAsc or PriceDesc;
    }
}
