using System.Text.Json;
using BE_API.Dto.ProductAttribute;

namespace BE_API.Service.IService;

public interface IProductAttributeService
{
    Task<List<ProductAttributeListItemDto>> GetListAsync(int productId, CancellationToken cancellationToken = default);

    Task<ProductAttributeDetailDto> GetByIdAsync(int productId, int attributeId, CancellationToken cancellationToken = default);

    Task<ProductAttributeDetailDto> CreateAsync(int productId, ProductAttributeCreateDto dto, CancellationToken cancellationToken = default);

    Task<ProductAttributeDetailDto> UpdateAsync(int productId, int attributeId, ProductAttributeUpdateDto dto, CancellationToken cancellationToken = default);

    Task DeleteAsync(int productId, int attributeId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Upsert một phần: chỉ các key trong payload được xử lý (get-or-create thuộc tính theo tên;
    /// danh sách giá trị của từng thuộc tính được thay thế bằng payload). Thuộc tính không có trong body giữ nguyên.
    /// </summary>
    Task<List<ProductAttributeDetailDto>> BulkUpsertAsync(
        int productId,
        IReadOnlyDictionary<string, JsonElement> attributesByName,
        CancellationToken cancellationToken = default);
}
