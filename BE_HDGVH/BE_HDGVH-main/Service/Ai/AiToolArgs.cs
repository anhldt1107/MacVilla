using System.Globalization;
using System.Text.Json.Nodes;

namespace BE_API.Service.Ai;

/// <summary>Helper đọc tham số từ JsonObject mà Gemini truyền vào (mọi field optional, model có thể bỏ sót).</summary>
public static class AiToolArgs
{
    public static int? GetInt(JsonObject? args, string key)
    {
        if (args is null) return null;
        if (!args.TryGetPropertyValue(key, out var node) || node is null) return null;
        if (node is JsonValue v)
        {
            if (v.TryGetValue<int>(out var i)) return i;
            if (v.TryGetValue<long>(out var l)) return (int)l;
            if (v.TryGetValue<double>(out var d)) return (int)d;
            if (v.TryGetValue<string>(out var s) && int.TryParse(s, NumberStyles.Integer, CultureInfo.InvariantCulture, out var si)) return si;
        }
        return null;
    }

    public static string? GetString(JsonObject? args, string key)
    {
        if (args is null) return null;
        if (!args.TryGetPropertyValue(key, out var node) || node is null) return null;
        if (node is JsonValue v && v.TryGetValue<string>(out var s)) return s;
        return node.ToString();
    }

    public static decimal? GetDecimal(JsonObject? args, string key)
    {
        if (args is null) return null;
        if (!args.TryGetPropertyValue(key, out var node) || node is null) return null;
        if (node is JsonValue v)
        {
            if (v.TryGetValue<decimal>(out var d)) return d;
            if (v.TryGetValue<double>(out var dd)) return (decimal)dd;
            if (v.TryGetValue<long>(out var l)) return l;
            if (v.TryGetValue<int>(out var i)) return i;
            if (v.TryGetValue<string>(out var s) && decimal.TryParse(s, NumberStyles.Number, CultureInfo.InvariantCulture, out var sd)) return sd;
        }
        return null;
    }

    public static DateTime? GetDate(JsonObject? args, string key)
    {
        var s = GetString(args, key);
        if (string.IsNullOrWhiteSpace(s)) return null;
        if (DateTime.TryParse(s, CultureInfo.InvariantCulture, DateTimeStyles.AssumeUniversal | DateTimeStyles.AdjustToUniversal, out var d))
            return d;
        return null;
    }
}
