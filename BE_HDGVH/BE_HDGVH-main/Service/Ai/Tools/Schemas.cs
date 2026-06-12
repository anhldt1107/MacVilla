using System.Text.Json.Nodes;

namespace BE_API.Service.Ai.Tools;

/// <summary>
/// Tập schema dùng chung cho tham số tool. Giữ JSON Schema đơn giản (Gemini chỉ cần type/description).
/// </summary>
public static class Schemas
{
    public static JsonObject Empty() => new()
    {
        ["type"] = "object",
        ["properties"] = new JsonObject()
    };

    public static JsonObject DateRange()
    {
        return new JsonObject
        {
            ["type"] = "object",
            ["properties"] = new JsonObject
            {
                ["fromDate"] = new JsonObject { ["type"] = "string", ["description"] = "ISO date YYYY-MM-DD; optional, mặc định 30 ngày gần nhất" },
                ["toDate"] = new JsonObject { ["type"] = "string", ["description"] = "ISO date YYYY-MM-DD; optional" }
            }
        };
    }

    public static JsonObject DateRangeWithGranularity()
    {
        var props = new JsonObject
        {
            ["fromDate"] = new JsonObject { ["type"] = "string", ["description"] = "ISO date YYYY-MM-DD; optional" },
            ["toDate"] = new JsonObject { ["type"] = "string", ["description"] = "ISO date YYYY-MM-DD; optional" },
            ["granularity"] = new JsonObject { ["type"] = "string", ["description"] = "day | week | month" }
        };
        return new JsonObject { ["type"] = "object", ["properties"] = props };
    }

    public static JsonObject IntParam(string name, string description)
    {
        return new JsonObject
        {
            ["type"] = "object",
            ["properties"] = new JsonObject
            {
                [name] = new JsonObject { ["type"] = "integer", ["description"] = description }
            }
        };
    }

    public static JsonObject WithExtra(JsonObject schema, params (string name, string type, string description, bool required)[] extras)
    {
        var props = (JsonObject)schema["properties"]!;
        var requiredArr = schema["required"] as JsonArray ?? new JsonArray();
        foreach (var (name, type, description, required) in extras)
        {
            props[name] = new JsonObject { ["type"] = type, ["description"] = description };
            if (required && !requiredArr.Any(x => x?.GetValue<string>() == name))
                requiredArr.Add(name);
        }
        if (requiredArr.Count > 0) schema["required"] = requiredArr;
        return schema;
    }
}
