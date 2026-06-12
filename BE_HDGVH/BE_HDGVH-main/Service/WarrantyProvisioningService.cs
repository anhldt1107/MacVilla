using BE_API.Database;
using BE_API.Domain;
using BE_API.Entities;
using Microsoft.EntityFrameworkCore;

namespace BE_API.Service;

/// <summary>
/// Tự tạo phiếu bảo hành khi đơn chuyển Delivered (idempotent theo OrderId).
/// Mỗi OrderItem → một WarrantyTicketLine với ValidUntil riêng.
/// </summary>
public class WarrantyProvisioningService(BeContext db)
{
    public async Task EnsureWarrantyTicketForOrderAsync(
        int orderId,
        CancellationToken cancellationToken = default)
    {
        var existing = await db.WarrantyTickets
            .Include(t => t.Lines)
            .FirstOrDefaultAsync(t => t.OrderId == orderId, cancellationToken);

        if (existing != null && existing.Lines.Count > 0)
            return;

        var order = await db.CustomerOrders
            .Include(o => o.Items)
                .ThenInclude(i => i.Variant)
                    .ThenInclude(v => v.Product)
            .FirstOrDefaultAsync(o => o.Id == orderId, cancellationToken);

        if (order == null || order.Items.Count == 0)
            return;

        var now = DateTime.UtcNow;
        WarrantyTicket ticket;

        if (existing != null)
        {
            ticket = existing;
        }
        else
        {
            var ticketNumber = await WarrantyTicketCodes.GenerateUniqueAsync(db.WarrantyTickets, cancellationToken);
            ticket = new WarrantyTicket
            {
                TicketNumber = ticketNumber,
                CustomerId = order.CustomerId,
                OrderId = order.Id,
                ContractId = order.ContractId,
                IssueDate = now,
                Status = WarrantyTicketStatuses.Active
            };
            await db.WarrantyTickets.AddAsync(ticket, cancellationToken);
            await db.SaveChangesAsync(cancellationToken);
        }

        var lines = new List<WarrantyTicketLine>();
        foreach (var item in order.Items)
        {
            if (existing?.Lines.Any(l => l.OrderItemId == item.Id) == true)
                continue;

            lines.Add(WarrantyCoverageRules.BuildLineFromOrderItem(ticket.Id, item, now));
        }

        if (lines.Count == 0)
            return;

        await db.WarrantyTicketLines.AddRangeAsync(lines, cancellationToken);
        ticket.ValidUntil = WarrantyCoverageRules.MaxValidUntil(
            existing?.Lines.Concat(lines) ?? lines);
        await db.SaveChangesAsync(cancellationToken);
    }

    [Obsolete("Use WarrantyCoverageRules.ResolveMonthsForProduct")]
    public static int ResolveWarrantyMonths(IEnumerable<OrderItem> items)
    {
        var max = 0;
        foreach (var line in items)
        {
            var m = line.Variant?.Product?.WarrantyPeriodMonths ?? 0;
            if (m > max)
                max = m;
        }

        return WarrantyCoverageRules.ResolveMonthsForProduct(max);
    }
}
