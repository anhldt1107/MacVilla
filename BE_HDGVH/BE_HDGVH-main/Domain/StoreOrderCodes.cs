using BE_API.Entities;
using Microsoft.EntityFrameworkCore;

namespace BE_API.Domain;

public static class StoreOrderCodes
{
    private const string Prefix = "B2C";

    /// <summary>Sinh mã đơn unique: B2C + Unix timestamp (giây UTC).</summary>
    public static async Task<string> GenerateUniqueAsync(
        IQueryable<CustomerOrder> orders,
        CancellationToken cancellationToken = default)
    {
        for (var attempt = 0; attempt < 30; attempt++)
        {
            var ts = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
            var code = FormatFromPayOsOrderCode((int)ts);
            var exists = await orders.AsNoTracking().AnyAsync(o => o.OrderCode == code, cancellationToken);
            if (!exists)
                return code;

            await Task.Delay(1000, cancellationToken);
        }

        throw new InvalidOperationException("Không sinh được mã đơn hàng.");
    }

    /// <summary>Parse payOS orderCode từ OrderCode hiển thị (B2C + số).</summary>
    public static int? TryParsePayOsOrderCode(string orderCode)
    {
        if (string.IsNullOrWhiteSpace(orderCode))
            return null;

        var trimmed = orderCode.Trim();
        if (!trimmed.StartsWith(Prefix, StringComparison.OrdinalIgnoreCase))
            return null;

        var numeric = trimmed[Prefix.Length..];
        if (numeric.Length == 0 || !numeric.All(char.IsDigit))
            return null;

        if (!int.TryParse(numeric, out var code) || code <= 0)
            return null;

        return code;
    }

    /// <summary>Chuyển payOS orderCode sang OrderCode hiển thị.</summary>
    public static string FormatFromPayOsOrderCode(int payOsOrderCode) =>
        $"{Prefix}{payOsOrderCode}";

    /// <summary>Mô tả payOS (tối đa 9 ký tự) — 9 chữ số cuối của phần số.</summary>
    public static string BuildPayOsDescription(string orderCode)
    {
        var numeric = orderCode.Trim();
        if (numeric.StartsWith(Prefix, StringComparison.OrdinalIgnoreCase))
            numeric = numeric[Prefix.Length..];

        numeric = numeric.Replace(" ", "", StringComparison.Ordinal);
        if (numeric.Length == 0)
            return "B2C";

        return numeric.Length <= 9 ? numeric : numeric[^9..];
    }
}
