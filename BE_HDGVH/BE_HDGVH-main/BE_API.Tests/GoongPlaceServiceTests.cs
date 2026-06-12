using System.Net;
using BE_API.Configuration;
using BE_API.Service;
using Microsoft.Extensions.Options;
using Xunit;

namespace BE_API.Tests;

public class GoongPlaceServiceTests
{
    private const string SampleGoongJson = """
        {
          "predictions": [
            {
              "description": "298 Ngọc Lâm, Bồ Đề, Hà Nội",
              "place_id": "abc123",
              "structured_formatting": {
                "main_text": "298 Ngọc Lâm",
                "secondary_text": "Bồ Đề, Hà Nội"
              },
              "compound": {
                "commune": "Bồ Đề",
                "province": "Hà Nội"
              }
            }
          ],
          "status": "OK"
        }
        """;

    [Fact]
    public async Task AutocompleteAsync_ParsesPredictions_FromGoongResponse()
    {
        var handler = new StubHttpMessageHandler(_ =>
            new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent(SampleGoongJson),
            });

        var factory = new StubHttpClientFactory(handler);
        var service = new GoongPlaceService(factory, Microsoft.Extensions.Options.Options.Create(new GoongOptions
        {
            ApiKey = "test-key",
            BaseUrl = "https://rsapi.goong.io",
        }));

        var result = await service.AutocompleteAsync("298 ngoc lam", null, 5);

        Assert.Single(result.Predictions);
        var p = result.Predictions[0];
        Assert.Equal("298 Ngọc Lâm, Bồ Đề, Hà Nội", p.Description);
        Assert.Equal("abc123", p.PlaceId);
        Assert.Equal("298 Ngọc Lâm", p.MainText);
        Assert.Equal("Bồ Đề, Hà Nội", p.SecondaryText);
        Assert.NotNull(p.Compound);
        Assert.Equal("Bồ Đề", p.Compound!.Commune);
        Assert.Equal("Hà Nội", p.Compound.Province);
    }

    [Fact]
    public async Task AutocompleteAsync_Throws_WhenApiKeyMissing()
    {
        var factory = new StubHttpClientFactory(new StubHttpMessageHandler(_ => new HttpResponseMessage(HttpStatusCode.OK)));
        var service = new GoongPlaceService(factory, Microsoft.Extensions.Options.Options.Create(new GoongOptions { ApiKey = "" }));

        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            service.AutocompleteAsync("ha noi", null, null));
    }

    [Fact]
    public async Task AutocompleteAsync_Throws_WhenInputTooShort()
    {
        var factory = new StubHttpClientFactory(new StubHttpMessageHandler(_ => new HttpResponseMessage(HttpStatusCode.OK)));
        var service = new GoongPlaceService(factory, Microsoft.Extensions.Options.Options.Create(new GoongOptions { ApiKey = "k" }));

        await Assert.ThrowsAsync<ArgumentException>(() =>
            service.AutocompleteAsync("ab", null, null));
    }

    private sealed class StubHttpClientFactory(StubHttpMessageHandler handler) : IHttpClientFactory
    {
        public HttpClient CreateClient(string name) => new(handler, disposeHandler: false);
    }

    private sealed class StubHttpMessageHandler(Func<HttpRequestMessage, HttpResponseMessage> responder)
        : HttpMessageHandler
    {
        protected override Task<HttpResponseMessage> SendAsync(
            HttpRequestMessage request,
            CancellationToken cancellationToken) =>
            Task.FromResult(responder(request));
    }
}
