using BE_API.Database;
using BE_API.Domain;
using BE_API.Dto.Admin.Dashboard;
using BE_API.Service.IService;
using Microsoft.EntityFrameworkCore;

namespace BE_API.Service.Dashboard;

public class DashboardRevenueService(BeContext db) : IDashboardRevenueService
{
    public async Task<RevenueOverviewDto> GetOverviewAsync(
        DateTime? fromDate,
        DateTime? toDate,
        CancellationToken cancellationToken = default)
    {
        var (from, toExclusive) = DashboardDateRange.Normalize(fromDate, toDate);

        var paymentRows = await db.PaymentTransactions.AsNoTracking()
            .Where(p => p.PaymentDate >= from && p.PaymentDate < toExclusive)
            .Select(p => new { p.TransactionType, p.Amount })
            .ToListAsync(cancellationToken);

        var totalIn = paymentRows
            .Where(p => PaymentTransactionTypes.IsIncome(p.TransactionType ?? string.Empty))
            .Sum(p => p.Amount);
        var totalOut = paymentRows
            .Where(p => PaymentTransactionTypes.IsOutcome(p.TransactionType ?? string.Empty))
            .Sum(p => p.Amount);

        var orderRows = await db.CustomerOrders.AsNoTracking()
            .Where(o => o.CreatedAt >= from && o.CreatedAt < toExclusive)
            .Select(o => new { o.OrderStatus, o.PayableTotal })
            .ToListAsync(cancellationToken);

        var nonCancelled = orderRows
            .Where(o => !string.Equals(o.OrderStatus, OrderStatuses.Cancelled, StringComparison.OrdinalIgnoreCase))
            .ToList();
        var totalOrderValue = nonCancelled.Sum(o => o.PayableTotal);
        var orderCount = nonCancelled.Count;
        var cancelledOrderCount = orderRows.Count - orderCount;

        var newCustomerCount = await db.Customers.AsNoTracking()
            .CountAsync(c => c.CreatedAt >= from && c.CreatedAt < toExclusive, cancellationToken);

        var aov = orderCount > 0 ? totalOrderValue / orderCount : 0m;
        var refundRate = totalIn > 0 ? totalOut / totalIn : 0m;

        return new RevenueOverviewDto
        {
            FromDate = from,
            ToDate = toExclusive.AddTicks(-1),
            NetRevenue = totalIn - totalOut,
            TotalIn = totalIn,
            TotalOut = totalOut,
            OrderCount = orderCount,
            CancelledOrderCount = cancelledOrderCount,
            TotalOrderValue = totalOrderValue,
            AverageOrderValue = Math.Round(aov, 2),
            RefundRate = Math.Round(refundRate, 4),
            NewCustomerCount = newCustomerCount
        };
    }

    public async Task<RevenueTimeseriesDto> GetTimeseriesAsync(
        DateTime? fromDate,
        DateTime? toDate,
        string granularity,
        CancellationToken cancellationToken = default)
    {
        granularity = DashboardGranularities.Normalize(granularity);
        var (from, toExclusive) = DashboardDateRange.Normalize(fromDate, toDate);

        var rows = await db.PaymentTransactions.AsNoTracking()
            .Where(p => p.PaymentDate >= from && p.PaymentDate < toExclusive)
            .Select(p => new { p.PaymentDate, p.TransactionType, p.Amount })
            .ToListAsync(cancellationToken);

        var grouped = rows
            .GroupBy(r => DashboardDateRange.ToBucketKey(r.PaymentDate, granularity))
            .ToDictionary(g => g.Key, g => new
            {
                In = g.Where(x => PaymentTransactionTypes.IsIncome(x.TransactionType ?? string.Empty)).Sum(x => x.Amount),
                Out = g.Where(x => PaymentTransactionTypes.IsOutcome(x.TransactionType ?? string.Empty)).Sum(x => x.Amount)
            });

        var points = DashboardDateRange.EnumerateBucketKeys(from, toExclusive, granularity)
            .Select(key =>
            {
                grouped.TryGetValue(key, out var sums);
                var inAmt = sums?.In ?? 0m;
                var outAmt = sums?.Out ?? 0m;
                return new TimeseriesPointDto
                {
                    Bucket = key,
                    InAmount = inAmt,
                    OutAmount = outAmt,
                    Net = inAmt - outAmt
                };
            })
            .ToList();

        return new RevenueTimeseriesDto
        {
            Granularity = granularity,
            Points = points
        };
    }

