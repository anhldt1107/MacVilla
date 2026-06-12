using BE_API.Database;
using BE_API.Domain;
using BE_API.Entities;
using Microsoft.EntityFrameworkCore;

namespace BE_API.Service;

public class AfterSalesQuantityService(BeContext db)
{
    public async Task<int> GetCommittedReturnQuantityAsync(
        int orderItemId,
        int? excludeTicketId = null,
        CancellationToken cancellationToken = default)
    {
        var query = db.ReturnItems
            .AsNoTracking()
            .Where(ri => ri.OrderItemId == orderItemId)
            .Where(ri =>
                ri.Ticket.Status == ReturnTicketStatuses.Requested ||
                ri.Ticket.Status == ReturnTicketStatuses.PendingApproval ||
                ri.Ticket.Status == ReturnTicketStatuses.Approved ||
                ri.Ticket.Status == ReturnTicketStatuses.Processing ||
                ri.Ticket.Status == ReturnTicketStatuses.ItemsReceived);

        if (excludeTicketId.HasValue)
            query = query.Where(ri => ri.TicketId != excludeTicketId.Value);

        return await query.SumAsync(ri => ri.Quantity, cancellationToken);
    }

    public async Task<int> GetActiveClaimCountAsync(
        int orderItemId,
        CancellationToken cancellationToken = default)
    {
        return await db.WarrantyClaims
            .AsNoTracking()
            .Where(c => c.OrderItemId == orderItemId)
            .Where(c =>
                c.Status != WarrantyClaimStatuses.Completed &&
                c.Status != WarrantyClaimStatuses.Rejected &&
                c.Status != WarrantyClaimStatuses.Cancelled)
            .CountAsync(cancellationToken);
    }

    public async Task<int> GetReturnableQuantityAsync(
        int orderItemId,
        int orderItemQuantity,
        int? excludeTicketId = null,
        CancellationToken cancellationToken = default)
    {
        var committed = await GetCommittedReturnQuantityAsync(orderItemId, excludeTicketId, cancellationToken);
        var claims = await GetActiveClaimCountAsync(orderItemId, cancellationToken);
        return AfterSalesQuantityRules.ComputeReturnableQuantity(orderItemQuantity, committed, claims);
    }

    public async Task ValidateReturnItemAsync(
        OrderItem orderItem,
        int requestedQty,
        CancellationToken cancellationToken = default)
    {
        var committed = await GetCommittedReturnQuantityAsync(orderItem.Id, null, cancellationToken);
        var claims = await GetActiveClaimCountAsync(orderItem.Id, cancellationToken);
        AfterSalesQuantityRules.ValidateReturnQuantity(orderItem.Quantity, requestedQty, committed, claims);
    }

    public async Task ApplyWarrantyReductionOnReturnCompleteAsync(
        int orderItemId,
        int quantityReturned,
        CancellationToken cancellationToken = default)
    {
        if (quantityReturned <= 0)
            return;

        var lines = await db.WarrantyTicketLines
            .Where(l => l.OrderItemId == orderItemId)
            .ToListAsync(cancellationToken);

        foreach (var line in lines)
        {
            line.Quantity = Math.Max(0, line.Quantity - quantityReturned);
        }
    }

    public async Task<Dictionary<int, (int Returnable, int Claimable)>> GetLineEligibilityForOrderAsync(
        int orderId,
        CancellationToken cancellationToken = default)
    {
        var items = await db.OrderItems
            .AsNoTracking()
            .Where(i => i.OrderId == orderId)
            .Select(i => new { i.Id, i.Quantity })
            .ToListAsync(cancellationToken);

        var result = new Dictionary<int, (int Returnable, int Claimable)>();
        foreach (var item in items)
        {
            var returnable = await GetReturnableQuantityAsync(item.Id, item.Quantity, null, cancellationToken);
            var line = await db.WarrantyTicketLines.AsNoTracking()
                .FirstOrDefaultAsync(l => l.OrderItemId == item.Id, cancellationToken);
            var claimable = 0;
            if (line != null && WarrantyCoverageRules.IsLineEligible(line, DateTime.UtcNow) && line.Quantity > 0)
            {
                var committed = await GetCommittedReturnQuantityAsync(item.Id, null, cancellationToken);
                var claims = await GetActiveClaimCountAsync(item.Id, cancellationToken);
                claimable = Math.Max(0, Math.Min(line.Quantity, item.Quantity) - committed - claims);
            }

            result[item.Id] = (returnable, claimable);
        }

        return result;
    }
}
