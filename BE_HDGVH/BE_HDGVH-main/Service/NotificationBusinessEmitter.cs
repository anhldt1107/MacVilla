using BE_API.Authorization;
using BE_API.Database;
using BE_API.Domain;
using BE_API.Service.IService;
using Microsoft.EntityFrameworkCore;

namespace BE_API.Service;

/// <summary>Phát thông báo theo sự kiện nghiệp vụ — gọi sau SaveChanges thành công.</summary>
public class NotificationBusinessEmitter(BeContext db, INotificationService notifications)
{
    public async Task OnQuoteSubmittedForApprovalAsync(int quoteId, CancellationToken cancellationToken = default)
    {
        var quote = await db.Quotes.AsNoTracking()
            .FirstOrDefaultAsync(q => q.Id == quoteId, cancellationToken);
        if (quote == null) return;

        var label = quote.QuoteCode;
        await notifications.NotifyStaffByRolesAsync(
            [AppRoles.Manager, AppRoles.Admin],
            NotificationEventTypes.QuotePendingApproval,
            $"Báo giá {label} chờ duyệt",
            null,
            "Quote",
            quoteId.ToString(),
            role => NotificationDeepLinkBuilder.QuoteForStaff(role, quoteId),
            NotificationPriorities.High,
            cancellationToken);
    }

    public async Task OnQuoteApprovedAsync(int quoteId, CancellationToken cancellationToken = default)
    {
        var quote = await db.Quotes.AsNoTracking()
            .Include(q => q.Customer)
            .FirstOrDefaultAsync(q => q.Id == quoteId, cancellationToken);
        if (quote == null) return;

        var label = quote.QuoteCode;
        if (quote.SalesId.HasValue)
        {
            await notifications.NotifyStaffUserAsync(
                quote.SalesId.Value,
                NotificationEventTypes.QuoteApproved,
                $"Báo giá {label} đã được duyệt",
                null,
                "Quote",
                quoteId.ToString(),
                NotificationDeepLinkBuilder.QuoteForStaff(AppRoles.Sales, quoteId),
                cancellationToken: cancellationToken);
        }

        await notifications.NotifyCustomerAsync(
            quote.CustomerId,
            NotificationEventTypes.QuoteApproved,
            $"Báo giá {label} đã sẵn sàng",
            "Bạn có thể xem và phản hồi trên cổng B2B.",
            "Quote",
            quoteId.ToString(),
            NotificationDeepLinkBuilder.QuoteForCustomer(quote.Customer?.CustomerType, quoteId),
            cancellationToken: cancellationToken);
    }

    public async Task OnQuoteRejectedAsync(int quoteId, CancellationToken cancellationToken = default)
    {
        var quote = await db.Quotes.AsNoTracking()
            .Include(q => q.Customer)
            .FirstOrDefaultAsync(q => q.Id == quoteId, cancellationToken);
        if (quote == null) return;

        var label = quote.QuoteCode;
        if (quote.SalesId.HasValue)
        {
            await notifications.NotifyStaffUserAsync(
                quote.SalesId.Value,
                NotificationEventTypes.QuoteRejected,
                $"Báo giá {label} bị từ chối",
                quote.RejectReason,
                "Quote",
                quoteId.ToString(),
                NotificationDeepLinkBuilder.QuoteForStaff(AppRoles.Sales, quoteId),
                cancellationToken: cancellationToken);
        }

        await notifications.NotifyCustomerAsync(
            quote.CustomerId,
            NotificationEventTypes.QuoteRejected,
            $"Báo giá {label} chưa được duyệt",
            quote.RejectReason,
            "Quote",
            quoteId.ToString(),
            NotificationDeepLinkBuilder.QuoteForCustomer(quote.Customer?.CustomerType, quoteId),
            cancellationToken: cancellationToken);
    }

    public async Task OnQuoteCounterOfferAsync(int quoteId, CancellationToken cancellationToken = default)
    {
        var quote = await db.Quotes.AsNoTracking()
            .FirstOrDefaultAsync(q => q.Id == quoteId, cancellationToken);
        if (quote == null || !quote.SalesId.HasValue) return;

        await notifications.NotifyStaffUserAsync(
            quote.SalesId.Value,
            NotificationEventTypes.QuoteCounterOffer,
            $"Khách phản hồi báo giá {quote.QuoteCode}",
            quote.CounterOfferMessage,
            "Quote",
            quoteId.ToString(),
            NotificationDeepLinkBuilder.QuoteForStaff(AppRoles.Sales, quoteId),
            NotificationPriorities.High,
            cancellationToken);
    }

