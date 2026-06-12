using BE_API.Authorization;
using BE_API.Domain;

namespace BE_API.Service;

/// <summary>Deep link FE theo shell nhân sự hoặc loại khách B2C/B2B.</summary>
public static class NotificationDeepLinkBuilder
{
    public static string StaffShellPrefix(string? roleName)
    {
        var r = (roleName ?? string.Empty).Trim();
        if (string.Equals(r, AppRoles.Admin, StringComparison.OrdinalIgnoreCase)) return "/admin";
        if (string.Equals(r, AppRoles.Manager, StringComparison.OrdinalIgnoreCase)) return "/manager";
        if (string.Equals(r, AppRoles.Sales, StringComparison.OrdinalIgnoreCase)) return "/saler";
        if (string.Equals(r, AppRoles.StockManager, StringComparison.OrdinalIgnoreCase)) return "/stock-manager";
        if (string.Equals(r, AppRoles.Worker, StringComparison.OrdinalIgnoreCase)) return "/worker";
        return "/admin";
    }

    public static string CustomerPrefix(string? customerType)
    {
        if (string.Equals(customerType, CustomerTypes.B2B, StringComparison.OrdinalIgnoreCase))
            return "/partner";
        return "/account";
    }

    public static string QuoteForStaff(string? roleName, int quoteId)
    {
        var shell = StaffShellPrefix(roleName);
        if (shell == "/manager")
            return $"{shell}/sales/quotations/{quoteId}";
        if (shell == "/saler")
            return $"{shell}/quotations/{quoteId}";
        return $"{shell}/sales/quotations-b2b/{quoteId}";
    }

    public static string QuotePendingQueueForStaff(string? roleName)
    {
        var shell = StaffShellPrefix(roleName);
        if (shell == "/manager")
            return $"{shell}/sales/quotations/pending";
        return $"{shell}/sales/quotations-b2b";
    }

    public static string OrderForStaff(string? roleName, int orderId)
    {
        var shell = StaffShellPrefix(roleName);
        if (shell is "/manager" or "/admin")
            return $"{shell}/sales/orders/{orderId}";
        if (shell == "/saler")
            return $"{shell}/orders/{orderId}";
        return $"{shell}/orders/{orderId}";
    }

    public static string ReturnForStaff(string? roleName, int returnId, bool pendingQueue = false)
    {
        var shell = StaffShellPrefix(roleName);
        if (pendingQueue && shell == "/manager")
            return $"{shell}/after-sales/returns/pending";
        if (shell == "/manager")
            return $"{shell}/after-sales/returns/{returnId}";
        if (shell == "/admin")
            return $"{shell}/after-sales/returns/{returnId}";
        if (shell == "/stock-manager")
            return $"{shell}/returns/{returnId}";
        return $"{shell}/returns/{returnId}";
    }

    public static string TransferNotificationForStaff(string? roleName, int id)
    {
        var shell = StaffShellPrefix(roleName);
        if (shell == "/saler")
            return $"{shell}/transfer-notifications/{id}";
        return $"{shell}/accounting/transfer-notifications/{id}";
    }

    public static string FulfillmentForStaff(string? roleName, int fulfillmentId)
    {
        var shell = StaffShellPrefix(roleName);
        if (shell == "/manager")
            return $"{shell}/logistics/fulfillments/{fulfillmentId}";
        if (shell == "/admin")
            return $"{shell}/logistics/fulfillments/{fulfillmentId}";
        return $"{shell}/fulfillments/{fulfillmentId}";
    }

    public static string WarrantyClaimForStaff(string? roleName, int claimId)
    {
        var shell = StaffShellPrefix(roleName);
        if (shell == "/manager")
            return $"{shell}/after-sales/warranty/claims/{claimId}";
        return $"{shell}/after-sales/warranty/claims/{claimId}";
    }

    public static string InvoiceForStaff(string? roleName, int invoiceId)
    {
        var shell = StaffShellPrefix(roleName);
        if (shell == "/saler")
            return $"{shell}/invoices/{invoiceId}";
        return $"{shell}/accounting/invoices/{invoiceId}";
    }

    public static string QuoteForCustomer(string? customerType, int quoteId)
        => $"{CustomerPrefix(customerType)}/quotation/{quoteId}";

    public static string OrderForCustomer(string? customerType, string orderCode)
        => $"{CustomerPrefix(customerType)}/orders/{Uri.EscapeDataString(orderCode)}";

    public static string ReturnForCustomer(string? customerType, int returnId)
    {
        var prefix = CustomerPrefix(customerType);
        if (prefix == "/partner")
            return $"{prefix}/after-sales/returns/{returnId}";
        return $"{prefix}/returns/{returnId}";
    }

    public static string WarrantyForCustomer(string? customerType, string ticketNumber)
    {
        var prefix = CustomerPrefix(customerType);
        if (prefix == "/partner")
            return $"{prefix}/after-sales/warranty/{Uri.EscapeDataString(ticketNumber)}";
        return $"{prefix}/warranty/{Uri.EscapeDataString(ticketNumber)}";
    }

    public static string PaymentForCustomer(string? customerType, int paymentId)
        => $"{CustomerPrefix(customerType)}/payments/{paymentId}";

    public static string TransferUploadForCustomer()
        => "/partner/payments/upload";

    public static string InvoiceForCustomer(string? customerType, string invoiceNumber)
        => $"{CustomerPrefix(customerType)}/payments/invoices/{Uri.EscapeDataString(invoiceNumber)}";
}
