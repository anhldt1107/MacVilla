namespace BE_API.Domain;

/// <summary>
/// Quy tắc số lượng khả dụng cho đổi/trả và bảo hành trên cùng OrderItem.
/// </summary>
public static class AfterSalesQuantityRules
{
    public static readonly string[] OpenReturnStatuses =
    [
        ReturnTicketStatuses.Requested,
        ReturnTicketStatuses.PendingApproval,
        ReturnTicketStatuses.Approved,
        ReturnTicketStatuses.Processing,
        ReturnTicketStatuses.ItemsReceived
    ];

    public static bool IsOpenReturnStatus(string? status) =>
        !string.IsNullOrWhiteSpace(status) &&
        OpenReturnStatuses.Contains(status, StringComparer.OrdinalIgnoreCase);

    public static bool IsActiveWarrantyClaimStatus(string? status)
    {
        if (string.IsNullOrWhiteSpace(status))
            return false;

        return !string.Equals(status, WarrantyClaimStatuses.Completed, StringComparison.OrdinalIgnoreCase)
               && !string.Equals(status, WarrantyClaimStatuses.Rejected, StringComparison.OrdinalIgnoreCase)
               && !string.Equals(status, WarrantyClaimStatuses.Cancelled, StringComparison.OrdinalIgnoreCase);
    }

    /// <summary>
    /// Số lượng còn có thể đổi/trả trên một dòng đơn.
    /// </summary>
    public static int ComputeReturnableQuantity(
        int orderItemQuantity,
        int committedReturnQuantity,
        int activeClaimCount)
    {
        var remaining = orderItemQuantity - committedReturnQuantity - activeClaimCount;
        return Math.Max(0, remaining);
    }

    public static void ValidateReturnQuantity(int orderItemQuantity, int requestedQty, int committedReturnQty, int activeClaimCount)
    {
        if (requestedQty <= 0)
            throw new ArgumentException("Số lượng phải lớn hơn 0");

        if (requestedQty > orderItemQuantity)
            throw new ArgumentException($"Số lượng trả ({requestedQty}) vượt quá số lượng đã mua ({orderItemQuantity})");

        var available = ComputeReturnableQuantity(orderItemQuantity, committedReturnQty, activeClaimCount);
        if (requestedQty > available)
            throw new InvalidOperationException(
                $"Không đủ số lượng có thể đổi/trả trên dòng đơn này (còn {available}). " +
                "Có thể đang có phiếu đổi/trả hoặc yêu cầu bảo hành đang xử lý.");
    }
}
