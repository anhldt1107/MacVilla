namespace BE_API.Domain;

/// <summary>Mã sự kiện thông báo in-app (ổn định cho FE/audit).</summary>
public static class NotificationEventTypes
{
    public const string QuotePendingApproval = "QuotePendingApproval";
    public const string QuoteApproved = "QuoteApproved";
    public const string QuoteRejected = "QuoteRejected";
    public const string QuoteCounterOffer = "QuoteCounterOffer";
    public const string QuoteCustomerAccepted = "QuoteCustomerAccepted";
    public const string QuoteCustomerRejected = "QuoteCustomerRejected";

    public const string OrderCreated = "OrderCreated";

    public const string ReturnPendingApproval = "ReturnPendingApproval";
    public const string ReturnCompleted = "ReturnCompleted";
    public const string ReturnApproved = "ReturnApproved";
    public const string ReturnRejected = "ReturnRejected";
    public const string ReturnItemsReceived = "ReturnItemsReceived";

    public const string TransferNotificationPending = "TransferNotificationPending";
    public const string TransferNotificationVerified = "TransferNotificationVerified";
    public const string TransferNotificationRejected = "TransferNotificationRejected";

    public const string FulfillmentAssigned = "FulfillmentAssigned";
    public const string FulfillmentCreated = "FulfillmentCreated";
    public const string FulfillmentShipped = "FulfillmentShipped";

    public const string WarrantyClaimPending = "WarrantyClaimPending";
    public const string WarrantyClaimUpdated = "WarrantyClaimUpdated";

    public const string OrderStatusChanged = "OrderStatusChanged";
    public const string PaymentReceived = "PaymentReceived";
    public const string PaymentRefunded = "PaymentRefunded";
    public const string InvoiceIssued = "InvoiceIssued";
}
