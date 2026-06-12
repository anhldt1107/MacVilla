using System.Text.Json;
using System.Text.Json.Nodes;

namespace BE_API.Service.Ai;

/// <summary>Tiện ích serialize POCO -> JsonObject để bọc vào tool result.</summary>
public static class AiJson
{
    private static readonly JsonSerializerOptions SerializerOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        DefaultIgnoreCondition = System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull
    };

    public static JsonObject Wrap<T>(T data, string field = "data")
    {
        var node = JsonSerializer.SerializeToNode(data, SerializerOptions);
        var obj = new JsonObject();
        obj[field] = node;
        return obj;
    }

    public static JsonObject Error(string message, string? code = null)
    {
        var obj = new JsonObject { ["error"] = message };
        if (!string.IsNullOrEmpty(code)) obj["errorCode"] = code;
        return obj;
    }
}
