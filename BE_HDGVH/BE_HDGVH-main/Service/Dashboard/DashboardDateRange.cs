using System.Globalization;

namespace BE_API.Service.Dashboard;

/// <summary>
/// Tiện ích chuẩn hóa khoảng thời gian cho các endpoint dashboard.
/// Mặc định 30 ngày gần nhất nếu không truyền (UTC).
/// </summary>
public static class DashboardDateRange
{
    public static (DateTime FromUtc, DateTime ToExclusiveUtc) Normalize(
        DateTime? from,
        DateTime? to,
        int defaultLastDays = 30)
    {
        var nowUtc = DateTime.UtcNow;
        DateTime fromUtc;
        DateTime toExclusiveUtc;

        if (to.HasValue)
        {
            toExclusiveUtc = DateTime.SpecifyKind(to.Value.Date, DateTimeKind.Utc).AddDays(1);
        }
        else
        {
            toExclusiveUtc = DateTime.SpecifyKind(nowUtc.Date, DateTimeKind.Utc).AddDays(1);
        }

        if (from.HasValue)
        {
            fromUtc = DateTime.SpecifyKind(from.Value.Date, DateTimeKind.Utc);
        }
        else
        {
            fromUtc = toExclusiveUtc.AddDays(-defaultLastDays);
        }

        if (fromUtc >= toExclusiveUtc)
        {
            fromUtc = toExclusiveUtc.AddDays(-1);
        }

        return (fromUtc, toExclusiveUtc);
    }

    /// <summary>Trả về key bucket (ISO date string) theo granularity.</summary>
    public static string ToBucketKey(DateTime utc, string granularity)
    {
        var d = utc.Date;
        return granularity switch
        {
            "month" => $"{d:yyyy-MM}",
            "week" => $"{ISOWeek.GetYear(d):D4}-W{ISOWeek.GetWeekOfYear(d):D2}",
            _ => d.ToString("yyyy-MM-dd"),
        };
    }

    /// <summary>Sinh chuỗi key buckets liên tục theo granularity giữa fromUtc..toExclusiveUtc.</summary>
    public static IEnumerable<string> EnumerateBucketKeys(
        DateTime fromUtc,
        DateTime toExclusiveUtc,
        string granularity)
    {
        var cursor = fromUtc.Date;
        var endExclusive = toExclusiveUtc.Date;

        switch (granularity)
        {
            case "month":
                cursor = new DateTime(cursor.Year, cursor.Month, 1, 0, 0, 0, DateTimeKind.Utc);
                while (cursor < endExclusive)
                {
                    yield return cursor.ToString("yyyy-MM");
                    cursor = cursor.AddMonths(1);
                }
                break;

            case "week":
                cursor = StartOfIsoWeek(cursor);
                while (cursor < endExclusive)
                {
                    yield return $"{ISOWeek.GetYear(cursor):D4}-W{ISOWeek.GetWeekOfYear(cursor):D2}";
                    cursor = cursor.AddDays(7);
                }
                break;

            default:
                while (cursor < endExclusive)
                {
                    yield return cursor.ToString("yyyy-MM-dd");
                    cursor = cursor.AddDays(1);
                }
                break;
        }
    }

    private static DateTime StartOfIsoWeek(DateTime d)
    {
        int diff = (7 + (int)d.DayOfWeek - (int)DayOfWeek.Monday) % 7;
        return d.AddDays(-diff).Date;
    }
}
