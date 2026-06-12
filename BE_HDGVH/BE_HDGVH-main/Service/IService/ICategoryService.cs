using BE_API.Dto.Category;
using BE_API.Dto.Common;

namespace BE_API.Service.IService;

public interface ICategoryService
{
    Task<PagedResultDto<CategoryListItemDto>> GetPagedAsync(
        int page,
        int pageSize,
        int? parentId,
        bool rootsOnly,
        CancellationToken cancellationToken = default);

    Task<List<CategoryTreeNodeDto>> GetTreeAsync(CancellationToken cancellationToken = default);

    Task<CategoryDetailDto> GetByIdAsync(int id, CancellationToken cancellationToken = default);

    Task<CategoryDetailDto> CreateAsync(CategoryCreateDto dto, CancellationToken cancellationToken = default);

    Task<CategoryDetailDto> UpdateAsync(int id, CategoryUpdateDto dto, CancellationToken cancellationToken = default);

    Task DeleteAsync(int id, CancellationToken cancellationToken = default);
}
