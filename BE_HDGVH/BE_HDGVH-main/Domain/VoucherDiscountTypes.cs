namespace BE_API.Domain;

/// <summary>Giá trị gợi ý cho <see cref="Entities.Voucher.DiscountType"/> (so khớp không phân biệt hoa thường).</summary>
public static class VoucherDiscountTypes
{
    public const string Percentage = "Percentage";
    public const string FixedAmount = "FixedAmount";

    public static readonly string[] All = [Percentage, FixedAmount];

    public static bool IsValid(string? discountType)
        => !string.IsNullOrWhiteSpace(discountType) && All.Contains(discountType, StringComparer.OrdinalIgnoreCase);
}
