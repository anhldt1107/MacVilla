using BE_API.Database;
using BE_API.Domain;
using BE_API.Dto.Admin.Dashboard;
using BE_API.Service.IService;
using Microsoft.EntityFrameworkCore;

namespace BE_API.Service.Dashboard;

public class DashboardOperationsService(BeContext db) : IDashboardOperationsService
{
    private static readonly string[] InProgressOrderStatuses =
    [
        OrderStatuses.Confirmed,
        OrderStatuses.Processing,
        OrderStatuses.ReadyToShip
    ];

    public async Task<StatusBreakdownDto> GetOrderStatusBreakdownAsync(
        DateTime? fromDate,
        DateTime? toDate,
        CancellationToken cancellationToken = default)
    {
        var (from, toExclusive) = DashboardDateRange.Normalize(fromDate, toDate);

        var rows = await db.CustomerOrders.AsNoTracking()
            .Where(o => o.CreatedAt >= from && o.CreatedAt < toExclusive)
            .GroupBy(o => o.OrderStatus)
            .Select(g => new { Status = g.Key, Count = g.Count() })
            .ToListAsync(cancellationToken);

        return BuildBreakdown(OrderStatuses.All, rows.ToDictionary(r => r.Status, r => r.Count, StringComparer.OrdinalIgnoreCase));
    }

    public async Task<StatusBreakdownDto> GetFulfillmentStatusAsync(
        DateTime? fromDate,
        DateTime? toDate,
        CancellationToken cancellationToken = default)
    {
        var (from, toExclusive) = DashboardDateRange.Normalize(fromDate, toDate);

        var rows = await db.FulfillmentTickets.AsNoTracking()
            .Where(f => f.CreatedAt >= from && f.CreatedAt < toExclusive)
            .GroupBy(f => f.Status)
            .Select(g => new { Status = g.Key, Count = g.Count() })
            .ToListAsync(cancellationToken);

        return BuildBreakdown(FulfillmentStatuses.All, rows.ToDictionary(r => r.Status, r => r.Count, StringComparer.OrdinalIgnoreCase));
    }

    public async Task<SlaConfirmedToShippedDto> GetSlaConfirmedToShippedAsync(
        DateTime? fromDate,
        DateTime? toDate,
        CancellationToken cancellationToken = default)
    {
        var (from, toExclusive) = DashboardDateRange.Normalize(fromDate, toDate);

        var rows = await db.FulfillmentTickets.AsNoTracking()
            .Where(f => f.Status == FulfillmentStatuses.Shipped
                        && f.UpdatedAt != null
                        && f.UpdatedAt >= from && f.UpdatedAt < toExclusive)
            .Select(f => new
            {
                OrderCreatedAt = f.Order.CreatedAt,
                ShippedAt = f.UpdatedAt!.Value
            })
            .ToListAsync(cancellationToken);

        var hours = rows
            .Select(r => (decimal)(r.ShippedAt - r.OrderCreatedAt).TotalHours)
            .Where(h => h >= 0)
            .OrderBy(h => h)
            .ToList();

        if (hours.Count == 0)
        {
            return new SlaConfirmedToShippedDto
            {
                AvgHours = null,
                P50Hours = null,
                P90Hours = null,
                SampleSize = 0,
                Histogram = BuildEmptyHistogram()
            };
        }

        var avg = Math.Round(hours.Average(), 1);
        var p50 = Math.Round(Percentile(hours, 0.5), 1);
        var p90 = Math.Round(Percentile(hours, 0.9), 1);

        return new SlaConfirmedToShippedDto
        {
            AvgHours = avg,
            P50Hours = p50,
            P90Hours = p90,
            SampleSize = hours.Count,
            Histogram = BuildHistogram(hours)
        };
    }

    public async Task<LateOrdersDto> GetLateOrdersAsync(
        int slaHours,
        CancellationToken cancellationToken = default)
    {
        if (slaHours < 1) slaHours = 72;
        if (slaHours > 720) slaHours = 720;

        var nowUtc = DateTime.UtcNow;
        var threshold = nowUtc.AddHours(-slaHours);

        var rows = await db.CustomerOrders.AsNoTracking()
            .Include(o => o.Customer)
            .Include(o => o.Sales)
            .Where(o => InProgressOrderStatuses.Contains(o.OrderStatus)
                        && o.CreatedAt < threshold)
            .OrderBy(o => o.CreatedAt)
            .Select(o => new LateOrderItemDto
            {
                OrderId = o.Id,
                OrderCode = o.OrderCode,
                CustomerName = o.Customer.CompanyName ?? o.Customer.FullName,
                OrderStatus = o.OrderStatus,
                CreatedAt = o.CreatedAt,
                SalesName = o.Sales != null ? o.Sales.FullName : null
            })
            .ToListAsync(cancellationToken);

        foreach (var r in rows)
        {
            r.ElapsedHours = Math.Round((decimal)(nowUtc - r.CreatedAt).TotalHours, 1);
        }

        return new LateOrdersDto
        {
            SlaHours = slaHours,
            Items = rows
        };
    }

    private static StatusBreakdownDto BuildBreakdown(IReadOnlyList<string> ordered, Dictionary<string, int> counts)
    {
        var total = counts.Values.Sum();
        var buckets = ordered.Select(s =>
        {
            counts.TryGetValue(s, out var count);
            return new CountBucketDto
            {
                Label = s,
                Count = count,
                Share = total > 0 ? Math.Round((decimal)count / total, 4) : 0m
            };
        }).ToList();

        return new StatusBreakdownDto { Buckets = buckets, Total = total };
    }

    private static List<CountBucketDto> BuildEmptyHistogram()
    {
        return new List<CountBucketDto>
        {
            new() { Label = "0-24",   Count = 0, Share = 0m },
            new() { Label = "24-48",  Count = 0, Share = 0m },
            new() { Label = "48-72",  Count = 0, Share = 0m },
            new() { Label = "72-168", Count = 0, Share = 0m },
            new() { Label = ">168",   Count = 0, Share = 0m }
        };
    }

    private static List<CountBucketDto> BuildHistogram(List<decimal> hours)
    {
        var buckets = BuildEmptyHistogram();
        foreach (var h in hours)
        {
            if (h <= 24) buckets[0].Count++;
            else if (h <= 48) buckets[1].Count++;
            else if (h <= 72) buckets[2].Count++;
            else if (h <= 168) buckets[3].Count++;
            else buckets[4].Count++;
        }
        var total = hours.Count;
        foreach (var b in buckets)
        {
            b.Share = total > 0 ? Math.Round((decimal)b.Count / total, 4) : 0m;
        }
        return buckets;
    }

    private static decimal Percentile(IList<decimal> sorted, double p)
    {
        if (sorted.Count == 0) return 0m;
        if (sorted.Count == 1) return sorted[0];
        var idx = (sorted.Count - 1) * p;
        var lower = (int)Math.Floor(idx);
        var upper = (int)Math.Ceiling(idx);
        if (lower == upper) return sorted[lower];
        var weight = (decimal)(idx - lower);
        return sorted[lower] + (sorted[upper] - sorted[lower]) * weight;
    }
}
