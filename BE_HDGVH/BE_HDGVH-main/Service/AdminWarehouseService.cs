using BE_API.Database;
using BE_API.Domain;
using BE_API.Dto.Admin;
using BE_API.Dto.Common;
using BE_API.Service.IService;
using Microsoft.EntityFrameworkCore;

namespace BE_API.Service;

public class AdminWarehouseService(BeContext db, IAdminReportService reportService) : IAdminWarehouseService
{
    public async Task<AdminWarehouseOverviewDto> GetOverviewAsync(
        int lowStockThreshold,
        CancellationToken cancellationToken = default)
    {
        lowStockThreshold = Math.Max(0, lowStockThreshold);
        var todayStart = DateTime.UtcNow.Date;
        var todayEnd = todayStart.AddDays(1);

        var fulfillmentByStatus = await db.FulfillmentTickets.AsNoTracking()
            .GroupBy(f => f.Status)
            .Select(g => new { Status = g.Key, Count = g.Count() })
            .ToListAsync(cancellationToken);

        int FulfillmentCountOf(string status) =>
            fulfillmentByStatus.FirstOrDefault(x => x.Status == status)?.Count ?? 0;

        var fulfillmentShippedToday = await db.FulfillmentTickets.AsNoTracking()
            .Where(f => f.Status == FulfillmentStatuses.Shipped
                        && (f.UpdatedAt ?? f.CreatedAt) >= todayStart
                        && (f.UpdatedAt ?? f.CreatedAt) < todayEnd)
            .CountAsync(cancellationToken);

        var lowStockCount = await db.Inventories.AsNoTracking()
            .CountAsync(inv => inv.QuantityAvailable <= (inv.ReorderPoint ?? lowStockThreshold), cancellationToken);

        var outOfStockCount = await db.Inventories.AsNoTracking()
            .CountAsync(inv => inv.QuantityAvailable <= 0, cancellationToken);

        var transactionsTodayByType = await db.InventoryTransactions.AsNoTracking()
            .Where(t => t.Timestamp >= todayStart && t.Timestamp < todayEnd)
            .GroupBy(t => t.TransactionType)
            .Select(g => new { Type = g.Key, Count = g.Count() })
            .ToListAsync(cancellationToken);

        int TransactionCountOf(string type) =>
            transactionsTodayByType.FirstOrDefault(x => x.Type == type)?.Count ?? 0;

        var transactionsTodayTotal = transactionsTodayByType.Sum(x => x.Count);

        var returnsAwaitingComplete = await db.ReturnExchangeTickets.AsNoTracking()
            .CountAsync(t => t.Status == ReturnTicketStatuses.Approved
                             || t.Status == ReturnTicketStatuses.Processing
                             || t.Status == ReturnTicketStatuses.ItemsReceived,
                cancellationToken);

        var warrantyClaimsActive = await db.WarrantyClaims.AsNoTracking()
            .CountAsync(c => c.Status != WarrantyClaimStatuses.Completed
                             && c.Status != WarrantyClaimStatuses.Rejected
                             && c.Status != WarrantyClaimStatuses.Cancelled,
                cancellationToken);

        return new AdminWarehouseOverviewDto
        {
            FulfillmentPendingCount = FulfillmentCountOf(FulfillmentStatuses.Pending),
            FulfillmentPickingCount = FulfillmentCountOf(FulfillmentStatuses.Picking),
            FulfillmentPackedCount = FulfillmentCountOf(FulfillmentStatuses.Packed),
            FulfillmentShippedTodayCount = fulfillmentShippedToday,
            FulfillmentTotalActiveCount =
                FulfillmentCountOf(FulfillmentStatuses.Pending)
                + FulfillmentCountOf(FulfillmentStatuses.Picking)
                + FulfillmentCountOf(FulfillmentStatuses.Packed),
            LowStockCount = lowStockCount,
            OutOfStockCount = outOfStockCount,
            LowStockThreshold = lowStockThreshold,
            InventoryTransactionsTodayCount = transactionsTodayTotal,
            InventoryInTodayCount = TransactionCountOf(TransactionTypes.In),
            InventoryOutTodayCount = TransactionCountOf(TransactionTypes.Out),
            InventoryAdjustTodayCount = TransactionCountOf(TransactionTypes.Adjust),
            ReturnsAwaitingCompleteCount = returnsAwaitingComplete,
            WarrantyClaimsActiveCount = warrantyClaimsActive
        };
    }

    public Task<IReadOnlyList<AdminLowStockItemDto>> GetLowStockAsync(
        int threshold,
        int take,
        CancellationToken cancellationToken = default)
        => reportService.GetLowStockAsync(threshold, take, cancellationToken);

    public async Task<PagedResultDto<AdminInventoryListItemDto>> GetInventoryPagedAsync(
        int page,
        int pageSize,
        string? search,
        string? warehouseLocation,
        bool onlyOutOfStock,
        bool onlyBelowThreshold,
        int threshold,
        CancellationToken cancellationToken = default)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 200);
        threshold = Math.Max(0, threshold);

        var query = db.Inventories.AsNoTracking()
            .Include(inv => inv.Variant)
                .ThenInclude(v => v.Product)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(warehouseLocation))
        {
            var loc = warehouseLocation.Trim();
            query = query.Where(inv => inv.WarehouseLocation == loc);
        }

        if (onlyOutOfStock)
        {
            query = query.Where(inv => inv.QuantityAvailable <= 0);
        }
        else if (onlyBelowThreshold)
        {
            query = query.Where(inv => inv.QuantityAvailable <= (inv.ReorderPoint ?? threshold));
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.Trim().ToLower();
            query = query.Where(inv =>
                inv.Variant.Sku.ToLower().Contains(s) ||
                inv.Variant.VariantName.ToLower().Contains(s) ||
                inv.Variant.Product.Name.ToLower().Contains(s));
        }

        var total = await query.CountAsync(cancellationToken);

        var items = await query
            .OrderBy(inv => inv.QuantityAvailable)
            .ThenBy(inv => inv.Variant.Sku)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(inv => new AdminInventoryListItemDto
            {
                InventoryId = inv.Id,
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
                EffectiveLowStockThreshold = inv.ReorderPoint ?? threshold,
                IsLowStock = inv.QuantityAvailable <= (inv.ReorderPoint ?? threshold)
            })
            .ToListAsync(cancellationToken);

        return new PagedResultDto<AdminInventoryListItemDto>
        {
            Items = items,
            TotalCount = total,
            Page = page,
            PageSize = pageSize
        };
    }
}
