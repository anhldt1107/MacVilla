using BE_API.Database;
using BE_API.Domain;
using BE_API.Dto.Admin.Dashboard;
using BE_API.Service.IService;
using Microsoft.EntityFrameworkCore;

namespace BE_API.Service.Dashboard;

public class DashboardSalesPipelineService(BeContext db) : IDashboardSalesPipelineService
{
    private static readonly string[] FunnelOrder =
    [
        QuoteStatuses.Requested,
        QuoteStatuses.Draft,
        QuoteStatuses.PendingApproval,
        QuoteStatuses.Approved,
        QuoteStatuses.CustomerAccepted,
        QuoteStatuses.Converted
    ];

    public async Task<FunnelDto> GetFunnelAsync(
        DateTime? fromDate,
        DateTime? toDate,
        int? salesId,
        CancellationToken cancellationToken = default)
    {
        var (from, toExclusive) = DashboardDateRange.Normalize(fromDate, toDate);

        var query = db.Quotes.AsNoTracking()
            .Where(q => q.CreatedAt >= from && q.CreatedAt < toExclusive);
        if (salesId.HasValue) query = query.Where(q => q.SalesId == salesId.Value);

        var rows = await query
            .Select(q => new { q.Status, q.FinalAmount })
            .ToListAsync(cancellationToken);

        var grouped = rows
            .GroupBy(r => r.Status)
            .ToDictionary(g => g.Key, g => new
            {
                Count = g.Count(),
                Total = g.Sum(x => x.FinalAmount ?? 0m)
            }, StringComparer.OrdinalIgnoreCase);

        var steps = FunnelOrder.Select(status =>
        {
            grouped.TryGetValue(status, out var stat);
            return new FunnelStepDto
            {
                Status = status,
                Count = stat?.Count ?? 0,
                TotalValue = stat?.Total ?? 0m
            };
        }).ToList();

        return new FunnelDto { Steps = steps };
    }

    public async Task<SalesConversionDto> GetConversionAsync(
        DateTime? fromDate,
        DateTime? toDate,
        int? salesId,
        CancellationToken cancellationToken = default)
    {
        var (from, toExclusive) = DashboardDateRange.Normalize(fromDate, toDate);

        var quotes = db.Quotes.AsNoTracking().AsQueryable();
        if (salesId.HasValue) quotes = quotes.Where(q => q.SalesId == salesId.Value);

        var approved = await quotes
            .Where(q => q.ApprovedAt != null && q.ApprovedAt >= from && q.ApprovedAt < toExclusive)
            .Select(q => new { q.CreatedAt, q.ApprovedAt })
            .ToListAsync(cancellationToken);

        var accepted = await quotes
            .Where(q => q.CustomerAcceptedAt != null && q.CustomerAcceptedAt >= from && q.CustomerAcceptedAt < toExclusive)
            .Select(q => new { q.ApprovedAt, q.CustomerAcceptedAt })
            .ToListAsync(cancellationToken);

        var converted = await quotes
            .Where(q => q.Status == QuoteStatuses.Converted && q.CreatedAt >= from && q.CreatedAt < toExclusive)
            .CountAsync(cancellationToken);

        var approvedCount = approved.Count;
        var acceptedCount = accepted.Count;

        var avgRequestedToApproved = approved.Count > 0
            ? approved.Where(x => x.ApprovedAt.HasValue).Average(x => (decimal)(x.ApprovedAt!.Value - x.CreatedAt).TotalDays)
            : (decimal?)null;
        var avgApprovedToAccepted = accepted.Count > 0
            ? accepted.Where(x => x.ApprovedAt.HasValue && x.CustomerAcceptedAt.HasValue)
                       .Select(x => (decimal)(x.CustomerAcceptedAt!.Value - x.ApprovedAt!.Value).TotalDays)
                       .DefaultIfEmpty(0m)
                       .Average()
            : (decimal?)null;

        var acceptRate = approvedCount > 0 ? (decimal)acceptedCount / approvedCount : 0m;
        var conversionRate = approvedCount > 0 ? (decimal)converted / approvedCount : 0m;

        return new SalesConversionDto
        {
            AcceptRate = Math.Round(acceptRate, 4),
            ConversionRate = Math.Round(conversionRate, 4),
            AvgTimeRequestedToApprovedDays = avgRequestedToApproved.HasValue ? Math.Round(avgRequestedToApproved.Value, 2) : null,
            AvgTimeApprovedToAcceptedDays = avgApprovedToAccepted.HasValue ? Math.Round(avgApprovedToAccepted.Value, 2) : null,
            ApprovedQuoteCount = approvedCount,
            AcceptedQuoteCount = acceptedCount,
            ConvertedQuoteCount = converted
        };
    }

