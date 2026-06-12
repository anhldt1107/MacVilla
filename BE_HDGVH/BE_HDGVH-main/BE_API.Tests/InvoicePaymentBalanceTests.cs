using BE_API.Domain;
using BE_API.Entities;
using BE_API.Service;
using Xunit;

namespace BE_API.Tests;

public class InvoicePaymentBalanceTests
{
    [Fact]
    public void GetNetPaid_sums_income_minus_outcome()
    {
        var txs = new[]
        {
            new PaymentTransaction { Amount = 8_000_000m, TransactionType = PaymentTransactionTypes.Payment },
            new PaymentTransaction { Amount = 2_000_000m, TransactionType = PaymentTransactionTypes.Refund },
            new PaymentTransaction { Amount = 1_000_000m, TransactionType = PaymentTransactionTypes.AdjustmentIncrease },
        };

        Assert.Equal(7_000_000m, InvoicePaymentBalance.GetNetPaid(txs));
    }

    [Fact]
    public void GetRemaining_never_negative()
    {
        var invoice = new Invoice { TotalAmount = 10_000_000m };
        var txs = new[]
        {
            new PaymentTransaction { Amount = 12_000_000m, TransactionType = PaymentTransactionTypes.Payment },
        };

        Assert.Equal(0m, InvoicePaymentBalance.GetRemaining(invoice, txs));
    }

    [Fact]
    public void GetRemaining_partial_payment()
    {
        var invoice = new Invoice { TotalAmount = 20_000_000m };
        var txs = new[]
        {
            new PaymentTransaction { Amount = 8_000_000m, TransactionType = PaymentTransactionTypes.Payment },
        };

        Assert.Equal(12_000_000m, InvoicePaymentBalance.GetRemaining(invoice, txs));
    }

    [Fact]
    public void EnsureAmountDoesNotExceedRemaining_throws_when_over()
    {
        var invoice = new Invoice
        {
            TotalAmount = 20_000_000m,
            PaymentTransactions =
            [
                new PaymentTransaction { Amount = 8_000_000m, TransactionType = PaymentTransactionTypes.Payment },
            ],
        };

        var ex = Assert.Throws<InvalidOperationException>(() =>
            InvoicePaymentBalance.EnsureAmountDoesNotExceedRemaining(invoice, 13_000_000m));

        Assert.Contains("vượt số còn lại", ex.Message);
    }

    [Fact]
    public void EnsureAmountDoesNotExceedRemaining_allows_exact_remaining()
    {
        var invoice = new Invoice
        {
            TotalAmount = 20_000_000m,
            PaymentTransactions =
            [
                new PaymentTransaction { Amount = 8_000_000m, TransactionType = PaymentTransactionTypes.Payment },
            ],
        };

        InvoicePaymentBalance.EnsureAmountDoesNotExceedRemaining(invoice, 12_000_000m);
    }

    [Fact]
    public void GetRemaining_zero_after_full_payment_and_refund()
    {
        var invoice = new Invoice { TotalAmount = 20_000_000m };
        var txs = new[]
        {
            new PaymentTransaction { Amount = 20_000_000m, TransactionType = PaymentTransactionTypes.Payment },
            new PaymentTransaction { Amount = 5_000_000m, TransactionType = PaymentTransactionTypes.Refund },
        };

        Assert.Equal(0m, InvoicePaymentBalance.GetRemaining(invoice, txs));
    }

    [Fact]
    public void ResolveInvoicePaymentStatus_stays_paid_after_refund()
    {
        var txs = new[]
        {
            new PaymentTransaction { Amount = 20_000_000m, TransactionType = PaymentTransactionTypes.Payment },
            new PaymentTransaction { Amount = 5_000_000m, TransactionType = PaymentTransactionTypes.Refund },
        };

        Assert.Equal(InvoiceStatuses.Paid, InvoicePaymentBalance.ResolveInvoicePaymentStatus(20_000_000m, txs));
    }

    [Fact]
    public void ResolveOrderPaymentStatus_stays_paid_after_refund()
    {
        Assert.Equal(
            PaymentStatuses.Paid,
            InvoicePaymentBalance.ResolveOrderPaymentStatus(20_000_000m, 20_000_000m));
    }
}