    public async Task<RevenueByPaymentMethodDto> GetByPaymentMethodAsync(
        DateTime? fromDate,
        DateTime? toDate,
        CancellationToken cancellationToken = default)
    {
        var (from, toExclusive) = DashboardDateRange.Normalize(fromDate, toDate);

        var rows = await db.PaymentTransactions.AsNoTracking()
            .Where(p => p.PaymentDate >= from && p.PaymentDate < toExclusive)
            .Where(p => p.TransactionType == PaymentTransactionTypes.Payment
                        || p.TransactionType == PaymentTransactionTypes.AdjustmentIncrease)
            .Select(p => new { p.PaymentMethod, p.Amount })
            .ToListAsync(cancellationToken);

        var grouped = rows
            .GroupBy(r => string.IsNullOrWhiteSpace(r.PaymentMethod) ? "Unknown" : r.PaymentMethod!)
            .Select(g => new { Label = g.Key, Amount = g.Sum(x => x.Amount) })
            .OrderByDescending(x => x.Amount)
            .ToList();

        var total = grouped.Sum(x => x.Amount);

        var buckets = grouped.Select(x => new AmountBucketDto
        {
            Label = x.Label,
            Amount = x.Amount,
            Share = total > 0 ? Math.Round(x.Amount / total, 4) : 0m
        }).ToList();

        return new RevenueByPaymentMethodDto
        {
            Buckets = buckets,
            Total = total
        };
    }

    public async Task<RevenueByChannelDto> GetByChannelAsync(
        DateTime? fromDate,
        DateTime? toDate,
        string granularity,
        CancellationToken cancellationToken = default)
    {
        granularity = DashboardGranularities.Normalize(granularity);
        var (from, toExclusive) = DashboardDateRange.Normalize(fromDate, toDate);

        var rows = await db.CustomerOrders.AsNoTracking()
            .Where(o => o.CreatedAt >= from && o.CreatedAt < toExclusive)
            .Where(o => o.OrderStatus != OrderStatuses.Cancelled)
            .Join(db.Customers.AsNoTracking(), o => o.CustomerId, c => c.Id, (o, c) => new
            {
                o.CreatedAt,
                o.PayableTotal,
                c.CustomerType
            })
            .ToListAsync(cancellationToken);

        var grouped = rows
            .GroupBy(r => DashboardDateRange.ToBucketKey(r.CreatedAt, granularity))
            .ToDictionary(g => g.Key, g => new
            {
                B2c = g.Where(x => string.Equals(x.CustomerType, CustomerTypes.B2C, StringComparison.OrdinalIgnoreCase)).Sum(x => x.PayableTotal),
                B2b = g.Where(x => string.Equals(x.CustomerType, CustomerTypes.B2B, StringComparison.OrdinalIgnoreCase)).Sum(x => x.PayableTotal)
            });

        var points = DashboardDateRange.EnumerateBucketKeys(from, toExclusive, granularity)
            .Select(key =>
            {
                grouped.TryGetValue(key, out var sums);
                return new RevenueByChannelPointDto
                {
                    Bucket = key,
                    B2c = sums?.B2c ?? 0m,
                    B2b = sums?.B2b ?? 0m
                };
            })
            .ToList();

        return new RevenueByChannelDto
        {
            Granularity = granularity,
            Points = points,
            Totals = new RevenueByChannelTotalsDto
            {
                B2c = points.Sum(p => p.B2c),
                B2b = points.Sum(p => p.B2b)
            }
        };
    }
}