    public async Task OnQuoteCustomerAcceptedAsync(int quoteId, CancellationToken cancellationToken = default)
    {
        var quote = await db.Quotes.AsNoTracking()
            .Include(q => q.Customer)
            .FirstOrDefaultAsync(q => q.Id == quoteId, cancellationToken);
        if (quote == null) return;

        if (quote.SalesId.HasValue)
        {
            await notifications.NotifyStaffUserAsync(
                quote.SalesId.Value,
                NotificationEventTypes.QuoteCustomerAccepted,
                $"Khách chấp nhận báo giá {quote.QuoteCode}",
                null,
                "Quote",
                quoteId.ToString(),
                NotificationDeepLinkBuilder.QuoteForStaff(AppRoles.Sales, quoteId),
                cancellationToken: cancellationToken);
        }

        await notifications.NotifyStaffByRolesAsync(
            [AppRoles.StockManager],
            NotificationEventTypes.QuoteCustomerAccepted,
            $"Báo giá {quote.QuoteCode} đã được khách chấp nhận",
            "Chuẩn bị xử lý đơn hàng khi chuyển đổi.",
            "Quote",
            quoteId.ToString(),
            role => NotificationDeepLinkBuilder.QuoteForStaff(role, quoteId),
            cancellationToken: cancellationToken);
    }

    public async Task OnReturnPendingApprovalAsync(int returnId, CancellationToken cancellationToken = default)
    {
        var ticket = await db.ReturnExchangeTickets.AsNoTracking()
            .FirstOrDefaultAsync(t => t.Id == returnId, cancellationToken);
        if (ticket == null) return;

        var label = ticket.TicketNumber;
        await notifications.NotifyStaffByRolesAsync(
            [AppRoles.Manager, AppRoles.Admin],
            NotificationEventTypes.ReturnPendingApproval,
            $"Phiếu đổi trả {label} chờ duyệt",
            null,
            "Return",
            returnId.ToString(),
            role => NotificationDeepLinkBuilder.ReturnForStaff(role, returnId, pendingQueue: true),
            NotificationPriorities.High,
            cancellationToken);
    }

    public async Task OnReturnApprovedAsync(int returnId, CancellationToken cancellationToken = default)
    {
        var ticket = await db.ReturnExchangeTickets.AsNoTracking()
            .Include(t => t.Customer)
            .FirstOrDefaultAsync(t => t.Id == returnId, cancellationToken);
        if (ticket == null) return;

        await notifications.NotifyStaffByRolesAsync(
            [AppRoles.StockManager],
            NotificationEventTypes.ReturnApproved,
            $"Phiếu đổi trả {ticket.TicketNumber} đã duyệt",
            "Bộ phận kho tiếp nhận xử lý.",
            "Return",
            returnId.ToString(),
            role => NotificationDeepLinkBuilder.ReturnForStaff(role, returnId),
            cancellationToken: cancellationToken);

        await notifications.NotifyCustomerAsync(
            ticket.CustomerId,
            NotificationEventTypes.ReturnApproved,
            $"Yêu cầu đổi trả {ticket.TicketNumber} đã được duyệt",
            null,
            "Return",
            returnId.ToString(),
            NotificationDeepLinkBuilder.ReturnForCustomer(ticket.Customer?.CustomerType, returnId),
            cancellationToken: cancellationToken);
    }

    public async Task OnQuoteCustomerRejectedAsync(int quoteId, CancellationToken cancellationToken = default)
    {
        var quote = await db.Quotes.AsNoTracking()
            .FirstOrDefaultAsync(q => q.Id == quoteId, cancellationToken);
        if (quote == null || !quote.SalesId.HasValue) return;

        await notifications.NotifyStaffUserAsync(
            quote.SalesId.Value,
            NotificationEventTypes.QuoteCustomerRejected,
            $"Khách từ chối báo giá {quote.QuoteCode}",
            quote.CustomerRejectReason,
            "Quote",
            quoteId.ToString(),
            NotificationDeepLinkBuilder.QuoteForStaff(AppRoles.Sales, quoteId),
            cancellationToken: cancellationToken);
    }

