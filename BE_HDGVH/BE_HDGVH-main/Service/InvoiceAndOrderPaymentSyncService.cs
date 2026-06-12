using BE_API.Database;
using BE_API.Domain;
using BE_API.Service.IService;
using Microsoft.EntityFrameworkCore;

namespace BE_API.Service;

public class InvoiceAndOrderPaymentSyncService(
    BeContext db,
    ILogger<InvoiceAndOrderPaymentSyncService> logger
) : IInvoiceAndOrderPaymentSyncService
{
    public async Task ApplyPaymentTransactionSideEffectsAsync(int? invoiceId,
        CancellationToken cancellationToken = default)
    {
        if (!invoiceId.HasValue)
        {
            return;
        }

        await RecalculateInvoicePaymentStatusAsync(invoiceId.Value, cancellationToken);

        var orderLink = await db.Invoices
            .AsNoTracking()
            .Where(i => i.Id == invoiceId.Value)
            .Select(i => i.OrderId)
            .FirstOrDefaultAsync(cancellationToken);

        if (!orderLink.HasValue)
        {
            return;
        }

        await SyncOrderPaymentForOrderAsync(orderLink.Value, cancellationToken);
    }

    private async Task RecalculateInvoicePaymentStatusAsync(int invoiceId,
        CancellationToken cancellationToken)
    {
        var invoice = await db.Invoices.FindAsync([invoiceId], cancellationToken);
        if (invoice == null)
        {
            return;
        }

        var payments = await db.PaymentTransactions
            .Where(pt => pt.InvoiceId == invoiceId)
            .ToListAsync(cancellationToken);

        var totalAmount = invoice.TotalAmount ?? 0;
        invoice.Status = InvoicePaymentBalance.ResolveInvoicePaymentStatus(totalAmount, payments);

        await db.SaveChangesAsync(cancellationToken);
    }

    private async Task SyncOrderPaymentForOrderAsync(int orderId, CancellationToken cancellationToken)
    {
        var invoiceScope = db.Invoices
            .AsNoTracking()
            .Where(i => i.OrderId == orderId
                        && i.Status != InvoiceStatuses.Draft
                        && i.Status != InvoiceStatuses.Cancelled);

        var invoiceIds = await invoiceScope
            .Select(i => i.Id)
            .ToListAsync(cancellationToken);

        if (invoiceIds.Count == 0)
        {
            return;
        }

        var denom = await invoiceScope.SumAsync(i => i.TotalAmount ?? 0m, cancellationToken);
        if (denom <= 0)
        {
            return;
        }

        var payments = await db.PaymentTransactions
            .Where(pt => pt.InvoiceId.HasValue && invoiceIds.Contains(pt.InvoiceId.Value))
            .ToListAsync(cancellationToken);

        var grossReceivedOrder = InvoicePaymentBalance.GetGrossReceived(payments);

        var nextComputed = InvoicePaymentBalance.ResolveOrderPaymentStatus(grossReceivedOrder, denom);

        var order = await db.CustomerOrders.FindAsync([orderId], cancellationToken);
        if (order == null)
        {
            logger.LogWarning("SyncOrderPayment: không thấy đơn #{OrderId}.", orderId);
            return;
        }

        var normalizedNext =
            PaymentStatuses.All.First(s => s.Equals(nextComputed, StringComparison.OrdinalIgnoreCase));

        var current = order.PaymentStatus;
        var same = string.Equals(current, normalizedNext, StringComparison.OrdinalIgnoreCase);
        if (same)
        {
            return;
        }

        if (!PaymentStatuses.CanTransition(current, normalizedNext))
        {
            logger.LogWarning(
                "SyncOrderPayment: không tự đổi PaymentStatus đơn {OrderId} '{Current}'→'{Next}' vì không hợp lệ transitions.",
                orderId,
                current,
                normalizedNext);
            return;
        }

        order.PaymentStatus = normalizedNext;

        if (string.Equals(normalizedNext, PaymentStatuses.Paid, StringComparison.OrdinalIgnoreCase) &&
            (string.Equals(order.OrderStatus, OrderStatuses.New, StringComparison.OrdinalIgnoreCase) ||
             string.Equals(order.OrderStatus, OrderStatuses.AwaitingPayment, StringComparison.OrdinalIgnoreCase)))
        {
            order.OrderStatus = OrderStatuses.Confirmed;
        }

        await db.SaveChangesAsync(cancellationToken);
    }

}
