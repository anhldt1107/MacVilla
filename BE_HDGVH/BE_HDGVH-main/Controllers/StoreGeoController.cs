using BE_API.Configuration;
using BE_API.Dto.Common;
using BE_API.Service.IService;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using Swashbuckle.AspNetCore.Annotations;

namespace BE_API.Controllers;

[ApiController]
[Route("api/store/geo")]
[AllowAnonymous]
public class StoreGeoController(IGoongPlaceService goongPlace, IOptions<GoongOptions> options) : ControllerBase
{
    [HttpGet("autocomplete")]
    [SwaggerOperation(
        Summary = "Gợi ý địa chỉ Goong Autocomplete V2 (proxy — không lộ API key)",
        Description = "Query: input (bắt buộc, >=3 ký tự), location (lat,lng tùy chọn), limit (1–10).")]
    public async Task<IActionResult> Autocomplete(
        [FromQuery] string input,
        [FromQuery] string? location = null,
        [FromQuery] int? limit = null,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(input) || input.Trim().Length < 3)
        {
            return BadRequest(new ResponseDto
            {
                Success = false,
                Message = "Từ khóa tìm kiếm phải có ít nhất 3 ký tự.",
                ErrorCode = "VALIDATION_ERROR",
            });
        }

        if (string.IsNullOrWhiteSpace(options.Value.ApiKey))
        {
            return StatusCode(StatusCodes.Status503ServiceUnavailable, new ResponseDto
            {
                Success = false,
                Message = "Chưa cấu hình Goong API key.",
                ErrorCode = "GOONG_NOT_CONFIGURED",
            });
        }

        try
        {
            var data = await goongPlace.AutocompleteAsync(input, location, limit, cancellationToken);
            return Ok(new ResponseDto
            {
                Success = true,
                Data = data,
                Message = "Lấy gợi ý địa chỉ thành công",
            });
        }
        catch (HttpRequestException ex)
        {
            return StatusCode(StatusCodes.Status502BadGateway, new ResponseDto
            {
                Success = false,
                Message = ex.Message,
                ErrorCode = "GOONG_API_ERROR",
            });
        }
    }
}
