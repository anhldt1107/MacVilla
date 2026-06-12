using BE_API.Domain;
using BE_API.Entities;

namespace BE_API.Service;

/// <summary>Tính số đã trả / còn lại trên hóa đơn — dùng thống nhất admin, store B2B, đối soát CK.</summary>
public static class InvoicePaymentBalance
{
    /// <summary>Tổng tiền khách đã trả (chỉ giao dịch thu — không trừ hoàn tiền).</summary>
    public static decimal GetGrossReceived(IEnumerable<PaymentTransaction> transactions)
    {
        return transactions
            .Where(pt => PaymentTransactionTypes.IsIncome(pt.TransactionType ?? ""))
            .Sum(pt => pt.Amount);
    }

    /// <summary>Số tiền thực thu sau hoàn / điều chỉnh giảm — dùng giới hạn hoàn tiền.</summary>
    public static decimal GetNetPaid(IEnumerable<PaymentTransaction> transactions)
    {
        var income = GetGrossReceived(transactions);

        var outcome = transactions
            .Where(pt => PaymentTransactionTypes.IsOutcome(pt.TransactionType ?? ""))
            .Sum(pt => pt.Amount);

        return income - outcome;
    }

    /// <summary>Số còn phải thu trên hóa đơn (hoàn tiền không tạo thêm nghĩa vụ thanh toán).</summary>
    public static decimal GetRemaining(Invoice invoice, IEnumerable<PaymentTransaction>? transactions = null)
    {
        var txs = transactions ?? invoice.PaymentTransactions;
        var total = invoice.TotalAmount ?? 0m;
        var remaining = total - GetGrossReceived(txs);
        return remaining < 0 ? 0 : remaining;
    }

    public static string ResolveInvoicePaymentStatus(decimal totalAmount, IEnumerable<PaymentTransaction> transactions)
    {
        var grossReceived = GetGrossReceived(transactions);

        if (grossReceived <= 0)
        {
            return InvoiceStatuses.Unpaid;
        }

        if (grossReceived >= totalAmount)
        {
            return InvoiceStatuses.Paid;
        }

        return InvoiceStatuses.PartiallyPaid;
    }

    public static string ResolveOrderPaymentStatus(decimal grossReceived, decimal invoiceTotal)
    {
        if (grossReceived <= 0)
        {
            return PaymentStatuses.Unpaid;
        }

        if (grossReceived < invoiceTotal)
        {
            return PaymentStatuses.PartiallyPaid;
        }

        return PaymentStatuses.Paid;
    }

    public static void EnsureAmountDoesNotExceedRemaining(Invoice invoice, decimal amount)
    {
        if (amount <= 0)
            return;

        var remaining = GetRemaining(invoice);
        if (amount > remaining)
        {
            throw new InvalidOperationException(
                $"Số tiền ghi nhận ({amount:N0}) vượt số còn lại của hóa đơn ({remaining:N0}).");
        }
    }
}
