using BE_API.Domain;
using BE_API.Dto.Common;
using BE_API.Dto.Product;
using BE_API.Entities;
using BE_API.Helpers;
using BE_API.Repository;
using BE_API.Service.IService;
using Microsoft.EntityFrameworkCore;

namespace BE_API.Service;

public class ProductService(
    IRepository<Product> productRepo,
    IRepository<Category> categoryRepo,
    IRepository<OrderItem> orderItemRepo,
    IRepository<QuoteItem> quoteItemRepo) : IProductService
{
    public async Task<PagedResultDto<ProductListItemDto>> GetPagedAsync(
        int page,
        int pageSize,
        int? categoryId,
        bool includeSubcategories,
        string? status,
        string? search,
        CancellationToken cancellationToken = default)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 200);

        var query = productRepo.Get().AsNoTracking();

        if (categoryId.HasValue)
        {
            if (includeSubcategories)
            {
                var flat = await categoryRepo.Get()
                    .AsNoTracking()
                    .Select(c => new { c.Id, c.ParentId })
                    .ToListAsync(cancellationToken);
                var tuples = flat.Select(x => (x.Id, x.ParentId)).ToList();
                var ids = CategorySubtreeIds(categoryId.Value, tuples);
                query = query.Where(p => ids.Contains(p.CategoryId));
            }
            else
            {
                query = query.Where(p => p.CategoryId == categoryId.Value);
            }
        }

        if (!string.IsNullOrWhiteSpace(status))
        {
            var st = status.Trim();
            query = query.Where(p => p.Status == st);
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim();
            var pattern = $"%{term}%";
            query = query.Where(p =>
                EF.Functions.Like(p.Name, pattern) ||
                EF.Functions.Like(p.Slug, pattern));
        }

        var total = await query.CountAsync(cancellationToken);

        var items = await query
            .OrderBy(p => p.Name)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(p => new ProductListItemDto
            {
                Id = p.Id,
                CategoryId = p.CategoryId,
                CategoryName = p.Category.Name,
                Name = p.Name,
                Slug = p.Slug,
                ImageUrl = p.ImageUrl,
                BasePrice = p.BasePrice,
                WarrantyPeriodMonths = p.WarrantyPeriodMonths,
                Status = p.Status,
                VariantCount = p.Variants.Count,
                AttributeCount = p.Attributes.Count
            })
            .ToListAsync(cancellationToken);

        return new PagedResultDto<ProductListItemDto>
        {
            Items = items,
            TotalCount = total,
            Page = page,
            PageSize = pageSize
        };
    }

    public async Task<ProductDetailDto> GetByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        var entity = await productRepo.Get()
            .AsNoTracking()
            .AsSplitQuery()
            .Include(p => p.Category)
            .Include(p => p.Attributes).ThenInclude(a => a.Values)
            .Include(p => p.Variants).ThenInclude(v => v.Inventories)
            .FirstOrDefaultAsync(p => p.Id == id, cancellationToken)
            ?? throw new KeyNotFoundException("Không tìm thấy sản phẩm");

        return new ProductDetailDto
        {
            Id = entity.Id,
            CategoryId = entity.CategoryId,
            CategoryName = entity.Category.Name,
            Name = entity.Name,
            Slug = entity.Slug,
            Description = entity.Description,
            BasePrice = entity.BasePrice,
            WarrantyPeriodMonths = entity.WarrantyPeriodMonths,
            Status = entity.Status,
            VariantCount = entity.Variants.Count,
            AttributeCount = entity.Attributes.Count,
            Attributes = entity.Attributes
                .OrderBy(a => a.Name)
                .Select(a => new ProductDetailAttributeDto
                {
                    Id = a.Id,
                    Name = a.Name,
                    Values = a.Values
                        .OrderBy(v => v.Value)
                        .Select(v => new ProductDetailAttributeValueDto { Id = v.Id, Value = v.Value })
                        .ToList()
                })
                .ToList(),
            Variants = entity.Variants
                .OrderBy(v => v.Sku)
                .Select(v =>
                {
                    var row = v.Inventories.FirstOrDefault();
                    return new ProductDetailVariantDto
                    {
                        Id = v.Id,
                        Sku = v.Sku,
                        VariantName = v.VariantName,
                        RetailPrice = v.RetailPrice,
                        CostPrice = v.CostPrice,
                        Weight = v.Weight,
                        Dimensions = v.Dimensions,
                        ImageUrl = v.ImageUrl,
                        QuantityOnHand = row?.QuantityOnHand,
                        QuantityReserved = row?.QuantityReserved,
                        QuantityAvailable = row?.QuantityAvailable
                    };
                })
                .ToList()
        };
    }

    public async Task<ProductDetailDto> CreateAsync(ProductCreateDto dto, CancellationToken cancellationToken = default)
    {
        var categoryExists = await categoryRepo.Get()
            .AnyAsync(c => c.Id == dto.CategoryId, cancellationToken);
        if (!categoryExists)
            throw new KeyNotFoundException("Không tìm thấy danh mục");

        var name = dto.Name.Trim();
        var slug = string.IsNullOrWhiteSpace(dto.Slug)
            ? SlugNormalizer.FromName(name)
            : dto.Slug.Trim().ToLowerInvariant();

        await EnsureSlugUniqueAsync(slug, null, cancellationToken);

        var status = string.IsNullOrWhiteSpace(dto.Status)
            ? ProductStatus.Active
            : ProductStatus.Normalize(dto.Status!);
        ProductStatus.EnsureValid(status);

        var entity = new Product
        {
            CategoryId = dto.CategoryId,
            Name = name,
            Slug = slug,
            Description = string.IsNullOrWhiteSpace(dto.Description) ? null : dto.Description.Trim(),
            ImageUrl = NormalizeOptionalUrl(dto.ImageUrl),
            BasePrice = dto.BasePrice,
            WarrantyPeriodMonths = dto.WarrantyPeriodMonths,
            Status = status
        };

        await productRepo.AddAsync(entity, cancellationToken);
        await productRepo.SaveChangesAsync(cancellationToken);

        return await GetByIdAsync(entity.Id, cancellationToken);
    }

    public async Task<ProductDetailDto> UpdateAsync(int id, ProductUpdateDto dto, CancellationToken cancellationToken = default)
    {
        var entity = await productRepo.Get()
            .FirstOrDefaultAsync(p => p.Id == id, cancellationToken)
            ?? throw new KeyNotFoundException("Không tìm thấy sản phẩm");

        var categoryExists = await categoryRepo.Get()
            .AnyAsync(c => c.Id == dto.CategoryId, cancellationToken);
        if (!categoryExists)
            throw new KeyNotFoundException("Không tìm thấy danh mục");

        var name = dto.Name.Trim();
        var slug = dto.Slug.Trim().ToLowerInvariant();
        await EnsureSlugUniqueAsync(slug, id, cancellationToken);

        var status = ProductStatus.Normalize(dto.Status);
        ProductStatus.EnsureValid(status);

        entity.CategoryId = dto.CategoryId;
        entity.Name = name;
        entity.Slug = slug;
        entity.Description = string.IsNullOrWhiteSpace(dto.Description) ? null : dto.Description.Trim();
        entity.BasePrice = dto.BasePrice;
        entity.WarrantyPeriodMonths = dto.WarrantyPeriodMonths;
        entity.Status = status;
        // Omit imageUrl in JSON => null => giữ nguyên; "" => xóa ảnh; chuỗi => cập nhật.
        if (dto.ImageUrl is not null)
            entity.ImageUrl = NormalizeOptionalUrl(dto.ImageUrl);

        productRepo.Update(entity);
        await productRepo.SaveChangesAsync(cancellationToken);

        return await GetByIdAsync(id, cancellationToken);
    }

    public async Task DeleteAsync(int id, CancellationToken cancellationToken = default)
    {
        var exists = await productRepo.Get().AnyAsync(p => p.Id == id, cancellationToken);
        if (!exists)
            throw new KeyNotFoundException("Không tìm thấy sản phẩm");

        var variantIds = await productRepo.Get()
            .AsNoTracking()
            .Where(p => p.Id == id)
            .SelectMany(p => p.Variants.Select(v => v.Id))
            .ToListAsync(cancellationToken);

        if (variantIds.Count > 0)
        {
            var inOrder = await orderItemRepo.Get()
                .AsNoTracking()
                .AnyAsync(oi => variantIds.Contains(oi.VariantId), cancellationToken);

            var inQuote = await quoteItemRepo.Get()
                .AsNoTracking()
                .AnyAsync(qi => variantIds.Contains(qi.VariantId), cancellationToken);

            if (inOrder || inQuote)
                throw new InvalidOperationException(
                    "Không thể xóa sản phẩm đã có trong đơn hàng hoặc báo giá (biến thể đang được tham chiếu).");
        }

        var entity = await productRepo.Get()
            .FirstOrDefaultAsync(p => p.Id == id, cancellationToken)
            ?? throw new KeyNotFoundException("Không tìm thấy sản phẩm");

        productRepo.Delete(entity);
        await productRepo.SaveChangesAsync(cancellationToken);
    }

    private async Task EnsureSlugUniqueAsync(string slug, int? exceptId, CancellationToken cancellationToken)
    {
        var q = productRepo.Get().Where(p => p.Slug.ToLower() == slug.ToLower());
        if (exceptId.HasValue)
            q = q.Where(p => p.Id != exceptId.Value);

        if (await q.AnyAsync(cancellationToken))
            throw new InvalidOperationException("Slug sản phẩm đã tồn tại");
    }

    /// <summary>Id gốc <paramref name="rootId"/> và mọi danh mục con (BFS).</summary>
    private static int[] CategorySubtreeIds(int rootId, IReadOnlyList<(int Id, int? ParentId)> flat)
    {
        var result = new List<int>();
        var seen = new HashSet<int>();
        var queue = new Queue<int>();
        queue.Enqueue(rootId);
        while (queue.Count > 0)
        {
            var id = queue.Dequeue();
            if (!seen.Add(id))
                continue;
            result.Add(id);
            foreach (var (cid, pid) in flat)
            {
                if (pid == id)
                    queue.Enqueue(cid);
            }
        }

        return result.ToArray();
    }

    private static string? NormalizeOptionalUrl(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
            return null;
        return value.Trim();
    }
}