    public async Task OnOrderCreatedAsync(int orderId, CancellationToken cancellationToken = default)
    {
        var order = await db.CustomerOrders.AsNoTracking()
            .Include(o => o.Customer)
            .FirstOrDefaultAsync(o => o.Id == orderId, cancellationToken);
        if (order == null) return;

        if (order.SalesId.HasValue)
        {
            await notifications.NotifyStaffUserAsync(
                order.SalesId.Value,
                NotificationEventTypes.OrderCreated,
                $"Đơn mới {order.OrderCode}",
                null,
                "Order",
                order.Id.ToString(),
                NotificationDeepLinkBuilder.OrderForStaff(AppRoles.Sales, order.Id),
                cancellationToken: cancellationToken);
        }

        await notifications.NotifyStaffByRolesAsync(
            [AppRoles.StockManager],
            NotificationEventTypes.OrderCreated,
            $"Đơn mới {order.OrderCode}",
            "Chuẩn bị xử lý kho khi sẵn sàng.",
            "Order",
            order.Id.ToString(),
            role => NotificationDeepLinkBuilder.OrderForStaff(role, order.Id),
            cancellationToken: cancellationToken);

        if (order.QuoteId.HasValue &&
            string.Equals(order.Customer?.CustomerType, CustomerTypes.B2B, StringComparison.OrdinalIgnoreCase))
        {
            await notifications.NotifyCustomerAsync(
                order.CustomerId,
                NotificationEventTypes.OrderCreated,
                $"Đơn {order.OrderCode} đã được tạo từ báo giá",
                null,
                "Order",
                order.OrderCode,
                NotificationDeepLinkBuilder.OrderForCustomer(order.Customer?.CustomerType, order.OrderCode),
                cancellationToken: cancellationToken);
        }
    }

    public async Task OnOrderStatusChangedAsync(
        int orderId,
        string? fromStatus,
        string toStatus,
        CancellationToken cancellationToken = default)
    {
        if (string.Equals(toStatus, OrderStatuses.Shipped, StringComparison.OrdinalIgnoreCase))
            return;

        var order = await db.CustomerOrders.AsNoTracking()
            .Include(o => o.Customer)
            .FirstOrDefaultAsync(o => o.Id == orderId, cancellationToken);
        if (order == null) return;

        var title = $"Đơn {order.OrderCode}: {LocalizeOrderStatus(toStatus)}";
        var entityId = order.OrderCode;

        if (IsCustomerOrderStatusNotification(toStatus))
        {
            await notifications.NotifyCustomerAsync(
                order.CustomerId,
                NotificationEventTypes.OrderStatusChanged,
                title,
                null,
                "Order",
                entityId,
                NotificationDeepLinkBuilder.OrderForCustomer(order.Customer?.CustomerType, order.OrderCode),
                cancellationToken: cancellationToken);
        }

        if (order.SalesId.HasValue && IsSalesOrderStatusNotification(toStatus))
        {
            await notifications.NotifyStaffUserAsync(
                order.SalesId.Value,
                NotificationEventTypes.OrderStatusChanged,
                title,
                null,
                "Order",
                order.Id.ToString(),
                NotificationDeepLinkBuilder.OrderForStaff(AppRoles.Sales, order.Id),
                cancellationToken: cancellationToken);
        }

        if (IsStockManagerOrderStatusNotification(toStatus))
        {
            await notifications.NotifyStaffByRolesAsync(
                [AppRoles.StockManager],
                NotificationEventTypes.OrderStatusChanged,
                title,
                null,
                "Order",
                order.Id.ToString(),
                role => NotificationDeepLinkBuilder.OrderForStaff(role, order.Id),
                cancellationToken: cancellationToken);
        }
    }

    public async Task OnOrderPaidAsync(int orderId, CancellationToken cancellationToken = default)
    {
        var order = await db.CustomerOrders.AsNoTracking()
            .Include(o => o.Customer)
            .FirstOrDefaultAsync(o => o.Id == orderId, cancellationToken);
        if (order == null) return;

        await notifications.NotifyCustomerAsync(
            order.CustomerId,
            NotificationEventTypes.PaymentReceived,
            $"Thanh toán đơn {order.OrderCode} thành công",
            null,
            "Order",
            order.OrderCode,
            NotificationDeepLinkBuilder.OrderForCustomer(order.Customer?.CustomerType, order.OrderCode),
            cancellationToken: cancellationToken);
    }

