using BE_API.Service.Ai;

namespace BE_API.Service.IService;

public interface IGeminiClient
{
    Task<GeminiResponse> GenerateContentAsync(GeminiRequest request, CancellationToken cancellationToken = default);
}