    public async Task<TimeInStageListDto> GetTimeInStageAsync(
        DateTime? fromDate,
        DateTime? toDate,
        int? salesId,
        CancellationToken cancellationToken = default)
    {
        var (from, toExclusive) = DashboardDateRange.Normalize(fromDate, toDate);

        var quotes = db.Quotes.AsNoTracking().AsQueryable();
        if (salesId.HasValue) quotes = quotes.Where(q => q.SalesId == salesId.Value);

        var inRange = quotes.Where(q => q.CreatedAt >= from && q.CreatedAt < toExclusive);

        var pendingToApproved = await inRange
            .Where(q => q.ApprovedAt != null)
            .Select(q => new { q.CreatedAt, q.ApprovedAt })
            .ToListAsync(cancellationToken);

        var approvedToAccepted = await inRange
            .Where(q => q.ApprovedAt != null && q.CustomerAcceptedAt != null)
            .Select(q => new { q.ApprovedAt, q.CustomerAcceptedAt })
            .ToListAsync(cancellationToken);

        var acceptedToConverted = await inRange
            .Where(q => q.CustomerAcceptedAt != null && q.Status == QuoteStatuses.Converted)
            .Join(db.CustomerOrders.AsNoTracking(), q => q.Id, o => o.QuoteId, (q, o) => new
            {
                q.CustomerAcceptedAt,
                OrderCreatedAt = o.CreatedAt
            })
            .ToListAsync(cancellationToken);

        var stages = new List<TimeInStageDto>
        {
            BuildStage(QuoteStatuses.PendingApproval, QuoteStatuses.Approved,
                pendingToApproved.Select(x => (decimal)(x.ApprovedAt!.Value - x.CreatedAt).TotalDays)),
            BuildStage(QuoteStatuses.Approved, QuoteStatuses.CustomerAccepted,
                approvedToAccepted.Select(x => (decimal)(x.CustomerAcceptedAt!.Value - x.ApprovedAt!.Value).TotalDays)),
            BuildStage(QuoteStatuses.CustomerAccepted, QuoteStatuses.Converted,
                acceptedToConverted.Select(x => (decimal)(x.OrderCreatedAt - x.CustomerAcceptedAt!.Value).TotalDays))
        };

        return new TimeInStageListDto { Stages = stages };
    }

    public async Task<ExpiringQuotesDto> GetExpiringSoonAsync(
        int days,
        int? salesId,
        CancellationToken cancellationToken = default)
    {
        if (days < 1) days = 7;
        if (days > 60) days = 60;

        var nowUtc = DateTime.UtcNow;
        var cutoff = nowUtc.AddDays(days);

        var query = db.Quotes.AsNoTracking()
            .Include(q => q.Customer)
            .Include(q => q.Sales)
            .Where(q => q.Status == QuoteStatuses.Approved
                        && q.ValidUntil != null
                        && q.ValidUntil >= nowUtc
                        && q.ValidUntil <= cutoff);

        if (salesId.HasValue) query = query.Where(q => q.SalesId == salesId.Value);

        var items = await query
            .OrderBy(q => q.ValidUntil)
            .Select(q => new ExpiringQuoteDto
            {
                QuoteId = q.Id,
                QuoteCode = q.QuoteCode,
                CustomerName = q.Customer.CompanyName ?? q.Customer.FullName,
                SalesId = q.SalesId,
                SalesName = q.Sales != null ? q.Sales.FullName : null,
                FinalAmount = q.FinalAmount,
                ValidUntil = q.ValidUntil,
                DaysUntilExpire = q.ValidUntil != null
                    ? (decimal?)(q.ValidUntil.Value - nowUtc).TotalDays
                    : null
            })
            .ToListAsync(cancellationToken);

        foreach (var it in items)
        {
            if (it.DaysUntilExpire.HasValue)
                it.DaysUntilExpire = Math.Round(it.DaysUntilExpire.Value, 2);
        }

        return new ExpiringQuotesDto { Items = items };
    }

    private static TimeInStageDto BuildStage(string from, string to, IEnumerable<decimal> diffs)
    {
        var list = diffs.Where(d => d >= 0).ToList();
        return new TimeInStageDto
        {
            From = from,
            To = to,
            AvgDays = list.Count > 0 ? Math.Round(list.Average(), 2) : null,
            SampleSize = list.Count
        };
    }
}