    public async Task OnReturnRejectedAsync(int returnId, CancellationToken cancellationToken = default)
    {
        var ticket = await db.ReturnExchangeTickets.AsNoTracking()
            .Include(t => t.Customer)
            .Include(t => t.Order)
            .FirstOrDefaultAsync(t => t.Id == returnId, cancellationToken);
        if (ticket == null) return;

        await notifications.NotifyCustomerAsync(
            ticket.CustomerId,
            NotificationEventTypes.ReturnRejected,
            $"Yêu cầu đổi trả {ticket.TicketNumber} bị từ chối",
            null,
            "Return",
            returnId.ToString(),
            NotificationDeepLinkBuilder.ReturnForCustomer(ticket.Customer?.CustomerType, returnId),
            cancellationToken: cancellationToken);

        if (ticket.Order?.SalesId is int salesId)
        {
            await notifications.NotifyStaffUserAsync(
                salesId,
                NotificationEventTypes.ReturnRejected,
                $"Phiếu đổi trả {ticket.TicketNumber} bị từ chối",
                null,
                "Return",
                returnId.ToString(),
                NotificationDeepLinkBuilder.ReturnForStaff(AppRoles.Sales, returnId),
                cancellationToken: cancellationToken);
        }
    }

    public async Task OnReturnCompletedAsync(int returnId, CancellationToken cancellationToken = default)
    {
        var ticket = await db.ReturnExchangeTickets.AsNoTracking()
            .Include(t => t.Customer)
            .FirstOrDefaultAsync(t => t.Id == returnId, cancellationToken);
        if (ticket == null) return;

        await notifications.NotifyCustomerAsync(
            ticket.CustomerId,
            NotificationEventTypes.ReturnCompleted,
            $"Phiếu đổi trả {ticket.TicketNumber} đã hoàn tất",
            null,
            "Return",
            returnId.ToString(),
            NotificationDeepLinkBuilder.ReturnForCustomer(ticket.Customer?.CustomerType, returnId),
            cancellationToken: cancellationToken);
    }

    public async Task OnReturnItemsReceivedAsync(int returnId, CancellationToken cancellationToken = default)
    {
        var ticket = await db.ReturnExchangeTickets.AsNoTracking()
            .FirstOrDefaultAsync(t => t.Id == returnId, cancellationToken);
        if (ticket == null) return;

        await notifications.NotifyStaffByRolesAsync(
            [AppRoles.StockManager],
            NotificationEventTypes.ReturnItemsReceived,
            $"Đã nhận hàng trả — {ticket.TicketNumber}",
            "Hoàn tất xử lý kho khi sẵn sàng.",
            "Return",
            returnId.ToString(),
            role => NotificationDeepLinkBuilder.ReturnForStaff(role, returnId),
            cancellationToken: cancellationToken);
    }

    public async Task OnTransferNotificationPendingAsync(int transferNotificationId, CancellationToken cancellationToken = default)
    {
        var tn = await db.TransferNotifications.AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == transferNotificationId, cancellationToken);
        if (tn == null) return;

