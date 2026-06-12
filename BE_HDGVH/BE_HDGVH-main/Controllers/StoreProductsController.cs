using BE_API.Dto.Common;
using BE_API.Service.IService;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Swashbuckle.AspNetCore.Annotations;

namespace BE_API.Controllers;

[ApiController]
[Route("api/store/products")]
[AllowAnonymous]
public class StoreProductsController(IStoreCatalogService storeCatalog) : ControllerBase
{
    /// <summary>Parse <c>attributeValueIds</c>: danh sách id cách bởi dấu phẩy (vd. <c>12,34</c>). Bỏ qua token không hợp lệ.</summary>
    private static IReadOnlyList<int>? ParseAttributeValueIds(string? csv)
    {
        if (string.IsNullOrWhiteSpace(csv))
            return null;

        var list = new List<int>();
        foreach (var part in csv.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries))
            if (int.TryParse(part, System.Globalization.NumberStyles.Integer, System.Globalization.CultureInfo.InvariantCulture, out var id))
                list.Add(id);

        return list.Count == 0 ? null : list;
    }

    [HttpGet]
    [SwaggerOperation(
        Summary = "Danh sách sản phẩm Active; mỗi item có ImageUrl (SP hoặc fallback variant Id nhỏ nhất có ảnh)",
        Description =
            "Lọc giá minPrice/maxPrice (BasePrice). sort: name_asc|name_desc|price_asc|price_desc (mặc định name_asc). inStockOnly: chỉ SP có biến thể QuantityAvailable&gt;0. attributeValueIds: chuỗi id giá trị thuộc tính cách nhau dấu phẩy; SP phải có đủ tất cả giá trị (AND).")]
    public async Task<IActionResult> GetList(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50,
        [FromQuery] int? categoryId = null,
        [FromQuery] bool includeSubcategories = true,
        [FromQuery] string? search = null,
        [FromQuery] decimal? minPrice = null,
        [FromQuery] decimal? maxPrice = null,
        [FromQuery] string? sort = null,
        [FromQuery] bool inStockOnly = false,
        [FromQuery] string? attributeValueIds = null,
        CancellationToken cancellationToken = default)
    {
        var filterAttrIds = ParseAttributeValueIds(attributeValueIds);

        var data = await storeCatalog.GetProductsPagedAsync(
            page,
            pageSize,
            categoryId,
            includeSubcategories,
            search,
            minPrice,
            maxPrice,
            sort,
            inStockOnly,
            filterAttrIds,
            cancellationToken);
        return Ok(new ResponseDto
        {
            Success = true,
            Data = data,
            Message = "Lấy danh sách sản phẩm thành công"
        });
    }

    [HttpGet("attribute-options")]
    [SwaggerOperation(
        Summary = "Giá trị thuộc tính dùng bộ lọc (không có count)",
        Description =
            "Cùng phạm vi filter nền với list (category/search/giá/còn hàng); không nhận attributeValueIds.")]
    public async Task<IActionResult> GetAttributeOptions(
        [FromQuery] int? categoryId = null,
        [FromQuery] bool includeSubcategories = true,
        [FromQuery] string? search = null,
        [FromQuery] decimal? minPrice = null,
        [FromQuery] decimal? maxPrice = null,
        [FromQuery] bool inStockOnly = false,
        CancellationToken cancellationToken = default)
    {
        var data = await storeCatalog.GetProductAttributeFilterOptionsAsync(
            categoryId,
            includeSubcategories,
            search,
            minPrice,
            maxPrice,
            inStockOnly,
            cancellationToken);

        return Ok(new ResponseDto
        {
            Success = true,
            Data = data,
            Message = "Lấy tùy chọn thuộc tính thành công"
        });
    }

    [HttpGet("id/{id:int}")]
    [SwaggerOperation(Summary = "Chi tiết sản phẩm Active theo id; có ImageUrl đại diện + ảnh từng variant")]
    public async Task<IActionResult> GetDetailById(int id, CancellationToken cancellationToken = default)
    {
        var data = await storeCatalog.GetProductDetailByIdAsync(id, cancellationToken);
        return Ok(new ResponseDto
        {
            Success = true,
            Data = data,
            Message = "Lấy sản phẩm thành công"
        });
    }

    /// <summary>Ưu tiên theo id nếu <paramref name="slugOrId"/> là số nguyên và tồn tại SP Active; không thì theo slug.</summary>
    [HttpGet("{slugOrId}")]
    [SwaggerOperation(Summary = "Chi tiết sản phẩm Active theo slug hoặc id: ImageUrl đại diện, thuộc tính, biến thể (không giá vốn), tồn")]
    public async Task<IActionResult> GetDetail(string slugOrId, CancellationToken cancellationToken = default)
    {
        var data = await storeCatalog.GetProductBySlugOrIdAsync(slugOrId, cancellationToken);
        return Ok(new ResponseDto
        {
            Success = true,
            Data = data,
            Message = "Lấy sản phẩm thành công"
        });
    }
}
