namespace BE_API.Domain;

/// <summary>Chuyển đổi thời điểm UTC (lưu DB) sang giờ Việt Nam (UTC+7) cho API response.</summary>
public static class VietnamTime
{
    private static readonly TimeZoneInfo Tz = ResolveTimeZone();

    private static TimeZoneInfo ResolveTimeZone()
    {
        try
        {
            return TimeZoneInfo.FindSystemTimeZoneById("Asia/Ho_Chi_Minh");
        }
        catch (TimeZoneNotFoundException)
        {
            return TimeZoneInfo.FindSystemTimeZoneById("SE Asia Standard Time");
        }
    }

    /// <summary>UTC (hoặc Unspecified coi như UTC) → <see cref="DateTimeOffset"/> +07:00.</summary>
    public static DateTimeOffset ToOffset(DateTime value)
    {
        var utc = value.Kind switch
        {
            DateTimeKind.Utc => value,
            DateTimeKind.Local => value.ToUniversalTime(),
            _ => DateTime.SpecifyKind(value, DateTimeKind.Utc)
        };

        var local = TimeZoneInfo.ConvertTimeFromUtc(utc, Tz);
        return new DateTimeOffset(local, TimeSpan.FromHours(7));
    }

    public static DateTimeOffset? ToOffset(DateTime? value)
        => value.HasValue ? ToOffset(value.Value) : null;
}
