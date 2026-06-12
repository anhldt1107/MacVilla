using BE_API.Domain;
using BE_API.Entities;
using Xunit;

namespace BE_API.Tests;

public class WarrantyCoverageRulesTests
{
    [Fact]
    public void ResolveMonthsForProduct_defaults_to_12_when_zero()
    {
        Assert.Equal(12, WarrantyCoverageRules.ResolveMonthsForProduct(0));
    }

    [Fact]
    public void IsLineEligible_false_when_past_valid_until()
    {
        var line = new WarrantyTicketLine
        {
            ValidUntil = DateTime.UtcNow.AddDays(-1),
        };
        Assert.False(WarrantyCoverageRules.IsLineEligible(line, DateTime.UtcNow));
    }

    [Fact]
    public void ResolveLineForClaim_rejects_expired_line()
    {
        var ticket = ActiveTicketWithLine(orderItemId: 1, variantId: 10, validUntil: DateTime.UtcNow.AddDays(-1));
        Assert.Throws<InvalidOperationException>(() =>
            WarrantyCoverageRules.ResolveLineForClaim(ticket, 1, 10, DateTime.UtcNow));
    }

    [Fact]
    public void ResolveLineForClaim_accepts_eligible_line_by_order_item()
    {
        var ticket = ActiveTicketWithLine(orderItemId: 5, variantId: 10, validUntil: DateTime.UtcNow.AddMonths(6));
        var line = WarrantyCoverageRules.ResolveLineForClaim(ticket, 5, 10, DateTime.UtcNow);
        Assert.Equal(5, line.OrderItemId);
    }

    [Fact]
    public void ResolveLineForClaim_requires_order_item_when_multiple_same_variant()
    {
        var now = DateTime.UtcNow;
        var ticket = new WarrantyTicket { Status = WarrantyTicketStatuses.Active, Lines = [] };
        ticket.Lines.Add(new WarrantyTicketLine
        {
            OrderItemId = 1, VariantId = 99, ValidUntil = now.AddMonths(6), WarrantyTicketId = 1
        });
        ticket.Lines.Add(new WarrantyTicketLine
        {
            OrderItemId = 2, VariantId = 99, ValidUntil = now.AddMonths(6), WarrantyTicketId = 1
        });

        Assert.Throws<ArgumentException>(() =>
            WarrantyCoverageRules.ResolveLineForClaim(ticket, null, 99, now));
    }

    [Fact]
    public void EnsureNoActiveClaimForOrderItem_throws_when_pending_claim_exists()
    {
        var claims = new[]
        {
            new WarrantyClaim { Id = 42, OrderItemId = 5, Status = WarrantyClaimStatuses.PendingCheck },
        };

        var ex = Assert.Throws<InvalidOperationException>(() =>
            WarrantyCoverageRules.EnsureNoActiveClaimForOrderItem(claims, 5));

        Assert.Contains("42", ex.Message);
    }

    [Fact]
    public void EnsureNoActiveClaimForOrderItem_allows_after_claim_completed()
    {
        var claims = new[]
        {
            new WarrantyClaim { Id = 10, OrderItemId = 5, Status = WarrantyClaimStatuses.Completed },
        };

        WarrantyCoverageRules.EnsureNoActiveClaimForOrderItem(claims, 5);
    }

    [Fact]
    public void FindActiveClaimId_returns_null_when_no_active_claim()
    {
        Assert.Null(WarrantyCoverageRules.FindActiveClaimId([], 1));
    }

    private static WarrantyTicket ActiveTicketWithLine(int orderItemId, int variantId, DateTime validUntil)
    {
        var ticket = new WarrantyTicket
        {
            Id = 1,
            Status = WarrantyTicketStatuses.Active,
            Lines = []
        };
        ticket.Lines.Add(new WarrantyTicketLine
        {
            WarrantyTicketId = 1,
            OrderItemId = orderItemId,
            VariantId = variantId,
            ValidUntil = validUntil,
        });
        return ticket;
    }
}
