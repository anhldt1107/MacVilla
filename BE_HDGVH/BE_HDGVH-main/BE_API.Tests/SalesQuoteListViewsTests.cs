using BE_API.Domain;
using Xunit;

namespace BE_API.Tests;

public class SalesQuoteListViewsTests
{
    [Theory]
    [InlineData(null, SalesQuoteListViews.Mine)]
    [InlineData("", SalesQuoteListViews.Mine)]
    [InlineData("mine", SalesQuoteListViews.Mine)]
    [InlineData("QUEUE", SalesQuoteListViews.Queue)]
    [InlineData("all", SalesQuoteListViews.All)]
    [InlineData("invalid", SalesQuoteListViews.Mine)]
    public void Normalize_maps_view_tokens(string? input, string expected)
    {
        Assert.Equal(expected, SalesQuoteListViews.Normalize(input));
    }
}
