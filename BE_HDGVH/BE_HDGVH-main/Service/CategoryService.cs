using BE_API.Dto.Category;
using BE_API.Dto.Common;
using BE_API.Entities;
using BE_API.Helpers;
using BE_API.Repository;
using BE_API.Service.IService;
using Microsoft.EntityFrameworkCore;

namespace BE_API.Service;

public class CategoryService(IRepository<Category> categoryRepo) : ICategoryService
{
    public async Task<PagedResultDto<CategoryListItemDto>> GetPagedAsync(
        int page,
        int pageSize,
        int? parentId,
        bool rootsOnly,
        CancellationToken cancellationToken = default)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 200);

        var query = categoryRepo.Get().AsNoTracking();

        if (rootsOnly)
            query = query.Where(c => c.ParentId == null);
        else if (parentId.HasValue)
            query = query.Where(c => c.ParentId == parentId);

        var total = await query.CountAsync(cancellationToken);

        var items = await query
            .OrderBy(c => c.Name)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(c => new CategoryListItemDto
            {
                Id = c.Id,
                ParentId = c.ParentId,
                Name = c.Name,
                Slug = c.Slug,
                ImageUrl = c.ImageUrl
            })
            .ToListAsync(cancellationToken);

        return new PagedResultDto<CategoryListItemDto>
        {
            Items = items,
            TotalCount = total,
            Page = page,
            PageSize = pageSize
        };
    }

    public async Task<List<CategoryTreeNodeDto>> GetTreeAsync(CancellationToken cancellationToken = default)
    {
        var flat = await categoryRepo.Get()
            .AsNoTracking()
            .OrderBy(c => c.Name)
            .Select(c => new { c.Id, c.ParentId, c.Name, c.Slug, c.ImageUrl })
            .ToListAsync(cancellationToken);

        var byParent = flat.ToLookup(x => x.ParentId);

        List<CategoryTreeNodeDto> Build(int? pid)
        {
            var rows = byParent[pid].OrderBy(r => r.Name).ToList();
            if (rows.Count == 0)
                return [];

            return rows.Select(r => new CategoryTreeNodeDto
            {
                Id = r.Id,
                ParentId = r.ParentId,
                Name = r.Name,
                Slug = r.Slug,
                ImageUrl = r.ImageUrl,
                Children = Build(r.Id)
            }).ToList();
        }

        return Build(null);
    }

    public async Task<CategoryDetailDto> GetByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        var dto = await categoryRepo.Get()
            .AsNoTracking()
            .Where(c => c.Id == id)
            .Select(c => new CategoryDetailDto
            {
                Id = c.Id,
                ParentId = c.ParentId,
                Name = c.Name,
                Slug = c.Slug,
                ChildrenCount = c.Children.Count,
                ProductsCount = c.Products.Count
            })
            .FirstOrDefaultAsync(cancellationToken)
            ?? throw new KeyNotFoundException("Không tìm thấy danh mục");

        return dto;
    }

    public async Task<CategoryDetailDto> CreateAsync(CategoryCreateDto dto, CancellationToken cancellationToken = default)
    {
        if (dto.ParentId.HasValue)
        {
            var parentExists = await categoryRepo.Get()
                .AnyAsync(c => c.Id == dto.ParentId.Value, cancellationToken);
            if (!parentExists)
                throw new KeyNotFoundException("Không tìm thấy danh mục cha");
        }

        var name = dto.Name.Trim();
        var slug = string.IsNullOrWhiteSpace(dto.Slug)
            ? SlugNormalizer.FromName(name)
            : dto.Slug.Trim().ToLowerInvariant();

        await EnsureSlugUniqueAsync(slug, null, cancellationToken);

        var entity = new Category
        {
            ParentId = dto.ParentId,
            Name = name,
            Slug = slug,
            ImageUrl = NormalizeOptionalUrl(dto.ImageUrl)
        };

        await categoryRepo.AddAsync(entity, cancellationToken);
        await categoryRepo.SaveChangesAsync(cancellationToken);

        return await GetByIdAsync(entity.Id, cancellationToken);
    }

    public async Task<CategoryDetailDto> UpdateAsync(int id, CategoryUpdateDto dto, CancellationToken cancellationToken = default)
    {
        var entity = await categoryRepo.Get()
            .FirstOrDefaultAsync(c => c.Id == id, cancellationToken)
            ?? throw new KeyNotFoundException("Không tìm thấy danh mục");

        if (dto.ParentId.HasValue)
        {
            if (dto.ParentId.Value == id)
                throw new InvalidOperationException("Danh mục không thể là cha của chính nó");

            var parentExists = await categoryRepo.Get()
                .AnyAsync(c => c.Id == dto.ParentId.Value, cancellationToken);
            if (!parentExists)
                throw new KeyNotFoundException("Không tìm thấy danh mục cha");

            if (await IsUnderCategoryAsync(dto.ParentId.Value, id, cancellationToken))
                throw new InvalidOperationException("Không thể đặt cha là chính nó hoặc danh mục con (tránh vòng lặp)");
        }

        var name = dto.Name.Trim();
        var slug = dto.Slug.Trim().ToLowerInvariant();
        await EnsureSlugUniqueAsync(slug, id, cancellationToken);

        entity.ParentId = dto.ParentId;
        entity.Name = name;
        entity.Slug = slug;
        if (dto.ImageUrl is not null)
            entity.ImageUrl = NormalizeOptionalUrl(dto.ImageUrl);

        categoryRepo.Update(entity);
        await categoryRepo.SaveChangesAsync(cancellationToken);

        return await GetByIdAsync(id, cancellationToken);
    }

    public async Task DeleteAsync(int id, CancellationToken cancellationToken = default)
    {
        var entity = await categoryRepo.Get()
            .Include(c => c.Children)
            .Include(c => c.Products)
            .FirstOrDefaultAsync(c => c.Id == id, cancellationToken)
            ?? throw new KeyNotFoundException("Không tìm thấy danh mục");

        if (entity.Children.Count > 0)
            throw new InvalidOperationException("Không thể xóa danh mục còn danh mục con");

        if (entity.Products.Count > 0)
            throw new InvalidOperationException("Không thể xóa danh mục đang có sản phẩm");

        categoryRepo.Delete(entity);
        await categoryRepo.SaveChangesAsync(cancellationToken);
    }

    private async Task EnsureSlugUniqueAsync(string slug, int? exceptId, CancellationToken cancellationToken)
    {
        var q = categoryRepo.Get().Where(c => c.Slug.ToLower() == slug.ToLower());
        if (exceptId.HasValue)
            q = q.Where(c => c.Id != exceptId.Value);

        if (await q.AnyAsync(cancellationToken))
            throw new InvalidOperationException("Slug đã tồn tại");
    }

    /// <summary>Trả true nếu <paramref name="categoryId"/> nằm trên chuỗi tổ tiên của <paramref name="startFromId"/> (tức startFrom là hậu duệ của categoryId).</summary>
    private async Task<bool> IsUnderCategoryAsync(int startFromId, int categoryId, CancellationToken cancellationToken)
    {
        int? current = startFromId;
        var depth = 0;
        while (current.HasValue && depth++ < 500)
        {
            if (current.Value == categoryId)
                return true;

            current = await categoryRepo.Get()
                .AsNoTracking()
                .Where(c => c.Id == current)
                .Select(c => c.ParentId)
                .FirstOrDefaultAsync(cancellationToken);
        }

        return false;
    }

    private static string? NormalizeOptionalUrl(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
            return null;
        return value.Trim();
    }
}
