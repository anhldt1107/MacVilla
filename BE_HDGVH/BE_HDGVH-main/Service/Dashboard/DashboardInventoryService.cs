using BE_API.Database;
using BE_API.Domain;
using BE_API.Dto.Admin.Dashboard;
using BE_API.Service.IService;
using Microsoft.EntityFrameworkCore;

namespace BE_API.Service.Dashboard;

public class DashboardInventoryService(BeContext db) : IDashboardInventoryService
{
    public async Task<InventoryOverviewDto> GetOverviewAsync(int defaultThreshold, CancellationToken cancellationToken = default)
    {
        if (defaultThreshold < 0) defaultThreshold = 0;

        var skuActiveCount = await db.Inventories.AsNoTracking()
            .Where(i => i.Variant.Product.Status == ProductStatus.Active)
            .Select(i => i.VariantId)
            .Distinct()
            .CountAsync(cancellationToken);

        var lowStockCount = await db.Inventories.AsNoTracking()
            .Where(i => i.QuantityAvailable <= (i.ReorderPoint ?? defaultThreshold))
            .CountAsync(cancellationToken);

        var totals = await db.Inventories.AsNoTracking()
            .GroupBy(_ => 1)
            .Select(g => new
            {
                TotalOnHand = g.Sum(x => x.QuantityOnHand),
                TotalReserved = g.Sum(x => x.QuantityReserved),
                TotalOnHandValue = g.Sum(x => (decimal)x.QuantityOnHand * x.Variant.CostPrice)
            })
            .FirstOrDefaultAsync(cancellationToken);

        return new InventoryOverviewDto
        {
            SkuActiveCount = skuActiveCount,
            LowStockCount = lowStockCount,
            TotalOnHand = totals?.TotalOnHand ?? 0,
            TotalReserved = totals?.TotalReserved ?? 0,
            TotalOnHandValue = totals?.TotalOnHandValue ?? 0m,
            DefaultThreshold = defaultThreshold
        };
    }

    public async Task<InventoryLowStockDto> GetLowStockAsync(
        int threshold,
        int take,
        int windowDays,
        CancellationToken cancellationToken = default)
    {
        threshold = Math.Clamp(threshold, 0, 1000);
        take = Math.Clamp(take, 1, 500);
        windowDays = Math.Clamp(windowDays, 1, 180);

        var rows = await db.Inventories.AsNoTracking()
            .Include(inv => inv.Variant).ThenInclude(v => v.Product)
            .Where(inv => inv.QuantityAvailable <= (inv.ReorderPoint ?? threshold))
            .OrderBy(inv => inv.QuantityAvailable)
            .ThenBy(inv => inv.Variant.Sku)
            .Take(take)
            .Select(inv => new InventoryLowStockItemDto
            {
                VariantId = inv.VariantId,
                Sku = inv.Variant.Sku,
                VariantName = inv.Variant.VariantName,
                ProductId = inv.Variant.ProductId,
                ProductName = inv.Variant.Product.Name,
                WarehouseLocation = inv.WarehouseLocation,
                QuantityOnHand = inv.QuantityOnHand,
                QuantityReserved = inv.QuantityReserved,
                QuantityAvailable = inv.QuantityAvailable,
                ReorderPoint = inv.ReorderPoint,
                SafetyStock = inv.SafetyStock,
                EffectiveLowStockThreshold = inv.ReorderPoint ?? threshold
            })
            .ToListAsync(cancellationToken);

        var variantIds = rows.Select(r => r.VariantId).ToList();
        var avgOut = await ComputeAvgDailyOutAsync(variantIds, windowDays, cancellationToken);

        foreach (var row in rows)
        {
            avgOut.TryGetValue(row.VariantId, out var avg);
            row.DaysOfCover = avg > 0
                ? Math.Round((decimal)row.QuantityAvailable / avg, 1)
                : null;
        }

        return new InventoryLowStockDto { Items = rows };
    }

    public async Task<InventoryDaysOfCoverDto> GetDaysOfCoverAsync(
        int windowDays,
        int take,
        CancellationToken cancellationToken = default)
    {
        windowDays = Math.Clamp(windowDays, 1, 180);
        take = Math.Clamp(take, 1, 200);

        var inventories = await db.Inventories.AsNoTracking()
            .Include(i => i.Variant)
            .Select(i => new
            {
                i.VariantId,
                i.Variant.Sku,
                i.Variant.VariantName,
                i.QuantityAvailable
            })
            .ToListAsync(cancellationToken);

        var ids = inventories.Select(i => i.VariantId).ToList();
        var avgOut = await ComputeAvgDailyOutAsync(ids, windowDays, cancellationToken);

        var items = inventories
            .Select(i =>
            {
                avgOut.TryGetValue(i.VariantId, out var avg);
                decimal? doc = avg > 0
                    ? Math.Round((decimal)i.QuantityAvailable / avg, 1)
                    : null;
                return new InventoryDaysOfCoverItemDto
                {
                    VariantId = i.VariantId,
                    Sku = i.Sku,
                    VariantName = i.VariantName,
                    QuantityAvailable = i.QuantityAvailable,
                    AvgDailyOut = Math.Round(avg, 2),
                    DaysOfCover = doc
                };
            })
            .OrderBy(x => x.DaysOfCover ?? decimal.MaxValue)
            .ThenBy(x => x.Sku)
            .Take(take)
            .ToList();

        return new InventoryDaysOfCoverDto
        {
            WindowDays = windowDays,
            Items = items
        };
    }

