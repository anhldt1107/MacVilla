using BE_API.Dto.Common;
using BE_API.Service.IService;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Swashbuckle.AspNetCore.Annotations;

namespace BE_API.Controllers;

[ApiController]
[Route("api/store/variants")]
[AllowAnonymous]
public class StoreVariantLookupController(IStoreCatalogService storeCatalog) : ControllerBase
{
    /// <summary>SKU có thể chứa ký tự đặc biệt — client nên URL-encode. Chỉ trả khi sản phẩm Active.</summary>
    [HttpGet("by-sku/{**sku}")]
    [SwaggerOperation(Summary = "Tra cứu biến thể theo SKU (công khai, không giá vốn)")]
    public async Task<IActionResult> GetBySku(string sku, CancellationToken cancellationToken = default)
    {
        var data = await storeCatalog.GetVariantBySkuAsync(sku, cancellationToken);
        if (data is null)
            throw new KeyNotFoundException("Không tìm thấy SKU hoặc sản phẩm không hiển thị");

        return Ok(new ResponseDto
        {
            Success = true,
            Data = data,
            Message = "Tra cứu SKU thành công"
        });
    }
}
