using BE_API.Entities;
using Microsoft.EntityFrameworkCore;

namespace BE_API.Domain;

public static class QuoteCodes
{
    /// <summary>Sinh mã báo giá unique (tiền tố QT + ngày UTC + hậu tố ngẫu nhiên).</summary>
    public static async Task<string> GenerateUniqueAsync(
        IQueryable<Quote> quotes,
        CancellationToken cancellationToken = default)
    {
        for (var attempt = 0; attempt < 30; attempt++)
        {
            var suffix = Random.Shared.Next(100_000, 999_999);
            var code = $"QT{DateTime.UtcNow:yyyyMMdd}{suffix}";
            var exists = await quotes.AsNoTracking().AnyAsync(q => q.QuoteCode == code, cancellationToken);
            if (!exists)
                return code;
        }

        throw new InvalidOperationException("Không sinh được mã báo giá.");
    }
}