    public async Task<InventoryReserveRatioDto> GetReserveRatioAsync(
        int take,
        CancellationToken cancellationToken = default)
    {
        take = Math.Clamp(take, 1, 200);

        var rows = await db.Inventories.AsNoTracking()
            .Include(i => i.Variant)
            .Where(i => i.QuantityReserved > 0)
            .Select(i => new InventoryReserveRatioItemDto
            {
                VariantId = i.VariantId,
                Sku = i.Variant.Sku,
                VariantName = i.Variant.VariantName,
                QuantityOnHand = i.QuantityOnHand,
                QuantityReserved = i.QuantityReserved
            })
            .ToListAsync(cancellationToken);

        foreach (var r in rows)
        {
            r.Ratio = r.QuantityOnHand > 0
                ? Math.Round((decimal)r.QuantityReserved / r.QuantityOnHand, 4)
                : 1m;
        }

        var items = rows
            .OrderByDescending(r => r.Ratio)
            .ThenByDescending(r => r.QuantityReserved)
            .Take(take)
            .ToList();

        return new InventoryReserveRatioDto { Items = items };
    }

    public async Task<InventoryTransactionsTrendDto> GetTransactionsTrendAsync(
        DateTime? fromDate,
        DateTime? toDate,
        string granularity,
        CancellationToken cancellationToken = default)
    {
        granularity = DashboardGranularities.Normalize(granularity);
        var (from, toExclusive) = DashboardDateRange.Normalize(fromDate, toDate);

        var rows = await db.InventoryTransactions.AsNoTracking()
            .Where(t => t.Timestamp >= from && t.Timestamp < toExclusive)
            .Select(t => new { t.Timestamp, t.TransactionType, t.Quantity })
            .ToListAsync(cancellationToken);

        var grouped = rows
            .GroupBy(r => DashboardDateRange.ToBucketKey(r.Timestamp, granularity))
            .ToDictionary(g => g.Key, g => new
            {
                In = g.Where(x => string.Equals(x.TransactionType, TransactionTypes.In, StringComparison.OrdinalIgnoreCase)).Sum(x => x.Quantity),
                Out = g.Where(x => string.Equals(x.TransactionType, TransactionTypes.Out, StringComparison.OrdinalIgnoreCase)).Sum(x => x.Quantity),
                Reserve = g.Where(x => string.Equals(x.TransactionType, TransactionTypes.Reserve, StringComparison.OrdinalIgnoreCase)).Sum(x => x.Quantity),
                Release = g.Where(x => string.Equals(x.TransactionType, TransactionTypes.Release, StringComparison.OrdinalIgnoreCase)).Sum(x => x.Quantity),
                Adjust = g.Where(x => string.Equals(x.TransactionType, TransactionTypes.Adjust, StringComparison.OrdinalIgnoreCase)).Sum(x => x.Quantity)
            });

        var points = DashboardDateRange.EnumerateBucketKeys(from, toExclusive, granularity)
            .Select(k =>
            {
                grouped.TryGetValue(k, out var stat);
                return new InventoryTransactionsTrendPointDto
                {
                    Bucket = k,
                    In = stat?.In ?? 0,
                    Out = stat?.Out ?? 0,
                    Reserve = stat?.Reserve ?? 0,
                    Release = stat?.Release ?? 0,
                    Adjust = stat?.Adjust ?? 0
                };
            })
            .ToList();

        return new InventoryTransactionsTrendDto
        {
            Granularity = granularity,
            Points = points
        };
    }

    public async Task<InventoryTopMovingDto> GetTopMovingAsync(
        DateTime? fromDate,
        DateTime? toDate,
        int limit,
        CancellationToken cancellationToken = default)
    {
        limit = Math.Clamp(limit, 1, 100);
        var (from, toExclusive) = DashboardDateRange.Normalize(fromDate, toDate);

        var items = await db.InventoryTransactions.AsNoTracking()
            .Where(t => t.Timestamp >= from && t.Timestamp < toExclusive
                        && t.TransactionType == TransactionTypes.Out)
            .GroupBy(t => t.VariantId)
            .Select(g => new
            {
                VariantId = g.Key,
                TotalOut = g.Sum(x => x.Quantity)
            })
            .OrderByDescending(x => x.TotalOut)
            .Take(limit)
            .ToListAsync(cancellationToken);

        var ids = items.Select(x => x.VariantId).ToList();
        var variants = await db.ProductVariants.AsNoTracking()
            .Include(v => v.Product)
            .Where(v => ids.Contains(v.Id))
            .Select(v => new { v.Id, v.Sku, ProductName = v.Product.Name })
            .ToDictionaryAsync(v => v.Id, cancellationToken);

        var result = items.Select(x =>
        {
            variants.TryGetValue(x.VariantId, out var v);
            return new InventoryTopMovingItemDto
            {
                VariantId = x.VariantId,
                Sku = v?.Sku ?? string.Empty,
                ProductName = v?.ProductName ?? string.Empty,
                TotalOut = x.TotalOut
            };
        }).ToList();

        return new InventoryTopMovingDto { Items = result };
    }

    private async Task<Dictionary<int, decimal>> ComputeAvgDailyOutAsync(
        List<int> variantIds,
        int windowDays,
        CancellationToken cancellationToken)
    {
        if (variantIds.Count == 0) return new Dictionary<int, decimal>();

        var to = DateTime.UtcNow;
        var from = to.AddDays(-windowDays);

        var sums = await db.InventoryTransactions.AsNoTracking()
            .Where(t => variantIds.Contains(t.VariantId)
                        && t.TransactionType == TransactionTypes.Out
                        && t.Timestamp >= from && t.Timestamp < to)
            .GroupBy(t => t.VariantId)
            .Select(g => new { VariantId = g.Key, TotalQty = g.Sum(x => x.Quantity) })
            .ToListAsync(cancellationToken);

        return sums.ToDictionary(s => s.VariantId, s => (decimal)s.TotalQty / windowDays);
    }
}
