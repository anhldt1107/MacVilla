using System.Diagnostics;
using System.Text.Json;
using System.Text.Json.Nodes;
using BE_API.Configuration;
using BE_API.Database;
using BE_API.Dto.Ai;
using BE_API.Dto.Common;
using BE_API.Entities;
using BE_API.Service.IService;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace BE_API.Service.Ai;

public class AiAssistantService(
    BeContext db,
    IGeminiClient gemini,
    IAiToolRegistry registry,
    IPiiRedactor redactor,
    IOptions<GeminiOptions> options) : IAiAssistantService
{
    private readonly GeminiOptions _options = options.Value;

    public async Task<AiChatResponseDto> ChatAsync(
        AiChatRequestDto request,
        AiCallerContext caller,
        CancellationToken cancellationToken = default)
    {
        if (caller.Role == AiActorScope.None)
            throw new UnauthorizedAccessException("Role không hợp lệ.");

        var totalSw = Stopwatch.StartNew();

        var thread = await EnsureThreadAsync(request.ThreadId, request.Message, caller, cancellationToken);

        var nowUtc = DateTime.UtcNow;
        var userMessage = new AiChatMessage
        {
            ThreadId = thread.Id,
            MessageRole = "user",
            Content = request.Message,
            CreatedAt = nowUtc
        };
        db.AiChatMessages.Add(userMessage);
        thread.UpdatedAt = nowUtc;
        await db.SaveChangesAsync(cancellationToken);

        var historyMessages = await LoadHistoryAsync(thread.Id, cancellationToken);

        var systemPrompt = SystemPrompts.For(caller, _options.StrictTopicBoundaryStorefront);
        var declarations = registry.BuildFunctionDeclarations(caller.Role);

        var toolsUsed = new List<AiToolUsageDto>();
        var collectedAttachments = new List<Dto.Ai.AiAttachmentDto>();
        int? totalIn = 0;
        int? totalOut = 0;
        AiChatMessage? finalAssistant = null;

        for (var iteration = 0; iteration < _options.MaxIterations; iteration++)
        {
            var geminiRequest = new GeminiRequest
            {
                SystemInstruction = systemPrompt,
                Messages = historyMessages,
                FunctionDeclarations = declarations
            };

            var iterSw = Stopwatch.StartNew();
            var response = await gemini.GenerateContentAsync(geminiRequest, cancellationToken);
            iterSw.Stop();

            totalIn += response.PromptTokens;
            totalOut += response.CompletionTokens;

            // Tool call
            if (!string.IsNullOrEmpty(response.FunctionCallName))
            {
                var args = response.FunctionCallArgs ?? new JsonObject();
                var assistantToolMsg = new AiChatMessage
                {
                    ThreadId = thread.Id,
                    MessageRole = "assistant",
                    ToolName = response.FunctionCallName,
                    ToolArgsJson = args.ToJsonString(),
                    TokensIn = response.PromptTokens,
                    TokensOut = response.CompletionTokens,
                    LatencyMs = (int)iterSw.ElapsedMilliseconds,
                    CreatedAt = DateTime.UtcNow
                };
                db.AiChatMessages.Add(assistantToolMsg);

                historyMessages.Add(new GeminiContentMessage
                {
                    Role = "model",
                    FunctionName = response.FunctionCallName,
                    FunctionArgs = args.DeepClone().AsObject()
                });

                var toolSw = Stopwatch.StartNew();
                var (toolResult, toolError) = await ExecuteToolSafeAsync(response.FunctionCallName, args, caller, cancellationToken);
                toolSw.Stop();

                if (toolResult.Attachments is { Count: > 0 })
                {
                    collectedAttachments.AddRange(toolResult.Attachments);
                }

                var redactedResult = caller.OwnerType == "Customer" ? redactor.Redact(toolResult.Data, caller) : toolResult.Data;

                var toolMsg = new AiChatMessage
                {
                    ThreadId = thread.Id,
                    MessageRole = "tool",
                    ToolName = response.FunctionCallName,
                    ToolResultJson = redactedResult.ToJsonString(),
                    LatencyMs = (int)toolSw.ElapsedMilliseconds,
                    CreatedAt = DateTime.UtcNow
                };
                db.AiChatMessages.Add(toolMsg);

                historyMessages.Add(new GeminiContentMessage
                {
                    Role = "function",
                    FunctionName = response.FunctionCallName,
                    FunctionResponse = redactedResult.DeepClone().AsObject()
                });

                toolsUsed.Add(new AiToolUsageDto
                {
                    ToolName = response.FunctionCallName,
                    LatencyMs = (int)toolSw.ElapsedMilliseconds,
                    Success = toolError is null,
                    Error = toolError
                });

                await db.SaveChangesAsync(cancellationToken);
                continue;
            }

            // Final text
            var finalText = response.Text ?? string.Empty;
            finalAssistant = new AiChatMessage
            {
                ThreadId = thread.Id,
                MessageRole = "assistant",
                Content = finalText,
                TokensIn = response.PromptTokens,
                TokensOut = response.CompletionTokens,
                LatencyMs = (int)iterSw.ElapsedMilliseconds,
                CreatedAt = DateTime.UtcNow
            };
            db.AiChatMessages.Add(finalAssistant);
            thread.UpdatedAt = finalAssistant.CreatedAt;
            await db.SaveChangesAsync(cancellationToken);
            break;
        }

        if (finalAssistant is null)
        {
            // Vượt MaxIterations mà vẫn chưa có text — trả thông báo dự phòng và lưu lại.
            finalAssistant = new AiChatMessage
            {
                ThreadId = thread.Id,
                MessageRole = "assistant",
                Content = "Mình chưa hoàn tất do gọi quá nhiều lần dữ liệu. Bạn vui lòng hỏi cụ thể hơn để mình trả lời gọn nhé.",
                CreatedAt = DateTime.UtcNow
            };
            db.AiChatMessages.Add(finalAssistant);
            thread.UpdatedAt = finalAssistant.CreatedAt;
            await db.SaveChangesAsync(cancellationToken);
        }

        totalSw.Stop();

        return new AiChatResponseDto
        {
            ThreadId = thread.Id,
            AssistantMessage = finalAssistant.Content ?? string.Empty,
            ToolsUsed = toolsUsed,
            Attachments = DedupAttachments(collectedAttachments),
            TokensIn = totalIn,
            TokensOut = totalOut,
            LatencyMs = (int)totalSw.ElapsedMilliseconds
        };
    }

    private static List<Dto.Ai.AiAttachmentDto> DedupAttachments(List<Dto.Ai.AiAttachmentDto> input)
    {
        if (input.Count <= 1) return input;
        var seen = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        var result = new List<Dto.Ai.AiAttachmentDto>(input.Count);
        foreach (var att in input)
        {
            var key = $"{att.Type}|{att.Link}|{att.Title}";
            if (seen.Add(key)) result.Add(att);
        }
        return result;
    }

    public async Task<PagedResultDto<AiThreadListItemDto>> ListThreadsAsync(
        AiCallerContext caller,
        int page,
        int pageSize,
        CancellationToken cancellationToken = default)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 100);

        var query = db.AiChatThreads.AsNoTracking()
            .Where(t => t.OwnerType == caller.OwnerType && t.OwnerId == caller.OwnerId)
            .OrderByDescending(t => t.UpdatedAt);

        var total = await query.CountAsync(cancellationToken);

        var items = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(t => new AiThreadListItemDto
            {
                Id = t.Id,
                Role = t.Role,
                Title = t.Title,
                CreatedAt = t.CreatedAt,
                UpdatedAt = t.UpdatedAt,
                MessageCount = t.Messages.Count,
                LastMessagePreview = t.Messages
                    .Where(m => m.MessageRole == "assistant" || m.MessageRole == "user")
                    .OrderByDescending(m => m.Id)
                    .Select(m => m.Content)
                    .FirstOrDefault()
            })
            .ToListAsync(cancellationToken);

        return new PagedResultDto<AiThreadListItemDto>
        {
            Items = items,
            TotalCount = total,
            Page = page,
            PageSize = pageSize
        };
    }

    public async Task<List<AiMessageDto>> GetThreadMessagesAsync(
        int threadId,
        AiCallerContext caller,
        CancellationToken cancellationToken = default)
    {
        await EnsureThreadOwnedByCallerAsync(threadId, caller, cancellationToken);

        var messages = await db.AiChatMessages.AsNoTracking()
            .Where(m => m.ThreadId == threadId)
            .OrderBy(m => m.Id)
            .Select(m => new AiMessageDto
            {
                Id = m.Id,
                MessageRole = m.MessageRole,
                Content = m.Content,
                ToolName = m.ToolName,
                ToolArgsJson = m.ToolArgsJson,
                ToolResultJson = m.ToolResultJson,
                CreatedAt = m.CreatedAt
            })
            .ToListAsync(cancellationToken);

        return messages;
    }

    public async Task DeleteThreadAsync(int threadId, AiCallerContext caller, CancellationToken cancellationToken = default)
    {
        var thread = await EnsureThreadOwnedByCallerAsync(threadId, caller, cancellationToken);
        db.AiChatThreads.Remove(thread);
        await db.SaveChangesAsync(cancellationToken);
    }

    private async Task<AiChatThread> EnsureThreadAsync(int? requestedId, string firstMessage, AiCallerContext caller, CancellationToken cancellationToken)
    {
        if (requestedId.HasValue)
        {
            return await EnsureThreadOwnedByCallerAsync(requestedId.Value, caller, cancellationToken);
        }

        var nowUtc = DateTime.UtcNow;
        var thread = new AiChatThread
        {
            OwnerType = caller.OwnerType,
            OwnerId = caller.OwnerId,
            Role = caller.RoleName,
            Title = MakeTitle(firstMessage),
            CreatedAt = nowUtc,
            UpdatedAt = nowUtc
        };
        db.AiChatThreads.Add(thread);
        await db.SaveChangesAsync(cancellationToken);
        return thread;
    }

    private async Task<AiChatThread> EnsureThreadOwnedByCallerAsync(int threadId, AiCallerContext caller, CancellationToken cancellationToken)
    {
        var thread = await db.AiChatThreads.FirstOrDefaultAsync(t => t.Id == threadId, cancellationToken)
            ?? throw new KeyNotFoundException("Không tìm thấy phiên chat.");
        if (thread.OwnerType != caller.OwnerType || thread.OwnerId != caller.OwnerId)
            throw new UnauthorizedAccessException("Phiên chat không thuộc về bạn.");
        return thread;
    }

    private async Task<List<GeminiContentMessage>> LoadHistoryAsync(int threadId, CancellationToken cancellationToken)
    {
        var window = Math.Max(4, _options.HistoryWindow);
        var raw = await db.AiChatMessages.AsNoTracking()
            .Where(m => m.ThreadId == threadId)
            .OrderByDescending(m => m.Id)
            .Take(window)
            .ToListAsync(cancellationToken);
        raw = raw.OrderBy(m => m.Id).ToList();

        var built = new List<GeminiContentMessage>();
        foreach (var m in raw)
        {
            switch (m.MessageRole)
            {
                case "user":
                    if (!string.IsNullOrEmpty(m.Content))
                        built.Add(new GeminiContentMessage { Role = "user", Text = m.Content });
                    break;
                case "assistant":
                    if (!string.IsNullOrEmpty(m.ToolName))
                    {
                        var args = string.IsNullOrEmpty(m.ToolArgsJson)
                            ? new JsonObject()
                            : JsonNode.Parse(m.ToolArgsJson)?.AsObject() ?? new JsonObject();
                        built.Add(new GeminiContentMessage { Role = "model", FunctionName = m.ToolName, FunctionArgs = args });
                    }
                    else if (!string.IsNullOrEmpty(m.Content))
                    {
                        built.Add(new GeminiContentMessage { Role = "model", Text = m.Content });
                    }
                    break;
                case "tool":
                    var resp = string.IsNullOrEmpty(m.ToolResultJson)
                        ? new JsonObject()
                        : JsonNode.Parse(m.ToolResultJson)?.AsObject() ?? new JsonObject();
                    built.Add(new GeminiContentMessage { Role = "function", FunctionName = m.ToolName ?? string.Empty, FunctionResponse = resp });
                    break;
            }
        }

        return SanitizeHistoryForGemini(built);
    }

    /// <summary>
    /// Đảm bảo chuỗi messages hợp lệ với Gemini:
    /// 1) Bắt đầu bằng "user" (drop tin đầu cho tới khi gặp user).
    /// 2) Mỗi "model functionCall" phải có "function functionResponse" cùng tên ngay sau; nếu không, loại cả 2.
    /// 3) "function" message lẻ (không có model call trước) bị loại.
    /// </summary>
    private static List<GeminiContentMessage> SanitizeHistoryForGemini(List<GeminiContentMessage> messages)
    {
        if (messages.Count == 0) return messages;

        var startIdx = messages.FindIndex(m => m.Role == "user");
        if (startIdx < 0) return new List<GeminiContentMessage>();
        if (startIdx > 0) messages = messages.GetRange(startIdx, messages.Count - startIdx);

        var result = new List<GeminiContentMessage>(messages.Count);
        for (var i = 0; i < messages.Count; i++)
        {
            var current = messages[i];

            if (current.Role == "model" && !string.IsNullOrEmpty(current.FunctionName) && current.FunctionArgs is not null)
            {
                var hasPairedResponse = i + 1 < messages.Count
                                        && messages[i + 1].Role == "function"
                                        && messages[i + 1].FunctionResponse is not null
                                        && string.Equals(messages[i + 1].FunctionName, current.FunctionName, StringComparison.OrdinalIgnoreCase);
                if (hasPairedResponse)
                {
                    result.Add(current);
                    result.Add(messages[i + 1]);
                    i++;
                }
                continue;
            }

            if (current.Role == "function")
            {
                continue;
            }

            result.Add(current);
        }

        return result;
    }

    private async Task<(AiToolResult Result, string? Error)> ExecuteToolSafeAsync(
        string toolName,
        JsonObject args,
        AiCallerContext caller,
        CancellationToken cancellationToken)
    {
        var tool = registry.GetTool(toolName, caller.Role);
        if (tool is null)
        {
            return (AiToolResult.FromData(AiJson.Error($"Tool '{toolName}' không tồn tại hoặc không được phép.", "TOOL_NOT_FOUND")), "TOOL_NOT_FOUND");
        }
        try
        {
            var result = await tool.ExecuteAsync(args, caller, cancellationToken);
            return (result, null);
        }
        catch (UnauthorizedAccessException ex)
        {
            return (AiToolResult.FromData(AiJson.Error(ex.Message, "FORBIDDEN")), "FORBIDDEN");
        }
        catch (KeyNotFoundException ex)
        {
            return (AiToolResult.FromData(AiJson.Error(ex.Message, "NOT_FOUND")), "NOT_FOUND");
        }
        catch (Exception ex)
        {
            return (AiToolResult.FromData(AiJson.Error("Tool gặp lỗi: " + ex.Message, "TOOL_ERROR")), "TOOL_ERROR");
        }
    }

    private static string MakeTitle(string firstMessage)
    {
        if (string.IsNullOrWhiteSpace(firstMessage)) return "Chat";
        var trimmed = firstMessage.Trim().Replace('\n', ' ').Replace('\r', ' ');
        return trimmed.Length <= 60 ? trimmed : trimmed[..60] + "...";
    }
}
