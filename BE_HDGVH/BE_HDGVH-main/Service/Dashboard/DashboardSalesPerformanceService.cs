using BE_API.Database;
using BE_API.Domain;
using BE_API.Dto.Admin.Dashboard;
using BE_API.Service.IService;
using Microsoft.EntityFrameworkCore;

namespace BE_API.Service.Dashboard;

public class DashboardSalesPerformanceService(BeContext db) : IDashboardSalesPerformanceService
{
    public async Task<TopSalesDto> GetTopSalesAsync(
        DateTime? fromDate,
        DateTime? toDate,
        int limit,
        CancellationToken cancellationToken = default)
    {
        limit = Math.Clamp(limit, 1, 100);
        var (from, toExclusive) = DashboardDateRange.Normalize(fromDate, toDate);

        var items = await db.CustomerOrders.AsNoTracking()
            .Where(o => o.SalesId != null
                        && o.OrderStatus != OrderStatuses.Cancelled
                        && o.CreatedAt >= from && o.CreatedAt < toExclusive)
            .GroupBy(o => new { SalesId = o.SalesId!.Value, o.Sales!.FullName, o.Sales!.Email, o.Sales!.Phone })
            .Select(g => new TopSalesItemDto
            {
                SalesId = g.Key.SalesId,
                FullName = g.Key.FullName,
                Email = g.Key.Email,
                Phone = g.Key.Phone,
                OrderCount = g.Count(),
                TotalRevenue = g.Sum(x => x.PayableTotal)
            })
            .OrderByDescending(x => x.TotalRevenue)
            .ThenByDescending(x => x.OrderCount)
            .Take(limit)
            .ToListAsync(cancellationToken);

        return new TopSalesDto { Items = items };
    }

    public async Task<PerSalesDetailDto> GetPerSalesDetailAsync(
        int salesId,
        DateTime? fromDate,
        DateTime? toDate,
        CancellationToken cancellationToken = default)
    {
        var (from, toExclusive) = DashboardDateRange.Normalize(fromDate, toDate);

        var fullName = await db.AppUsers.AsNoTracking()
            .Where(u => u.Id == salesId)
            .Select(u => u.FullName)
            .FirstOrDefaultAsync(cancellationToken) ?? string.Empty;

        var quoteCount = await db.Quotes.AsNoTracking()
            .CountAsync(q => q.SalesId == salesId
                              && q.CreatedAt >= from && q.CreatedAt < toExclusive, cancellationToken);

        var approvedCount = await db.Quotes.AsNoTracking()
            .CountAsync(q => q.SalesId == salesId
                              && q.ApprovedAt != null
                              && q.ApprovedAt >= from && q.ApprovedAt < toExclusive, cancellationToken);

        var acceptedCount = await db.Quotes.AsNoTracking()
            .CountAsync(q => q.SalesId == salesId
                              && q.CustomerAcceptedAt != null
                              && q.CustomerAcceptedAt >= from && q.CustomerAcceptedAt < toExclusive, cancellationToken);

        var convertedCount = await db.Quotes.AsNoTracking()
            .CountAsync(q => q.SalesId == salesId
                              && q.Status == QuoteStatuses.Converted
                              && q.CreatedAt >= from && q.CreatedAt < toExclusive, cancellationToken);

        var orderRows = await db.CustomerOrders.AsNoTracking()
            .Where(o => o.SalesId == salesId
                        && o.OrderStatus != OrderStatuses.Cancelled
                        && o.CreatedAt >= from && o.CreatedAt < toExclusive)
            .Select(o => new { o.PayableTotal })
            .ToListAsync(cancellationToken);

        var orderCount = orderRows.Count;
        var revenue = orderRows.Sum(x => x.PayableTotal);
        var conversion = approvedCount > 0
            ? Math.Round((decimal)convertedCount / approvedCount, 4)
            : 0m;

        return new PerSalesDetailDto
        {
            SalesId = salesId,
            FullName = fullName,
            QuoteCount = quoteCount,
            ApprovedCount = approvedCount,
            AcceptedCount = acceptedCount,
            ConvertedCount = convertedCount,
            ConversionRate = conversion,
            OrderCount = orderCount,
            RevenueContribution = revenue
        };
    }

    public async Task<QuoteConversionBySalesDto> GetQuoteConversionBySalesAsync(
        DateTime? fromDate,
        DateTime? toDate,
        CancellationToken cancellationToken = default)
    {
        var (from, toExclusive) = DashboardDateRange.Normalize(fromDate, toDate);

        var rows = await db.Quotes.AsNoTracking()
            .Where(q => q.SalesId != null
                        && q.CreatedAt >= from && q.CreatedAt < toExclusive)
            .GroupBy(q => new { SalesId = q.SalesId!.Value, q.Sales!.FullName })
            .Select(g => new
            {
                g.Key.SalesId,
                g.Key.FullName,
                ApprovedCount = g.Count(x => x.ApprovedAt != null),
                ConvertedCount = g.Count(x => x.Status == QuoteStatuses.Converted)
            })
            .ToListAsync(cancellationToken);

        var items = rows
            .Select(r => new QuoteConversionBySalesItemDto
            {
                SalesId = r.SalesId,
                FullName = r.FullName,
                ApprovedCount = r.ApprovedCount,
                ConvertedCount = r.ConvertedCount,
                ConversionRate = r.ApprovedCount > 0
                    ? Math.Round((decimal)r.ConvertedCount / r.ApprovedCount, 4)
                    : 0m
            })
            .OrderByDescending(x => x.ConversionRate)
            .ThenByDescending(x => x.ConvertedCount)
            .ToList();

        return new QuoteConversionBySalesDto { Items = items };
    }
}
