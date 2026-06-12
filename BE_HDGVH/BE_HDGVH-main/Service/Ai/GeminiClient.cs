using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Nodes;
using BE_API.Configuration;
using BE_API.Service.IService;
using Microsoft.Extensions.Options;

namespace BE_API.Service.Ai;

public class GeminiClient(IHttpClientFactory httpFactory, IOptions<GeminiOptions> options) : IGeminiClient
{
    public const string HttpClientName = "gemini";

    private readonly GeminiOptions _options = options.Value;

    public async Task<GeminiResponse> GenerateContentAsync(GeminiRequest request, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(_options.ApiKey))
            throw new InvalidOperationException("Chưa cấu hình GEMINI_API_KEY.");

        var http = httpFactory.CreateClient(HttpClientName);
        http.Timeout = TimeSpan.FromSeconds(Math.Max(5, _options.RequestTimeoutSeconds));

        var url = $"{_options.BaseUrl.TrimEnd('/')}/models/{_options.Model}:generateContent?key={_options.ApiKey}";
        var payload = BuildPayload(request);

        using var response = await http.PostAsJsonAsync(url, payload, cancellationToken);
        var raw = await response.Content.ReadAsStringAsync(cancellationToken);

        if (!response.IsSuccessStatusCode)
        {
            throw new InvalidOperationException(
                $"Gemini gọi thất bại ({(int)response.StatusCode}): {Truncate(raw, 800)}");
        }

        return ParseResponse(raw);
    }

    private static JsonObject BuildPayload(GeminiRequest request)
    {
        var payload = new JsonObject();

        if (!string.IsNullOrWhiteSpace(request.SystemInstruction))
        {
            payload["systemInstruction"] = new JsonObject
            {
                ["parts"] = new JsonArray { new JsonObject { ["text"] = request.SystemInstruction } }
            };
        }

        var contents = new JsonArray();
        foreach (var msg in request.Messages)
        {
            var parts = new JsonArray();

            if (!string.IsNullOrEmpty(msg.Text))
            {
                parts.Add(new JsonObject { ["text"] = msg.Text });
            }

            if (!string.IsNullOrEmpty(msg.FunctionName) && msg.FunctionArgs is not null)
            {
                parts.Add(new JsonObject
                {
                    ["functionCall"] = new JsonObject
                    {
                        ["name"] = msg.FunctionName,
                        ["args"] = msg.FunctionArgs.DeepClone()
                    }
                });
            }

            if (!string.IsNullOrEmpty(msg.FunctionName) && msg.FunctionResponse is not null)
            {
                parts.Add(new JsonObject
                {
                    ["functionResponse"] = new JsonObject
                    {
                        ["name"] = msg.FunctionName,
                        ["response"] = msg.FunctionResponse.DeepClone()
                    }
                });
            }

            if (parts.Count == 0) continue;

            contents.Add(new JsonObject
            {
                ["role"] = msg.Role,
                ["parts"] = parts
            });
        }
        payload["contents"] = contents;

        if (request.FunctionDeclarations.Count > 0)
        {
            var declarations = new JsonArray();
            foreach (var fd in request.FunctionDeclarations)
            {
                declarations.Add(fd.DeepClone());
            }
            payload["tools"] = new JsonArray
            {
                new JsonObject { ["functionDeclarations"] = declarations }
            };
        }

        return payload;
    }

    private static GeminiResponse ParseResponse(string raw)
    {
        var root = JsonNode.Parse(raw)?.AsObject()
            ?? throw new InvalidOperationException("Gemini trả response rỗng.");

        var result = new GeminiResponse { RawJson = raw };

        if (root["usageMetadata"] is JsonObject usage)
        {
            if (usage["promptTokenCount"] is JsonValue pIn && pIn.TryGetValue<int>(out var pi)) result.PromptTokens = pi;
            if (usage["candidatesTokenCount"] is JsonValue cOut && cOut.TryGetValue<int>(out var co)) result.CompletionTokens = co;
        }

        if (root["candidates"] is not JsonArray candidates || candidates.Count == 0)
        {
            return result;
        }

        var first = candidates[0]?.AsObject();
        var content = first? ["content"]?.AsObject();
        if (content?["parts"] is not JsonArray parts) return result;

        var collectedText = new System.Text.StringBuilder();
        foreach (var part in parts)
        {
            if (part is not JsonObject p) continue;

            if (p["functionCall"] is JsonObject fc)
            {
                result.FunctionCallName = fc["name"]?.GetValue<string>();
                if (fc["args"] is JsonObject argsObj)
                {
                    result.FunctionCallArgs = argsObj.DeepClone().AsObject();
                }
                else
                {
                    result.FunctionCallArgs = new JsonObject();
                }
                return result;
            }

            if (p["text"] is JsonValue t && t.TryGetValue<string>(out var s))
            {
                if (collectedText.Length > 0) collectedText.AppendLine();
                collectedText.Append(s);
            }
        }

        result.Text = collectedText.Length > 0 ? collectedText.ToString() : null;
        return result;
    }

    private static string Truncate(string s, int max)
        => string.IsNullOrEmpty(s) ? string.Empty : (s.Length <= max ? s : s[..max] + "...");
}
