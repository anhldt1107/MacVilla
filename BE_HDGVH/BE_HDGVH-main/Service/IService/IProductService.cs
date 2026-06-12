using BE_API.Dto.Common;
using BE_API.Dto.Product;

namespace BE_API.Service.IService;

public interface IProductService
{
    /// <param name="includeSubcategories">
    /// Khi có <paramref name="categoryId"/>: <c>true</c> (mặc định) = sản phẩm thuộc category đó hoặc mọi danh mục con;
    /// <c>false</c> = chỉ đúng <paramref name="categoryId"/>.
    /// </param>
    Task<PagedResultDto<ProductListItemDto>> GetPagedAsync(
        int page,
        int pageSize,
        int? categoryId,
        bool includeSubcategories,
        string? status,
        string? search,
        CancellationToken cancellationToken = default);

    Task<ProductDetailDto> GetByIdAsync(int id, CancellationToken cancellationToken = default);

    Task<ProductDetailDto> CreateAsync(ProductCreateDto dto, CancellationToken cancellationToken = default);

    Task<ProductDetailDto> UpdateAsync(int id, ProductUpdateDto dto, CancellationToken cancellationToken = default);

    Task DeleteAsync(int id, CancellationToken cancellationToken = default);
}
