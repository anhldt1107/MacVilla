using BE_API.Domain;
using Xunit;

namespace BE_API.Tests;

public class AfterSalesQuantityRulesTests
{
    [Fact]
    public void ComputeReturnableQuantity_subtracts_returns_and_claims()
    {
        Assert.Equal(2, AfterSalesQuantityRules.ComputeReturnableQuantity(5, 2, 1));
    }

    [Fact]
    public void ComputeReturnableQuantity_never_negative()
    {
        Assert.Equal(0, AfterSalesQuantityRules.ComputeReturnableQuantity(3, 5, 2));
    }

    [Fact]
    public void ValidateReturnQuantity_throws_when_exceeds_available()
    {
        var ex = Assert.Throws<InvalidOperationException>(() =>
            AfterSalesQuantityRules.ValidateReturnQuantity(5, 3, 2, 1));
        Assert.Contains("còn 2", ex.Message);
    }

    [Fact]
    public void IsActiveWarrantyClaimStatus_excludes_terminal_states()
    {
        Assert.False(AfterSalesQuantityRules.IsActiveWarrantyClaimStatus(WarrantyClaimStatuses.Completed));
        Assert.True(AfterSalesQuantityRules.IsActiveWarrantyClaimStatus(WarrantyClaimStatuses.PendingCheck));
    }
}
