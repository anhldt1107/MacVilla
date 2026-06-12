using BE_API.Entities;
using Microsoft.EntityFrameworkCore;

namespace BE_API.Domain;

/// <summary>
/// Tạo mã phiếu đổi/trả tự động: RTN{yyyyMMdd}{sequence}
/// </summary>
public static class ReturnTicketCodes
{
    private const string Prefix = "RTN";

    public static async Task<string> GenerateUniqueAsync(
        DbSet<ReturnExchangeTicket> tickets,
        CancellationToken cancellationToken = default)
    {
        var today = DateTime.UtcNow.ToString("yyyyMMdd");
        var prefix = $"{Prefix}{today}";

        var lastTicket = await tickets
            .AsNoTracking()
            .Where(t => t.TicketNumber != null && t.TicketNumber.StartsWith(prefix))
            .OrderByDescending(t => t.TicketNumber)
            .FirstOrDefaultAsync(cancellationToken);

        int sequence = 1;
        if (lastTicket?.TicketNumber is { Length: > 11 })
        {
            var seqPart = lastTicket.TicketNumber[11..];
            if (int.TryParse(seqPart, out var lastSeq))
            {
                sequence = lastSeq + 1;
            }
        }

        return $"{prefix}{sequence:D4}";
    }
}
