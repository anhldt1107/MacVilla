using BE_API.Authorization;
using BE_API.Dto.Common;
using BE_API.Dto.ProductVariant;
using BE_API.Service.IService;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Swashbuckle.AspNetCore.Annotations;

namespace BE_API.Controllers;

[ApiController]
[Route("api/admin/variants")]
[Authorize(Policy = Policies.WarehouseStaff)]
public class AdminVariantLookupController(IProductVariantService variantService) : ControllerBase
{
    [HttpGet]
    [SwaggerOperation(
        Summary = "Danh sách biến thể (toàn hệ thống, phân trang + lọc)",
        Description = "Query: productId, categoryId, productStatus, search, minRetailPrice, maxRetailPrice, minQuantityAvailable, maxQuantityAvailable, page, pageSize.")]
    public async Task<IActionResult> GetFiltered(
        [FromQuery] ProductVariantListFilterDto filter,
        CancellationToken cancellationToken = default)
    {
        var data = await variantService.GetFilteredPagedAsync(filter, cancellationToken);
        return Ok(new ResponseDto
        {
            Success = true,
            Data = data,
            Message = "Lấy danh sách biến thể thành công"
        });
    }

    /// <summary>SKU có thể chứa ký tự đặc biệt — client nên URL-encode (vd. %2F cho /).</summary>
    [HttpGet("by-sku/{**sku}")]
    [SwaggerOperation(Summary = "Tra cứu biến thể theo SKU (toàn hệ thống); dùng catch-all cho SKU có dấu /")]
    public async Task<IActionResult> GetBySku(string sku, CancellationToken cancellationToken = default)
    {
        var data = await variantService.GetBySkuAsync(sku, cancellationToken);
        if (data is null)
            throw new KeyNotFoundException("Không tìm thấy SKU");

        return Ok(new ResponseDto
        {
            Success = true,
            Data = data,
            Message = "Tra cứu SKU thành công"
        });
    }
}
