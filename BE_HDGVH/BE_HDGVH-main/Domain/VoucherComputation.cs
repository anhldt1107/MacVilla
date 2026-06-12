using BE_API.Entities;

namespace BE_API.Domain;

/// <summary>Logic áp voucher (dùng chung <see cref="Service.StoreVoucherService"/> và checkout).</summary>
public static class VoucherComputation
{
    public static bool IsEligible(Voucher voucher, DateTime utcNow, out string? reason)
    {
        reason = null;
        if (!string.Equals(voucher.Status, VoucherStatuses.Active, StringComparison.OrdinalIgnoreCase))
        {
            reason = "Voucher không còn hiệu lực.";
            return false;
        }

        if (!string.Equals(voucher.Campaign.Status, VoucherStatuses.Active, StringComparison.OrdinalIgnoreCase))
        {
            reason = "Chiến dịch khuyến mãi không hoạt động.";
            return false;
        }

        if (voucher.Campaign.StartDate.HasValue && utcNow < voucher.Campaign.StartDate.Value)
        {
            reason = "Voucher chưa đến thời gian áp dụng.";
            return false;
        }

        if (voucher.Campaign.EndDate.HasValue && utcNow > voucher.Campaign.EndDate.Value)
        {
            reason = "Voucher đã hết hạn.";
            return false;
        }

        if (voucher.UsageLimit.HasValue && voucher.UsedCount >= voucher.UsageLimit.Value)
        {
            reason = "Voucher đã hết lượt sử dụng.";
            return false;
        }

        return true;
    }

    public static bool MeetsMinOrder(Voucher voucher, decimal merchandiseSubtotal) =>
        merchandiseSubtotal >= voucher.MinOrderValue;

    public static decimal ComputeDiscount(decimal subTotal, Voucher v)
    {
        var type = (v.DiscountType ?? string.Empty).Trim();
        decimal raw;

        if (IsPercentType(type))
        {
            var pct = v.DiscountValue;
            if (pct < 0 || pct > 100)
                throw new InvalidOperationException("Cấu hình voucher phần trăm không hợp lệ.");
            raw = Math.Round(subTotal * pct / 100m, 2, MidpointRounding.AwayFromZero);
        }
        else
        {
            raw = v.DiscountValue;
            if (raw < 0)
                throw new InvalidOperationException("Cấu hình voucher số tiền không hợp lệ.");
        }

        if (v.MaxDiscountAmount.HasValue)
            raw = Math.Min(raw, v.MaxDiscountAmount.Value);

        raw = Math.Min(raw, subTotal);
        return Math.Max(0, raw);
    }

    private static bool IsPercentType(string type)
    {
        if (type.Length == 0)
            return false;

        return type.Equals(VoucherDiscountTypes.Percentage, StringComparison.OrdinalIgnoreCase)
               || type.Equals("Percent", StringComparison.OrdinalIgnoreCase)
               || type.Equals("%", StringComparison.OrdinalIgnoreCase);
    }
}
