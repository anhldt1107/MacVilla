using BE_API.Domain;
using Xunit;

namespace BE_API.Tests;

public class VietnamTimeTests
{
    [Fact]
    public void ToOffset_converts_utc_to_vietnam_plus_seven()
    {
        var utc = new DateTime(2026, 6, 3, 10, 30, 0, DateTimeKind.Utc);
        var offset = VietnamTime.ToOffset(utc);

        Assert.Equal(TimeSpan.FromHours(7), offset.Offset);
        Assert.Equal(17, offset.Hour);
        Assert.Equal(30, offset.Minute);
    }

    [Fact]
    public void ToOffset_treats_unspecified_as_utc()
    {
        var stored = new DateTime(2026, 6, 3, 8, 0, 0, DateTimeKind.Unspecified);
        var offset = VietnamTime.ToOffset(stored);

        Assert.Equal(15, offset.Hour);
        Assert.Equal("+07:00", offset.ToString("zzz"));
    }
}
