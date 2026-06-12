using BE_API.Database;
using BE_API.Domain;
using BE_API.Dto.Admin.Dashboard;
using BE_API.Service.IService;
using Microsoft.EntityFrameworkCore;

namespace BE_API.Service.Dashboard;

public class DashboardArService(BeContext db) : IDashboardArService
{
    private static readonly string[] OpenInvoiceStatuses =
    [
        InvoiceStatuses.Unpaid,
        InvoiceStatuses.PartiallyPaid,
        InvoiceStatuses.Overdue
    ];

    public async Task<ArSummaryDto> GetSummaryAsync(int dueSoonDays, CancellationToken cancellationToken = default)
    {
        if (dueSoonDays < 1) dueSoonDays = 7;
        if (dueSoonDays > 90) dueSoonDays = 90;

        var nowUtc = DateTime.UtcNow;
        var dueSoonCutoff = nowUtc.AddDays(dueSoonDays);

        var rows = await LoadOpenInvoicesAsync(cancellationToken);

        var totalUnpaid = 0m;
        var totalUnpaidCount = 0;
        var overdue = 0m;
        var overdueCount = 0;
        var dueSoon = 0m;
        var dueSoonCount = 0;

        foreach (var row in rows)
        {
            var remaining = row.Total - row.PaidIn;
            if (remaining <= 0) continue;

            totalUnpaid += remaining;
            totalUnpaidCount++;

            if (row.DueDate.HasValue)
            {
                if (row.DueDate.Value < nowUtc)
                {
                    overdue += remaining;
                    overdueCount++;
                }
                else if (row.DueDate.Value <= dueSoonCutoff)
                {
                    dueSoon += remaining;
                    dueSoonCount++;
                }
            }
        }

        return new ArSummaryDto
        {
            TotalUnpaidAmount = totalUnpaid,
            TotalUnpaidCount = totalUnpaidCount,
            OverdueAmount = overdue,
            OverdueCount = overdueCount,
            DueSoonAmount = dueSoon,
            DueSoonCount = dueSoonCount,
            DueSoonWindowDays = dueSoonDays
        };
    }

    public async Task<ArAgingDto> GetAgingAsync(CancellationToken cancellationToken = default)
    {
        var nowUtc = DateTime.UtcNow;
        var rows = await LoadOpenInvoicesAsync(cancellationToken);

        var bucketKeys = new[] { "Current", "1-30", "31-60", "61-90", ">90" };
        var amounts = bucketKeys.ToDictionary(k => k, _ => 0m);
        var counts = bucketKeys.ToDictionary(k => k, _ => 0);

        foreach (var row in rows)
        {
            var remaining = row.Total - row.PaidIn;
            if (remaining <= 0) continue;

            string bucket;
            if (!row.DueDate.HasValue || row.DueDate.Value >= nowUtc)
            {
                bucket = "Current";
            }
            else
            {
                var daysOverdue = (int)Math.Floor((nowUtc - row.DueDate.Value).TotalDays);
                if (daysOverdue <= 30) bucket = "1-30";
                else if (daysOverdue <= 60) bucket = "31-60";
                else if (daysOverdue <= 90) bucket = "61-90";
                else bucket = ">90";
            }

            amounts[bucket] += remaining;
            counts[bucket] += 1;
        }

        var total = amounts.Values.Sum();
        var buckets = bucketKeys.Select(k => new ArAgingBucketDto
        {
            Label = k,
            Amount = amounts[k],
            InvoiceCount = counts[k],
            Share = total > 0 ? Math.Round(amounts[k] / total, 4) : 0m
        }).ToList();

        return new ArAgingDto { Buckets = buckets, Total = total };
    }

    public async Task<ArTopDebtorsDto> GetTopDebtorsAsync(int limit, CancellationToken cancellationToken = default)
    {
        if (limit < 1) limit = 10;
        if (limit > 50) limit = 50;

        var nowUtc = DateTime.UtcNow;
        var rows = await db.Invoices.AsNoTracking()
            .Where(i => OpenInvoiceStatuses.Contains(i.Status))
            .Select(i => new
            {
                i.CustomerId,
                i.DueDate,
                Total = i.TotalAmount ?? 0m,
                PaidIn = i.PaymentTransactions
                    .Where(p => p.TransactionType == PaymentTransactionTypes.Payment
                                || p.TransactionType == PaymentTransactionTypes.AdjustmentIncrease)
                    .Sum(p => (decimal?)p.Amount) ?? 0m,
                PaidOut = i.PaymentTransactions
                    .Where(p => p.TransactionType == PaymentTransactionTypes.Refund
                                || p.TransactionType == PaymentTransactionTypes.AdjustmentDecrease)
                    .Sum(p => (decimal?)p.Amount) ?? 0m
            })
            .ToListAsync(cancellationToken);

        var customerStats = rows
            .Select(r => new { r.CustomerId, r.DueDate, Remaining = r.Total - r.PaidIn })
            .Where(x => x.Remaining > 0)
            .GroupBy(x => x.CustomerId)
            .Select(g => new
            {
                CustomerId = g.Key,
                Remaining = g.Sum(x => x.Remaining),
                Overdue = g.Where(x => x.DueDate.HasValue && x.DueDate.Value < nowUtc).Sum(x => x.Remaining),
                InvoiceCount = g.Count()
            })
            .OrderByDescending(x => x.Remaining)
            .Take(limit)
            .ToList();

        var customerIds = customerStats.Select(x => x.CustomerId).ToList();
        var customers = await db.Customers.AsNoTracking()
            .Where(c => customerIds.Contains(c.Id))
            .Select(c => new { c.Id, c.FullName, c.CompanyName, c.CustomerType, c.DebtBalance })
            .ToDictionaryAsync(c => c.Id, cancellationToken);

        var items = customerStats.Select(s =>
        {
            customers.TryGetValue(s.CustomerId, out var c);
            return new ArTopDebtorDto
            {
                CustomerId = s.CustomerId,
                CustomerName = c?.CompanyName ?? c?.FullName ?? string.Empty,
                CustomerType = c?.CustomerType ?? string.Empty,
                RemainingTotal = s.Remaining,
                OverdueAmount = s.Overdue,
                InvoiceCount = s.InvoiceCount,
                DebtBalance = c?.DebtBalance ?? 0m
            };
        }).ToList();

        return new ArTopDebtorsDto { Items = items };
    }

