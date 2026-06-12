using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using BE_API.Authorization;
using BE_API.Dto.Ai;
using BE_API.Dto.Common;
using BE_API.Service.Ai;
using BE_API.Service.IService;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Swashbuckle.AspNetCore.Annotations;

namespace BE_API.Controllers;

[ApiController]
[Route("api/admin/ai")]
[Authorize(Policy = Policies.StaffAuthenticated)]
public class AdminAiChatController(IAiAssistantService assistant) : ControllerBase
{
    [HttpPost("chat")]
    [SwaggerOperation(Summary = "Gửi tin nhắn cho trợ lý Gemini (Admin/Manager/Sales). Truyền threadId để tiếp tục phiên cũ.")]
    public async Task<IActionResult> Chat([FromBody] AiChatRequestDto dto, CancellationToken cancellationToken = default)
    {
        var caller = BuildCaller();
        var data = await assistant.ChatAsync(dto, caller, cancellationToken);
        return Ok(new ResponseDto { Success = true, Data = data, Message = "OK" });
    }

    [HttpGet("threads")]
    [SwaggerOperation(Summary = "Danh sách phiên chat AI của user staff hiện tại")]
    public async Task<IActionResult> ListThreads(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        var caller = BuildCaller();
        var data = await assistant.ListThreadsAsync(caller, page, pageSize, cancellationToken);
        return Ok(new ResponseDto { Success = true, Data = data, Message = "OK" });
    }

    [HttpGet("threads/{id:int}/messages")]
    [SwaggerOperation(Summary = "Lấy toàn bộ tin nhắn của 1 phiên (theo thứ tự thời gian)")]
    public async Task<IActionResult> GetMessages(int id, CancellationToken cancellationToken = default)
    {
        var caller = BuildCaller();
        var data = await assistant.GetThreadMessagesAsync(id, caller, cancellationToken);
        return Ok(new ResponseDto { Success = true, Data = data, Message = "OK" });
    }

    [HttpDelete("threads/{id:int}")]
    [SwaggerOperation(Summary = "Xóa một phiên chat (cùng toàn bộ message)")]
    public async Task<IActionResult> DeleteThread(int id, CancellationToken cancellationToken = default)
    {
        var caller = BuildCaller();
        await assistant.DeleteThreadAsync(id, caller, cancellationToken);
        return Ok(new ResponseDto { Success = true, Message = "Đã xóa phiên chat." });
    }

    private AiCallerContext BuildCaller()
    {
        var sub = User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value
                  ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!int.TryParse(sub, out var userId) || userId <= 0)
            throw new UnauthorizedAccessException("Không xác định được user.");

        var role = User.FindFirst(JwtClaimTypes.Role)?.Value ?? string.Empty;
        var displayName = User.FindFirst(JwtClaimTypes.FullName)?.Value;
        return AiCallerContext.ForStaff(userId, role, displayName);
    }
}
