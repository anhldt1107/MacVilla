using BE_API.Database;
using BE_API.Domain;
using BE_API.Dto.Admin;
using BE_API.Service.IService;
using Microsoft.EntityFrameworkCore;

namespace BE_API.Service;

public class AdminReportService(BeContext db) : IAdminReportService
{
    public async Task<AdminSalesOverviewDto> GetSalesOverviewAsync(
        DateTime? fromDate,
        DateTime? toDate,
        CancellationToken cancellationToken = default)
    {
        var (from, toExclusive) = NormalizeRange(fromDate, toDate);
        var now = DateTime.UtcNow;

        var paymentsQuery = db.PaymentTransactions.AsNoTracking().AsQueryable();
        if (from.HasValue) paymentsQuery = paymentsQuery.Where(p => p.PaymentDate >= from.Value);
        if (toExclusive.HasValue) paymentsQuery = paymentsQuery.Where(p => p.PaymentDate < toExclusive.Value);

        var paymentRows = await paymentsQuery
            .Select(p => new { p.TransactionType, p.Amount })
            .ToListAsync(cancellationToken);

        var totalIn = paymentRows
            .Where(p => PaymentTransactionTypes.IsIncome(p.TransactionType ?? string.Empty))
            .Sum(p => p.Amount);
        var totalOut = paymentRows
            .Where(p => PaymentTransactionTypes.IsOutcome(p.TransactionType ?? string.Empty))
            .Sum(p => p.Amount);

        var ordersQuery = db.CustomerOrders.AsNoTracking().AsQueryable();
        if (from.HasValue) ordersQuery = ordersQuery.Where(o => o.CreatedAt >= from.Value);
        if (toExclusive.HasValue) ordersQuery = ordersQuery.Where(o => o.CreatedAt < toExclusive.Value);

        var orderRows = await ordersQuery
            .Select(o => new { o.OrderStatus, o.PayableTotal })
            .ToListAsync(cancellationToken);
        var totalOrderValue = orderRows
            .Where(o => !string.Equals(o.OrderStatus, OrderStatuses.Cancelled, StringComparison.OrdinalIgnoreCase))
            .Sum(o => o.PayableTotal);
        var orderCount = orderRows.Count(o => !string.Equals(o.OrderStatus, OrderStatuses.Cancelled, StringComparison.OrdinalIgnoreCase));
        var cancelledOrderCount = orderRows.Count(o => string.Equals(o.OrderStatus, OrderStatuses.Cancelled, StringComparison.OrdinalIgnoreCase));

        var newCustomerQuery = db.Customers.AsNoTracking().AsQueryable();
        if (from.HasValue) newCustomerQuery = newCustomerQuery.Where(c => c.CreatedAt >= from.Value);
        if (toExclusive.HasValue) newCustomerQuery = newCustomerQuery.Where(c => c.CreatedAt < toExclusive.Value);
        var newCustomerCount = await newCustomerQuery.CountAsync(cancellationToken);

        var quotePendingCount = await db.Quotes.AsNoTracking()
            .CountAsync(q => q.Status == QuoteStatuses.PendingApproval, cancellationToken);

        var transferPendingCount = await db.TransferNotifications.AsNoTracking()
            .CountAsync(t => t.Status == TransferNotificationStatuses.Pending, cancellationToken);

        var unpaidInvoices = await db.Invoices.AsNoTracking()
            .Where(i => i.Status != InvoiceStatuses.Paid
                        && i.Status != InvoiceStatuses.Cancelled
                        && i.Status != InvoiceStatuses.Draft)
            .Select(i => new
            {
                Total = i.TotalAmount ?? 0m,
                PaidIn = i.PaymentTransactions
                    .Where(p => p.TransactionType == PaymentTransactionTypes.Payment
                                || p.TransactionType == PaymentTransactionTypes.AdjustmentIncrease)
                    .Sum(p => (decimal?)p.Amount) ?? 0m,
                PaidOut = i.PaymentTransactions
                    .Where(p => p.TransactionType == PaymentTransactionTypes.Refund
                                || p.TransactionType == PaymentTransactionTypes.AdjustmentDecrease)
                    .Sum(p => (decimal?)p.Amount) ?? 0m,
                DueDate = i.DueDate
            })
            .ToListAsync(cancellationToken);

        var totalUnpaid = 0m;
        var overdueCount = 0;
        foreach (var row in unpaidInvoices)
        {
            var remaining = row.Total - row.PaidIn;
            if (remaining <= 0) continue;
            totalUnpaid += remaining;
            if (row.DueDate.HasValue && row.DueDate.Value < now) overdueCount++;
        }

        return new AdminSalesOverviewDto
        {
            FromDate = from,
            ToDate = toExclusive.HasValue ? toExclusive.Value.AddTicks(-1) : null,
            NetRevenue = totalIn - totalOut,
            TotalPaymentIn = totalIn,
            TotalPaymentOut = totalOut,
            TotalOrderValue = totalOrderValue,
            OrderCount = orderCount,
            CancelledOrderCount = cancelledOrderCount,
            NewCustomerCount = newCustomerCount,
            QuotePendingApprovalCount = quotePendingCount,
            TransferNotificationPendingCount = transferPendingCount,
            InvoicesOverdueCount = overdueCount,
            TotalUnpaidInvoiceAmount = totalUnpaid
        };
    }

