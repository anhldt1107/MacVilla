using BE_API.Dto.ProductAttributeValue;

namespace BE_API.Service.IService;

public interface IProductAttributeValueService
{
    Task<List<ProductAttributeValueResponseDto>> GetListAsync(
        int productId,
        int attributeId,
        CancellationToken cancellationToken = default);

    Task<ProductAttributeValueResponseDto> CreateAsync(
        int productId,
        int attributeId,
        ProductAttributeValueCreateDto dto,
        CancellationToken cancellationToken = default);

    Task<ProductAttributeValueResponseDto> UpdateAsync(
        int productId,
        int attributeId,
        int valueId,
        ProductAttributeValueUpdateDto dto,
        CancellationToken cancellationToken = default);

    Task DeleteAsync(int productId, int attributeId, int valueId, CancellationToken cancellationToken = default);
}
