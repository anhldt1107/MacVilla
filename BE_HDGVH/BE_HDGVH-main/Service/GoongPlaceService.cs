using System.Text.Json;
using BE_API.Configuration;
using BE_API.Dto.Store;
using BE_API.Service.IService;
using Microsoft.Extensions.Options;

namespace BE_API.Service;

public class GoongPlaceService(IHttpClientFactory httpFactory, IOptions<GoongOptions> options) : IGoongPlaceService
{
    public const string HttpClientName = "goong";

    private readonly GoongOptions _options = options.Value;

    public async Task<GoongAutocompleteResultDto> AutocompleteAsync(
        string input,
        string? location,
        int? limit,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(_options.ApiKey))
            throw new InvalidOperationException("Chưa cấu hình Goong API key.");

        var trimmed = input.Trim();
        if (trimmed.Length < 3)
            throw new ArgumentException("Từ khóa tìm kiếm phải có ít nhất 3 ký tự.");

        var effectiveLimit = limit is > 0 and <= 10 ? limit.Value : _options.DefaultLimit;
        if (effectiveLimit < 1) effectiveLimit = 5;
        if (effectiveLimit > 10) effectiveLimit = 10;

        var effectiveLocation = string.IsNullOrWhiteSpace(location)
            ? _options.DefaultLocation.Trim()
            : location.Trim();

        var query = new Dictionary<string, string?>
        {
            ["input"] = trimmed,
            ["api_key"] = _options.ApiKey,
            ["limit"] = effectiveLimit.ToString(),
            ["more_compound"] = _options.MoreCompound ? "true" : "false",
            ["has_deprecated_administrative_unit"] = "false",
        };

        if (!string.IsNullOrWhiteSpace(effectiveLocation))
            query["location"] = effectiveLocation;

        var baseUrl = _options.BaseUrl.TrimEnd('/');
        var qs = string.Join("&", query
            .Where(kv => !string.IsNullOrEmpty(kv.Value))
            .Select(kv => $"{Uri.EscapeDataString(kv.Key)}={Uri.EscapeDataString(kv.Value!)}"));
        var url = $"{baseUrl}/v2/place/autocomplete?{qs}";

        var http = httpFactory.CreateClient(HttpClientName);
        using var response = await http.GetAsync(url, cancellationToken);
        var raw = await response.Content.ReadAsStringAsync(cancellationToken);

        if (!response.IsSuccessStatusCode)
        {
            throw new HttpRequestException(
                $"Goong autocomplete thất bại ({(int)response.StatusCode}): {Truncate(raw, 400)}");
        }

        return ParseResponse(raw);
    }

    private static GoongAutocompleteResultDto ParseResponse(string raw)
    {
        using var doc = JsonDocument.Parse(raw);
        var root = doc.RootElement;

        if (root.TryGetProperty("status", out var statusEl))
        {
            var status = statusEl.GetString();
            if (!string.Equals(status, "OK", StringComparison.OrdinalIgnoreCase)
                && !string.Equals(status, "ZERO_RESULTS", StringComparison.OrdinalIgnoreCase))
            {
                var msg = root.TryGetProperty("error_message", out var err)
                    ? err.GetString()
                    : status;
                throw new HttpRequestException($"Goong trả về trạng thái không hợp lệ: {msg ?? status}");
            }
        }

        var result = new GoongAutocompleteResultDto();
        if (!root.TryGetProperty("predictions", out var predictions) || predictions.ValueKind != JsonValueKind.Array)
            return result;

        foreach (var p in predictions.EnumerateArray())
        {
            var description = GetString(p, "description") ?? string.Empty;
            var placeId = GetString(p, "place_id") ?? string.Empty;
            var mainText = string.Empty;
            var secondaryText = string.Empty;

            if (p.TryGetProperty("structured_formatting", out var sf) && sf.ValueKind == JsonValueKind.Object)
            {
                mainText = GetString(sf, "main_text") ?? string.Empty;
                secondaryText = GetString(sf, "secondary_text") ?? string.Empty;
            }

            GoongCompoundDto? compound = null;
            if (p.TryGetProperty("compound", out var comp) && comp.ValueKind == JsonValueKind.Object)
            {
                compound = new GoongCompoundDto
                {
                    Commune = GetString(comp, "commune"),
                    Province = GetString(comp, "province"),
                };
            }

            if (string.IsNullOrWhiteSpace(description) && string.IsNullOrWhiteSpace(mainText))
                continue;

            result.Predictions.Add(new GoongAutocompletePredictionDto
            {
                Description = description,
                PlaceId = placeId,
                MainText = string.IsNullOrWhiteSpace(mainText) ? description : mainText,
                SecondaryText = secondaryText,
                Compound = compound,
            });
        }

        return result;
    }

    private static string? GetString(JsonElement el, string name) =>
        el.TryGetProperty(name, out var prop) && prop.ValueKind == JsonValueKind.String
            ? prop.GetString()
            : null;

    private static string Truncate(string? s, int max) =>
        string.IsNullOrEmpty(s) || s.Length <= max ? s ?? string.Empty : s[..max] + "…";
}
