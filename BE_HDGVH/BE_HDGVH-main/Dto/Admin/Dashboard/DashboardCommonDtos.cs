namespace BE_API.Dto.Admin.Dashboard;

/// <summary>Một điểm trong chuỗi thời gian (line/area/stacked).</summary>
public class TimeseriesPointDto
{
    public string Bucket { get; set; } = string.Empty;
    public decimal? InAmount { get; set; }
    public decimal? OutAmount { get; set; }
    public decimal? Net { get; set; }
}

/// <summary>Bucket dạng nhãn-giá trị (donut/pie/bar) dùng cho amount.</summary>
public class AmountBucketDto
{
    public string Label { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public decimal Share { get; set; }
}

/// <summary>Bucket dạng nhãn-đếm (donut/pie/bar) dùng cho count.</summary>
public class CountBucketDto
{
    public string Label { get; set; } = string.Empty;
    public int Count { get; set; }
    public decimal Share { get; set; }
}

/// <summary>Granularity hợp lệ cho timeseries.</summary>
public static class DashboardGranularities
{
    public const string Day = "day";
    public const string Week = "week";
    public const string Month = "month";

    public static readonly string[] All = [Day, Week, Month];

    public static string Normalize(string? value)
    {
        if (string.IsNullOrWhiteSpace(value)) return Day;
        var lower = value.Trim().ToLowerInvariant();
        return All.Contains(lower) ? lower : Day;
    }
}