    public async Task<IReadOnlyList<AdminLowStockItemDto>> GetLowStockAsync(
        int threshold,
        int take,
        CancellationToken cancellationToken = default)
    {
        threshold = Math.Max(0, threshold);
        take = Math.Clamp(take, 1, 500);

        return await db.Inventories.AsNoTracking()
            .Include(inv => inv.Variant)
            .ThenInclude(v => v.Product)
            .Where(inv => inv.QuantityAvailable <= (inv.ReorderPoint ?? threshold))
            .OrderBy(inv => inv.QuantityAvailable)
            .ThenBy(inv => inv.Variant.Sku)
            .Take(take)
            .Select(inv => new AdminLowStockItemDto
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
    }

    public async Task<IReadOnlyList<AdminTopSalesItemDto>> GetTopSalesAsync(
        DateTime? fromDate,
        DateTime? toDate,
        int limit,
        CancellationToken cancellationToken = default)
    {
        var (from, toExclusive) = NormalizeRange(fromDate, toDate);
        limit = Math.Clamp(limit, 1, 100);

        var query = db.CustomerOrders.AsNoTracking()
            .Where(o => o.SalesId != null && o.OrderStatus != OrderStatuses.Cancelled);

        if (from.HasValue) query = query.Where(o => o.CreatedAt >= from.Value);
        if (toExclusive.HasValue) query = query.Where(o => o.CreatedAt < toExclusive.Value);

        return await query
            .GroupBy(o => new { o.SalesId, o.Sales!.FullName, o.Sales.Email, o.Sales.Phone })
            .Select(g => new AdminTopSalesItemDto
            {
                SalesId = g.Key.SalesId!.Value,
                FullName = g.Key.FullName,
                Email = g.Key.Email,
                Phone = g.Key.Phone,
                OrderCount = g.Count(),
                TotalRevenue = g.Sum(o => o.PayableTotal)
            })
            .OrderByDescending(x => x.TotalRevenue)
            .ThenByDescending(x => x.OrderCount)
            .Take(limit)
            .ToListAsync(cancellationToken);
    }

    private static (DateTime? From, DateTime? ToExclusive) NormalizeRange(DateTime? from, DateTime? to)
    {
        DateTime? normalizedFrom = from;
        DateTime? toExclusive = to.HasValue ? to.Value.Date.AddDays(1) : null;
        return (normalizedFrom, toExclusive);
    }
}
