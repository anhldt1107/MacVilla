using System.Globalization;
using BE_API.Domain;
using BE_API.Dto.Category;
using BE_API.Dto.Common;
using BE_API.Dto.Product;
using BE_API.Dto.Store;
using BE_API.Entities;
using BE_API.Repository;
using BE_API.Service.IService;
using Microsoft.EntityFrameworkCore;

namespace BE_API.Service;

public class StoreCatalogService(
    ICategoryService categoryService,
    IRepository<Product> productRepo,
    IRepository<Category> categoryRepo,
    IRepository<ProductVariant> variantRepo,
    IRepository<ProductAttributeValue> attributeValueRepo) : IStoreCatalogService
{
    public Task<List<CategoryTreeNodeDto>> GetCategoryTreeAsync(CancellationToken cancellationToken = default) =>
        categoryService.GetTreeAsync(cancellationToken);

    public async Task<PagedResultDto<StoreProductListItemDto>> GetProductsPagedAsync(
        int page,
        int pageSize,
        int? categoryId,
        bool includeSubcategories,
        string? search,
        decimal? minPrice = null,
        decimal? maxPrice = null,
        string? sort = null,
        bool inStockOnly = false,
        IReadOnlyList<int>? attributeValueIds = null,
        CancellationToken cancellationToken = default)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 200);

        if (minPrice.HasValue && minPrice.Value < 0) minPrice = 0;
        if (maxPrice.HasValue && maxPrice.Value < 0) maxPrice = null;
        if (minPrice.HasValue && maxPrice.HasValue && minPrice.Value > maxPrice.Value)
        {
            (minPrice, maxPrice) = (maxPrice, minPrice);
        }

        StoreCatalogSort.TryNormalize(sort, out var sortKey);

        var query = await BuildFilteredProductQueryAsync(
            categoryId,
            includeSubcategories,
            search,
            minPrice,
            maxPrice,
            inStockOnly,
            cancellationToken);

        query = await ApplyAttributeValueFiltersAsync(query, attributeValueIds, cancellationToken);

        var total = await query.CountAsync(cancellationToken);

        var sorted = ApplySort(query, sortKey);

        var items = await sorted
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(p => new StoreProductListItemDto
            {
                Id = p.Id,
                CategoryId = p.CategoryId,
                CategoryName = p.Category.Name,
                Name = p.Name,
                Slug = p.Slug,
                ImageUrl = p.ImageUrl ?? p.Variants
                    .Where(v => v.ImageUrl != null)
                    .OrderBy(v => v.Id)
                    .Select(v => v.ImageUrl)
                    .FirstOrDefault(),
                BasePrice = p.BasePrice,
                WarrantyPeriodMonths = p.WarrantyPeriodMonths,
                VariantCount = p.Variants.Count,
                AttributeCount = p.Attributes.Count
            })
            .ToListAsync(cancellationToken);

        return new PagedResultDto<StoreProductListItemDto>
        {
            Items = items,
            TotalCount = total,
            Page = page,
            PageSize = pageSize
        };
    }

    public async Task<List<StoreProductAttributeFilterGroupDto>> GetProductAttributeFilterOptionsAsync(
        int? categoryId,
        bool includeSubcategories,
        string? search,
        decimal? minPrice = null,
        decimal? maxPrice = null,
        bool inStockOnly = false,
        CancellationToken cancellationToken = default)
    {
        if (minPrice.HasValue && minPrice.Value < 0) minPrice = 0;
        if (maxPrice.HasValue && maxPrice.Value < 0) maxPrice = null;
        if (minPrice.HasValue && maxPrice.HasValue && minPrice.Value > maxPrice.Value)
        {
            (minPrice, maxPrice) = (maxPrice, minPrice);
        }

        var query = await BuildFilteredProductQueryAsync(
            categoryId,
            includeSubcategories,
            search,
            minPrice,
            maxPrice,
            inStockOnly,
            cancellationToken);

        var rows = await query
            .SelectMany(p => p.Attributes.SelectMany(a => a.Values, (a, v) =>
                new { AttrName = a.Name, Id = v.Id, Text = v.Value }))
            .ToListAsync(cancellationToken);

        return rows
            .GroupBy(x => x.AttrName, StringComparer.OrdinalIgnoreCase)
            .OrderBy(g => g.Key, StringComparer.OrdinalIgnoreCase)
            .Select(g => new StoreProductAttributeFilterGroupDto
            {
                AttributeName = g.Key,
                Values = g
                    .GroupBy(v => NormalizeAttributeFilterKey(v.Text))
                    .Select(h =>
                    {
                        var pick = h.OrderBy(x => x.Id).First();
                        return new StoreProductAttributeFilterValueDto
                        {
                            Id = pick.Id,
                            Value = pick.Text
                        };
                    })
                    .OrderBy(v => v.Value, StringComparer.OrdinalIgnoreCase)
                    .ToList()
            })
            .Where(g => g.Values.Count > 0)
            .ToList();
    }

    private static string NormalizeAttributeFilterKey(string? text) =>
        (text ?? string.Empty).Trim().ToLower(CultureInfo.InvariantCulture);

    private async Task<IQueryable<Product>> ApplyAttributeValueFiltersAsync(
        IQueryable<Product> query,
        IReadOnlyList<int>? attributeValueIds,
        CancellationToken cancellationToken)
    {
        if (attributeValueIds is null || attributeValueIds.Count == 0)
            return query;

        var ids = attributeValueIds.Distinct().ToList();
        var specs = await attributeValueRepo.Get()
            .Where(v => ids.Contains(v.Id))
            .Select(v => new { v.Value, AttrName = v.Attribute.Name })
            .ToListAsync(cancellationToken);

        var distinctSpecs = specs
            .GroupBy(s => (
                NormalizeAttributeFilterKey(s.AttrName),
                NormalizeAttributeFilterKey(s.Value)))
            .Select(g => g.First())
            .ToList();

        foreach (var spec in distinctSpecs)
        {
            var attrName = spec.AttrName.Trim();
            var valueText = spec.Value.Trim();
            var nameKey = NormalizeAttributeFilterKey(attrName);
            var valueKey = NormalizeAttributeFilterKey(valueText);
            query = query.Where(p => p.Attributes.Any(a =>
                a.Name.ToLower() == nameKey && a.Values.Any(v => v.Value.ToLower() == valueKey)));
        }

        return query;
    }

    private static IQueryable<Product> ApplySort(IQueryable<Product> query, string sortKey) =>
        sortKey switch
        {
            StoreCatalogSort.NameDesc => query.OrderByDescending(p => p.Name).ThenBy(p => p.Id),
            StoreCatalogSort.PriceAsc => query
                .OrderBy(p => p.BasePrice == null)
                .ThenBy(p => p.BasePrice)
                .ThenBy(p => p.Id),
            StoreCatalogSort.PriceDesc => query
                .OrderBy(p => p.BasePrice == null)
                .ThenByDescending(p => p.BasePrice)
                .ThenBy(p => p.Id),
            _ => query.OrderBy(p => p.Name).ThenBy(p => p.Id)
        };

    private async Task<IQueryable<Product>> BuildFilteredProductQueryAsync(
        int? categoryId,
        bool includeSubcategories,
        string? search,
        decimal? minPrice,
        decimal? maxPrice,
        bool inStockOnly,
        CancellationToken cancellationToken)
    {
        int[]? categoryIds = null;
        if (categoryId.HasValue)
        {
            if (includeSubcategories)
            {
                var flat = await categoryRepo.Get()
                    .AsNoTracking()
                    .Select(c => new { c.Id, c.ParentId })
                    .ToListAsync(cancellationToken);
                var tuples = flat.Select(x => (x.Id, x.ParentId)).ToList();
                categoryIds = CategorySubtreeIds(categoryId.Value, tuples);
            }
        }

        var query = productRepo.Get()
            .AsNoTracking()
            .Where(p => p.Status == ProductStatus.Active)
            .Where(p => p.Variants.Any());

        if (categoryIds != null)
        {
            query = query.Where(p => categoryIds.Contains(p.CategoryId));
        }
        else if (categoryId.HasValue && !includeSubcategories)
        {
            query = query.Where(p => p.CategoryId == categoryId.Value);
        }

        if (minPrice.HasValue)
        {
            var min = minPrice.Value;
            query = query.Where(p => p.BasePrice != null && p.BasePrice >= min);
        }

        if (maxPrice.HasValue)
        {
            var max = maxPrice.Value;
            query = query.Where(p => p.BasePrice != null && p.BasePrice <= max);
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim();
            var pattern = $"%{term}%";
            query = query.Where(p =>
                EF.Functions.Like(p.Name, pattern) ||
                EF.Functions.Like(p.Slug, pattern) ||
                p.Variants.Any(v =>
                    EF.Functions.Like(v.Sku, pattern) ||
                    EF.Functions.Like(v.VariantName, pattern)));
        }

        if (inStockOnly)
        {
            query = query.Where(p =>
                p.Variants.Any(v => v.Inventories.Any(inv => inv.QuantityAvailable > 0)));
        }

        return query;
    }

    public async Task<StoreProductDetailDto> GetProductBySlugOrIdAsync(
        string slugOrId,
        CancellationToken cancellationToken = default)
    {
        var key = slugOrId?.Trim() ?? throw new ArgumentException("Thiếu slug hoặc id.");
        if (key.Length == 0)
            throw new ArgumentException("Thiếu slug hoặc id.");

        Product? entity = null;

        if (int.TryParse(key, NumberStyles.Integer, CultureInfo.InvariantCulture, out var pid))
        {
            entity = await ActiveProductDetailQuery()
                .FirstOrDefaultAsync(p => p.Id == pid, cancellationToken);
        }

        if (entity == null)
        {
            var slugLower = key.ToLowerInvariant();
            entity = await ActiveProductDetailQuery()
                .FirstOrDefaultAsync(p => p.Slug.ToLower() == slugLower, cancellationToken);
        }

        if (entity == null)
            throw new KeyNotFoundException("Không tìm thấy sản phẩm");

        return MapDetail(entity);
    }

    public async Task<StoreProductDetailDto> GetProductDetailByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        var entity = await ActiveProductDetailQuery()
            .FirstOrDefaultAsync(p => p.Id == id, cancellationToken);

        if (entity is null)
            throw new KeyNotFoundException("Không tìm thấy sản phẩm");

        return MapDetail(entity);
    }

    public async Task<StoreVariantSkuDto?> GetVariantBySkuAsync(string sku, CancellationToken cancellationToken = default)
    {
        var key = sku.Trim();
        if (string.IsNullOrEmpty(key))
            return null;

        var row = await variantRepo.Get()
            .AsNoTracking()
            .Include(v => v.Product)
            .Include(v => v.Inventories)
            .FirstOrDefaultAsync(
                v => v.Sku.ToLower() == key.ToLower() && v.Product.Status == ProductStatus.Active,
                cancellationToken);

        if (row is null)
            return null;

        var inv = row.Inventories.FirstOrDefault();
        return new StoreVariantSkuDto
        {
            Id = row.Id,
            ProductId = row.ProductId,
            ProductName = row.Product.Name,
            ProductSlug = row.Product.Slug,
            Sku = row.Sku,
            VariantName = row.VariantName,
            RetailPrice = row.RetailPrice,
            Weight = row.Weight,
            Dimensions = row.Dimensions,
            ImageUrl = row.ImageUrl,
            QuantityOnHand = inv?.QuantityOnHand,
            QuantityReserved = inv?.QuantityReserved,
            QuantityAvailable = inv?.QuantityAvailable
        };
    }

    private IQueryable<Product> ActiveProductDetailQuery() =>
        productRepo.Get()
            .AsNoTracking()
            .AsSplitQuery()
            .Where(p => p.Status == ProductStatus.Active && p.Variants.Any())
            .Include(p => p.Category)
            .Include(p => p.Attributes).ThenInclude(a => a.Values)
            .Include(p => p.Variants).ThenInclude(v => v.Inventories);

    private static StoreProductDetailDto MapDetail(Product entity) =>
        new()
        {
            Id = entity.Id,
            CategoryId = entity.CategoryId,
            CategoryName = entity.Category.Name,
            Name = entity.Name,
            Slug = entity.Slug,
            Description = entity.Description,
            ImageUrl = entity.ImageUrl ?? entity.Variants
                .Where(v => !string.IsNullOrWhiteSpace(v.ImageUrl))
                .OrderBy(v => v.Id)
                .Select(v => v.ImageUrl)
                .FirstOrDefault(),
            BasePrice = entity.BasePrice,
            WarrantyPeriodMonths = entity.WarrantyPeriodMonths,
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
                    return new StoreProductVariantDto
                    {
                        Id = v.Id,
                        Sku = v.Sku,
                        VariantName = v.VariantName,
                        RetailPrice = v.RetailPrice,
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
}
