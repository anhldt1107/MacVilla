using BE_API.Entities;

namespace BE_API.Domain;

/// <summary>
/// Quy tắc phạm vi bảo hành theo dòng đơn (OrderItem).
/// </summary>
public static class WarrantyCoverageRules
{
    public const int DefaultWarrantyMonths = 12;

    public static int ResolveMonthsForProduct(int warrantyPeriodMonths) =>
        warrantyPeriodMonths > 0 ? warrantyPeriodMonths : DefaultWarrantyMonths;

    public static DateTime ComputeValidUntil(DateTime issueDate, int months) =>
        issueDate.AddMonths(months);

    public static int ResolveMonthsForOrderItem(OrderItem line) =>
        ResolveMonthsForProduct(line.Variant?.Product?.WarrantyPeriodMonths ?? 0);

    public static bool IsLineEligible(WarrantyTicketLine line, DateTime now) =>
        line.ValidUntil >= now;

    public static int? DaysRemaining(WarrantyTicketLine line, DateTime now) =>
        (int)(line.ValidUntil.Date - now.Date).TotalDays;

    public static void ValidateClaimAgainstLine(
        WarrantyTicket ticket,
        WarrantyTicketLine line,
        int orderItemId,
        int variantId)
    {
        if (line.WarrantyTicketId != ticket.Id)
            throw new InvalidOperationException("Dòng bảo hành không thuộc phiếu này.");

        if (line.OrderItemId != orderItemId)
            throw new InvalidOperationException("Dòng bảo hành không khớp với dòng đơn.");

        if (line.VariantId != variantId)
            throw new InvalidOperationException("Biến thể không khớp với dòng bảo hành.");

        if (!WarrantyTicketStatuses.CanCreateClaim(ticket.Status))
            throw new InvalidOperationException(
                $"Phiếu bảo hành ở trạng thái '{ticket.Status}' không thể tạo yêu cầu bảo hành.");

        var now = DateTime.UtcNow;
        if (!IsLineEligible(line, now))
            throw new InvalidOperationException("Sản phẩm này đã hết hạn bảo hành.");
    }

    /// <summary>
    /// Tạo snapshot dòng BH từ OrderItem.
    /// </summary>
    public static WarrantyTicketLine BuildLineFromOrderItem(
        int warrantyTicketId,
        OrderItem line,
        DateTime issueDate)
    {
        var months = ResolveMonthsForOrderItem(line);
        return new WarrantyTicketLine
        {
            WarrantyTicketId = warrantyTicketId,
            OrderItemId = line.Id,
            VariantId = line.VariantId,
            IssueDate = issueDate,
            ValidUntil = ComputeValidUntil(issueDate, months),
            WarrantyPeriodMonths = months,
            SkuSnapshot = line.SkuSnapshot,
            Quantity = line.Quantity
        };
    }

    public static DateTime? MaxValidUntil(IEnumerable<WarrantyTicketLine> lines)
    {
        DateTime? max = null;
        foreach (var line in lines)
        {
            if (!max.HasValue || line.ValidUntil > max.Value)
                max = line.ValidUntil;
        }
        return max;
    }

    /// <summary>
    /// Xác định dòng BH cho claim; hỗ trợ fallback variantId khi chỉ một dòng còn hạn.
    /// </summary>
    public static WarrantyTicketLine ResolveLineForClaim(
        WarrantyTicket ticket,
        int? orderItemId,
        int variantId,
        DateTime now)
    {
        var lines = ticket.Lines?.ToList() ?? [];
        if (lines.Count == 0)
            throw new InvalidOperationException(
                "Phiếu bảo hành chưa có phạm vi theo dòng đơn. Vui lòng liên hệ hỗ trợ.");

        if (orderItemId.HasValue)
        {
            var line = lines.FirstOrDefault(l => l.OrderItemId == orderItemId.Value)
                ?? throw new InvalidOperationException("Không tìm thấy dòng bảo hành cho dòng đơn đã chọn.");
            ValidateClaimAgainstLine(ticket, line, line.OrderItemId, variantId);
            return line;
        }

        var eligible = lines
            .Where(l => l.VariantId == variantId && IsLineEligible(l, now))
            .ToList();

        if (eligible.Count == 1)
        {
            var line = eligible[0];
            ValidateClaimAgainstLine(ticket, line, line.OrderItemId, variantId);
            return line;
        }

        if (eligible.Count > 1)
            throw new ArgumentException(
                "Có nhiều dòng đơn cùng biến thể. Vui lòng gửi orderItemId.");

        throw new InvalidOperationException("Sản phẩm này đã hết hạn bảo hành hoặc không thuộc phiếu.");
    }

    /// <summary>Claim đang xử lý trên dòng đơn (mỗi dòng chỉ một claim active).</summary>
    public static int? FindActiveClaimId(IEnumerable<WarrantyClaim> claims, int orderItemId)
    {
        return claims
            .Where(c => c.OrderItemId == orderItemId
                        && AfterSalesQuantityRules.IsActiveWarrantyClaimStatus(c.Status))
            .OrderByDescending(c => c.CreatedAt)
            .Select(c => (int?)c.Id)
            .FirstOrDefault();
    }

    public static void EnsureNoActiveClaimForOrderItem(IEnumerable<WarrantyClaim> claims, int orderItemId)
    {
        var activeId = FindActiveClaimId(claims, orderItemId);
        if (!activeId.HasValue)
            return;

        throw new InvalidOperationException(
            $"Đã có yêu cầu bảo hành đang xử lý (#{activeId.Value}) cho dòng sản phẩm này. " +
            "Vui lòng chờ kết quả hoặc liên hệ hỗ trợ để hủy yêu cầu cũ.");
    }
}
