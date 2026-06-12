using BE_API.Dto.Common;
using BE_API.Dto.ProductVariant;

namespace BE_API.Service.IService;

public interface IProductVariantService
{
    Task<PagedResultDto<ProductVariantFilteredListItemDto>> GetFilteredPagedAsync(
        ProductVariantListFilterDto filter,
        CancellationToken cancellationToken = default);

    Task<List<ProductVariantListItemDto>> GetListByProductAsync(int productId, CancellationToken cancellationToken = default);

    Task<ProductVariantDetailDto?> GetBySkuAsync(string sku, CancellationToken cancellationToken = default);

    Task<ProductVariantDetailDto> GetByIdAsync(int productId, int variantId, CancellationToken cancellationToken = default);

    Task<ProductVariantDetailDto> CreateAsync(int productId, ProductVariantCreateDto dto, CancellationToken cancellationToken = default);

    Task<ProductVariantDetailDto> UpdateAsync(
        int productId,
        int variantId,
        ProductVariantUpdateDto dto,
        CancellationToken cancellationToken = default);

    Task DeleteAsync(int productId, int variantId, CancellationToken cancellationToken = default);
}
