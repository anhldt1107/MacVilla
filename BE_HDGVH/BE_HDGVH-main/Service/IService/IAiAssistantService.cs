using BE_API.Dto.Ai;
using BE_API.Dto.Common;
using BE_API.Service.Ai;

namespace BE_API.Service.IService;

public interface IAiAssistantService
{
    Task<AiChatResponseDto> ChatAsync(AiChatRequestDto request, AiCallerContext caller, CancellationToken cancellationToken = default);

    Task<PagedResultDto<AiThreadListItemDto>> ListThreadsAsync(AiCallerContext caller, int page, int pageSize, CancellationToken cancellationToken = default);

    Task<List<AiMessageDto>> GetThreadMessagesAsync(int threadId, AiCallerContext caller, CancellationToken cancellationToken = default);

    Task DeleteThreadAsync(int threadId, AiCallerContext caller, CancellationToken cancellationToken = default);
}