    public async Task<ArTimeseriesDto> GetTimeseriesAsync(
        DateTime? fromDate,
        DateTime? toDate,
        string granularity,
        CancellationToken cancellationToken = default)
    {
        granularity = DashboardGranularities.Normalize(granularity);
        var (from, toExclusive) = DashboardDateRange.Normalize(fromDate, toDate);

        var invoices = await db.Invoices.AsNoTracking()
            .Where(i => i.Status != InvoiceStatuses.Draft && i.Status != InvoiceStatuses.Cancelled)
            .Where(i => i.IssueDate < toExclusive)
            .Select(i => new
            {
                i.IssueDate,
                i.DueDate,
                Total = i.TotalAmount ?? 0m,
                Payments = i.PaymentTransactions.Select(p => new
                {
                    p.PaymentDate,
                    p.TransactionType,
                    p.Amount
                }).ToList()
            })
            .ToListAsync(cancellationToken);

        var bucketKeys = DashboardDateRange.EnumerateBucketKeys(from, toExclusive, granularity).ToList();
        var bucketEnds = bucketKeys.ToDictionary(k => k, k => BucketEndUtc(k, granularity));

        var points = bucketKeys.Select(k =>
        {
            var endUtc = bucketEnds[k];
            var remaining = 0m;
            var overdue = 0m;
            foreach (var inv in invoices)
            {
                if (inv.IssueDate >= endUtc) continue;
                var paidIn = inv.Payments
                    .Where(p => (p.TransactionType == PaymentTransactionTypes.Payment
                                 || p.TransactionType == PaymentTransactionTypes.AdjustmentIncrease)
                                && p.PaymentDate < endUtc)
                    .Sum(p => p.Amount);
                var paidOut = inv.Payments
                    .Where(p => (p.TransactionType == PaymentTransactionTypes.Refund
                                 || p.TransactionType == PaymentTransactionTypes.AdjustmentDecrease)
                                && p.PaymentDate < endUtc)
                    .Sum(p => p.Amount);
                var rem = inv.Total - paidIn;
                if (rem <= 0) continue;
                remaining += rem;
                if (inv.DueDate.HasValue && inv.DueDate.Value < endUtc) overdue += rem;
            }
            return new ArTimeseriesPointDto
            {
                Bucket = k,
                RemainingTotal = remaining,
                OverdueAmount = overdue
            };
        }).ToList();

        return new ArTimeseriesDto
        {
            Granularity = granularity,
            Points = points
        };
    }

    private async Task<List<OpenInvoiceRow>> LoadOpenInvoicesAsync(CancellationToken cancellationToken)
    {
        return await db.Invoices.AsNoTracking()
            .Where(i => OpenInvoiceStatuses.Contains(i.Status))
            .Select(i => new OpenInvoiceRow
            {
                Total = i.TotalAmount ?? 0m,
                DueDate = i.DueDate,
                PaidIn = i.PaymentTransactions
                    .Where(p => p.TransactionType == PaymentTransactionTypes.Payment
                                || p.TransactionType == PaymentTransactionTypes.AdjustmentIncrease)
                    .Sum(p => (decimal?)p.Amount) ?? 0m,
                PaidOut = i.PaymentTransactions
                    .Where(p => p.TransactionType == PaymentTransactionTypes.Refund
                                || p.TransactionType == PaymentTransactionTypes.AdjustmentDecrease)
                    .Sum(p => (decimal?)p.Amount) ?? 0m
            })
            .ToListAsync(cancellationToken);
    }

    private static DateTime BucketEndUtc(string key, string granularity)
    {
        switch (granularity)
        {
            case "month":
                var ym = key.Split('-');
                var year = int.Parse(ym[0]);
                var month = int.Parse(ym[1]);
                var firstNext = new DateTime(year, month, 1, 0, 0, 0, DateTimeKind.Utc).AddMonths(1);
                return firstNext;
            case "week":
                var parts = key.Split("-W");
                var wYear = int.Parse(parts[0]);
                var w = int.Parse(parts[1]);
                var monday = System.Globalization.ISOWeek.ToDateTime(wYear, w, DayOfWeek.Monday);
                return DateTime.SpecifyKind(monday.AddDays(7), DateTimeKind.Utc);
            default:
                var d = DateTime.SpecifyKind(DateTime.Parse(key), DateTimeKind.Utc);
                return d.AddDays(1);
        }
    }

    private sealed class OpenInvoiceRow
    {
        public decimal Total { get; set; }
        public DateTime? DueDate { get; set; }
        public decimal PaidIn { get; set; }
        public decimal PaidOut { get; set; }
    }
}
