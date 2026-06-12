using BE_API.Entities;
using Microsoft.EntityFrameworkCore;

namespace BE_API.Domain;

/// <summary>
/// Utility để tạo mã phiếu bảo hành unique (WRTyyyyMMddxxxx)
/// </summary>
public static class WarrantyTicketCodes
{
    private const string Prefix = "WRT";

    /// <summary>
    /// Tạo mã phiếu bảo hành unique dạng WRTyyyyMMddxxxx
    /// </summary>
    public static async Task<string> GenerateUniqueAsync(
        DbSet<WarrantyTicket> dbSet,
        CancellationToken cancellationToken = default)
    {
        var today = DateTime.UtcNow.ToString("yyyyMMdd");
        var pattern = $"{Prefix}{today}%";

        var maxCode = await dbSet
            .AsNoTracking()
            .Where(t => EF.Functions.Like(t.TicketNumber, pattern))
            .OrderByDescending(t => t.TicketNumber)
            .Select(t => t.TicketNumber)
            .FirstOrDefaultAsync(cancellationToken);

        var sequence = 1;
        if (!string.IsNullOrEmpty(maxCode) && maxCode.Length >= 15)
        {
            if (int.TryParse(maxCode.Substring(11), out var lastSeq))
            {
                sequence = lastSeq + 1;
            }
        }

        return $"{Prefix}{today}{sequence:D4}";
    }
}