        await notifications.NotifyStaffByRolesAsync(
            [AppRoles.Manager, AppRoles.Admin],
            NotificationEventTypes.TransferNotificationPending,
            "Chuyển khoản mới chờ đối soát",
            $"Mã CK: {tn.ReferenceCode}",
            "TransferNotification",
            transferNotificationId.ToString(),
            role => NotificationDeepLinkBuilder.TransferNotificationForStaff(role, transferNotificationId),
            NotificationPriorities.High,
            cancellationToken);
    }

    public async Task OnTransferNotificationVerifiedAsync(int transferNotificationId, CancellationToken cancellationToken = default)
    {
        var tn = await db.TransferNotifications.AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == transferNotificationId, cancellationToken);
        if (tn == null) return;

        await notifications.NotifyCustomerAsync(
            tn.CustomerId,
            NotificationEventTypes.TransferNotificationVerified,
            "Chuyển khoản đã được xác nhận",
            $"Mã CK: {tn.ReferenceCode}",
            "TransferNotification",
            transferNotificationId.ToString(),
            NotificationDeepLinkBuilder.TransferUploadForCustomer(),
            cancellationToken: cancellationToken);
    }

    public async Task OnTransferNotificationRejectedAsync(int transferNotificationId, CancellationToken cancellationToken = default)
    {
        var tn = await db.TransferNotifications.AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == transferNotificationId, cancellationToken);
        if (tn == null) return;

        await notifications.NotifyCustomerAsync(
            tn.CustomerId,
            NotificationEventTypes.TransferNotificationRejected,
            "Chuyển khoản chưa được chấp nhận",
            tn.ProcessNote,
            "TransferNotification",
            transferNotificationId.ToString(),
            NotificationDeepLinkBuilder.TransferUploadForCustomer(),
            cancellationToken: cancellationToken);
    }

    public async Task OnFulfillmentAssignedAsync(int fulfillmentId, int workerId, CancellationToken cancellationToken = default)
    {
        var f = await db.FulfillmentTickets.AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == fulfillmentId, cancellationToken);
        if (f == null) return;

        await notifications.NotifyStaffUserAsync(
            workerId,
            NotificationEventTypes.FulfillmentAssigned,
            $"Bạn được gán phiếu xuất #{fulfillmentId}",
            null,
            "Fulfillment",
            fulfillmentId.ToString(),
            NotificationDeepLinkBuilder.FulfillmentForStaff(AppRoles.Worker, fulfillmentId),
            NotificationPriorities.High,
            cancellationToken);
    }

    public async Task OnFulfillmentCreatedAsync(int fulfillmentId, CancellationToken cancellationToken = default)
    {
        await notifications.NotifyStaffByRolesAsync(
            [AppRoles.StockManager],
            NotificationEventTypes.FulfillmentCreated,
            $"Phiếu xuất mới #{fulfillmentId}",
            null,
            "Fulfillment",
            fulfillmentId.ToString(),
            role => NotificationDeepLinkBuilder.FulfillmentForStaff(role, fulfillmentId),
            cancellationToken: cancellationToken);
    }

    public async Task OnFulfillmentShippedAsync(int fulfillmentId, CancellationToken cancellationToken = default)
    {
        var f = await db.FulfillmentTickets.AsNoTracking()
            .Include(x => x.Order)
            .ThenInclude(o => o!.Customer)
            .FirstOrDefaultAsync(x => x.Id == fulfillmentId, cancellationToken);
        if (f?.Order == null) return;

        var order = f.Order;
        if (order.SalesId.HasValue)
        {
            await notifications.NotifyStaffUserAsync(
                order.SalesId.Value,
                NotificationEventTypes.FulfillmentShipped,
                $"Đơn {order.OrderCode} đã giao",
                null,
                "Order",
                order.Id.ToString(),
                NotificationDeepLinkBuilder.OrderForStaff(AppRoles.Sales, order.Id),
                cancellationToken: cancellationToken);
        }

        await notifications.NotifyCustomerAsync(
            order.CustomerId,
            NotificationEventTypes.FulfillmentShipped,
            $"Đơn {order.OrderCode} đang được giao",
            null,
            "Order",
            order.OrderCode,
            NotificationDeepLinkBuilder.OrderForCustomer(order.Customer?.CustomerType, order.OrderCode),
            cancellationToken: cancellationToken);
    }

    public async Task OnWarrantyClaimPendingAsync(int claimId, CancellationToken cancellationToken = default)
    {
        await notifications.NotifyStaffByRolesAsync(
            [AppRoles.Manager, AppRoles.Admin],
            NotificationEventTypes.WarrantyClaimPending,
            $"Yêu cầu bảo hành mới #{claimId}",
            null,
            "WarrantyClaim",
            claimId.ToString(),
            role => NotificationDeepLinkBuilder.WarrantyClaimForStaff(role, claimId),
            NotificationPriorities.High,
            cancellationToken);
    }

    public async Task OnInvoiceIssuedAsync(int invoiceId, CancellationToken cancellationToken = default)
    {
        var invoice = await db.Invoices.AsNoTracking()
            .Include(i => i.Customer)
            .Include(i => i.Order)
            .FirstOrDefaultAsync(i => i.Id == invoiceId, cancellationToken);
        if (invoice == null) return;

        if (invoice.Order?.SalesId is int salesId)
        {
            await notifications.NotifyStaffUserAsync(
                salesId,
                NotificationEventTypes.InvoiceIssued,
                $"Hóa đơn {invoice.InvoiceNumber} đã phát hành",
                null,
                "Invoice",
                invoiceId.ToString(),
                NotificationDeepLinkBuilder.InvoiceForStaff(AppRoles.Sales, invoiceId),
                cancellationToken: cancellationToken);
        }

        await notifications.NotifyCustomerAsync(
            invoice.CustomerId,
            NotificationEventTypes.InvoiceIssued,
            $"Hóa đơn {invoice.InvoiceNumber}",
            null,
            "Invoice",
            invoice.InvoiceNumber,
            NotificationDeepLinkBuilder.InvoiceForCustomer(invoice.Customer?.CustomerType, invoice.InvoiceNumber),
            cancellationToken: cancellationToken);
    }

    public async Task OnPaymentReceivedAsync(int paymentId, CancellationToken cancellationToken = default)
    {
        var payment = await db.PaymentTransactions.AsNoTracking()
            .Include(p => p.Customer)
            .FirstOrDefaultAsync(p => p.Id == paymentId, cancellationToken);
        if (payment == null) return;

        await notifications.NotifyCustomerAsync(
            payment.CustomerId,
            NotificationEventTypes.PaymentReceived,
            "Thanh toán đã được ghi nhận",
            null,
            "Payment",
            paymentId.ToString(),
            NotificationDeepLinkBuilder.PaymentForCustomer(payment.Customer?.CustomerType, paymentId),
            cancellationToken: cancellationToken);
    }

    public async Task OnPaymentRefundedAsync(int paymentId, CancellationToken cancellationToken = default)
    {
        var payment = await db.PaymentTransactions.AsNoTracking()
            .Include(p => p.Customer)
            .FirstOrDefaultAsync(p => p.Id == paymentId, cancellationToken);
        if (payment == null) return;

        await notifications.NotifyCustomerAsync(
            payment.CustomerId,
            NotificationEventTypes.PaymentRefunded,
            "Hoàn tiền đã được ghi nhận",
            null,
            "Payment",
            paymentId.ToString(),
            NotificationDeepLinkBuilder.PaymentForCustomer(payment.Customer?.CustomerType, paymentId),
            cancellationToken: cancellationToken);
    }

    public async Task OnWarrantyClaimUpdatedAsync(int claimId, CancellationToken cancellationToken = default)
    {
        var claim = await db.WarrantyClaims.AsNoTracking()
            .Include(c => c.WarrantyTicket)
            .ThenInclude(t => t!.Customer)
            .FirstOrDefaultAsync(c => c.Id == claimId, cancellationToken);
        if (claim?.WarrantyTicket == null) return;

        var ticket = claim.WarrantyTicket;
        var statusLabel = claim.Status switch
        {
            var s when string.Equals(s, WarrantyClaimStatuses.Completed, StringComparison.OrdinalIgnoreCase) => "đã hoàn thành",
            var s when string.Equals(s, WarrantyClaimStatuses.Rejected, StringComparison.OrdinalIgnoreCase) => "bị từ chối",
            var s when string.Equals(s, WarrantyClaimStatuses.Cancelled, StringComparison.OrdinalIgnoreCase) => "đã hủy",
            _ => "đã cập nhật"
        };

        await notifications.NotifyCustomerAsync(
            ticket.CustomerId,
            NotificationEventTypes.WarrantyClaimUpdated,
            $"Yêu cầu bảo hành {statusLabel}",
            claim.Resolution,
            "WarrantyClaim",
            claimId.ToString(),
            NotificationDeepLinkBuilder.WarrantyForCustomer(ticket.Customer?.CustomerType, ticket.TicketNumber),
            cancellationToken: cancellationToken);
    }

    private static bool IsCustomerOrderStatusNotification(string status) =>
        status is OrderStatuses.Confirmed
            or OrderStatuses.Shipped
            or OrderStatuses.Delivered
            or OrderStatuses.Completed
            or OrderStatuses.Cancelled;

    private static bool IsSalesOrderStatusNotification(string status) =>
        status is OrderStatuses.Cancelled or OrderStatuses.Delivered;

    private static bool IsStockManagerOrderStatusNotification(string status) =>
        status is OrderStatuses.Confirmed or OrderStatuses.Processing;

    private static string LocalizeOrderStatus(string status) =>
        status switch
        {
            OrderStatuses.Confirmed => "Đã xác nhận",
            OrderStatuses.Processing => "Đang xử lý",
            OrderStatuses.ReadyToShip => "Sẵn sàng giao",
            OrderStatuses.Shipped => "Đang giao",
            OrderStatuses.Delivered => "Đã giao",
            OrderStatuses.Completed => "Hoàn thành",
            OrderStatuses.Cancelled => "Đã hủy",
            _ => status
        };
}
