using System.Text.Json;
using System.Text.Json.Nodes;
using Microsoft.Extensions.Hosting;

namespace BE_API.Service.Ai.Tools;

/// <summary>Nội dung “chính sách cửa hàng” đã được kiểm duyệt (file Content/Ai/store_policies.vi.json).</summary>
public class GetStorePolicyTool(IHostEnvironment env) : IAiTool
{
    private static readonly JsonSerializerOptions JsonOpts =
        new() { PropertyNameCaseInsensitive = true, ReadCommentHandling = JsonCommentHandling.Skip };

    private const string AllowedTopicsHint =
        "topics: general, brands, shipping, payment, installation, returns, warranty_general, installment, promotions_notice, synonyms_customer_language.";

    public string Name => "get_store_policy";

    public string Description =>
        $"Nội dung chính sách và FAQ cửa hàng MacVilla (file cố định). Ưu tiên gọi khi hỏi đại lý/thương hiệu, giao nhận, thanh toán, lắp đặt, đổi trả, bảo hành chung, trả góp, KM. {AllowedTopicsHint}";

    public AiActorScope Scope => AiActorScope.B2C | AiActorScope.B2B;

    public JsonObject ParametersSchema => new()
    {
        ["type"] = "object",
        ["properties"] = new JsonObject
        {
            ["topic"] = new JsonObject
            {
                ["type"] = "string",
                ["description"] = AllowedTopicsHint
            }
        },
        ["required"] = new JsonArray { "topic" }
    };

    public async Task<AiToolResult> ExecuteAsync(JsonObject args, AiCallerContext caller, CancellationToken cancellationToken)
    {
        var topicRaw = (AiToolArgs.GetString(args, "topic") ?? "").Trim();
        if (string.IsNullOrEmpty(topicRaw))
            return AiToolResult.FromData(AiJson.Error("Thiếu topic.", "VALIDATION_ERROR"));

        var path = ResolvePath();
        if (!File.Exists(path))
            return AiToolResult.FromData(
                AiJson.Error("Chưa cấu hình file chính sách cửa hàng (Content/Ai/store_policies.vi.json).",
                    "CONFIG_ERROR"));

        string jsonRaw;
        try
        {
            jsonRaw = await File.ReadAllTextAsync(path, cancellationToken);
        }
        catch (Exception ex)
        {
            return AiToolResult.FromData(
                AiJson.Error("Không đọc được nội dung chính sách: " + ex.Message, "IO_ERROR"));
        }

        Dictionary<string, string>? map;
        try
        {
            map = JsonSerializer.Deserialize<Dictionary<string, string>>(jsonRaw, JsonOpts);
        }
        catch (JsonException jx)
        {
            return AiToolResult.FromData(
                AiJson.Error("File chính sách không hợp lệ JSON: " + jx.Message, "PARSE_ERROR"));
        }

        if (map is null || map.Count == 0)
            return AiToolResult.FromData(AiJson.Error("Nội dung chính sách trống.", "EMPTY"));

        var keyLookup = topicRaw.ToLowerInvariant();
        string resolved;
        string text;

        if (map.TryGetValue(keyLookup, out var chosen) && !string.IsNullOrWhiteSpace(chosen))
        {
            resolved = keyLookup;
            text = chosen.Trim();
        }
        else if (map.TryGetValue("general", out var general) && !string.IsNullOrWhiteSpace(general))
        {
            resolved = "general";
            text = general.Trim();
        }
        else
        {
            var first = map.Values.FirstOrDefault(v => !string.IsNullOrWhiteSpace(v));
            resolved = "_concat";
            text = string.IsNullOrEmpty(first)
                ? string.Empty
                : string.Join("\n\n", map.Values.Where(v => !string.IsNullOrWhiteSpace(v)));
        }

        var data = new JsonObject
        {
            ["topicRequested"] = topicRaw,
            ["topicResolved"] = resolved,
            ["fallbackUsed"] =
                resolved is "general" && !string.Equals(keyLookup, "general", StringComparison.Ordinal)
                    || resolved == "_concat",
            ["policyText"] = text,
            ["topicsAvailable"] =
                JsonSerializer.SerializeToNode(map.Keys.Order(StringComparer.Ordinal).ToArray())
                ?? new JsonArray()
        };

        return AiToolResult.FromData(AiJson.Wrap(data));
    }

    private string ResolvePath()
    {
        var relative = Path.Combine("Content", "Ai", "store_policies.vi.json");
        if (!string.IsNullOrEmpty(env.ContentRootPath))
        {
            var atRoot = Path.Combine(env.ContentRootPath, relative);
            if (File.Exists(atRoot))
                return atRoot;
        }

        return Path.Combine(AppContext.BaseDirectory, relative);
    }
}
