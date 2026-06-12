using BE_API.Dto.Common;
using BE_API.Dto.ProductVariant;
using BE_API.Entities;
using BE_API.Repository;
using BE_API.Service.IService;
using Microsoft.EntityFrameworkCore;

namespace BE_API.Service;

public class ProductVariantService(
    IRepository<Product> productRepo,
    IRepository<ProductVariant> variantRepo,
    IRepository<OrderItem> orderItemRepo,
    IRepository<QuoteItem> quoteItemRepo) : IProductVariantService
{
    public async Task<PagedResultDto<ProductVariantFilteredListItemDto>> GetFilteredPagedAsync(
        ProductVariantListFilterDto filter,
        CancellationToken cancellationToken = default)
    {
        var page = Math.Max(1, filter.Page);
        var pageSize = Math.Clamp(filter.PageSize, 1, 200);

        var query = variantRepo.Get().AsNoTracking().AsQueryable();

        if (filter.ProductId.HasValue)
            query = query.Where(v => v.ProductId == filter.ProductId.Value);

        if (filter.CategoryId.HasValue)
            query = query.Where(v => v.Product.CategoryId == filter.CategoryId.Value);

        if (!string.IsNullOrWhiteSpace(filter.ProductStatus))
        {
            var st = filter.ProductStatus.Trim();
            query = query.Where(v => v.Product.Status.ToLower() == st.ToLower());
        }

        if (!string.IsNullOrWhiteSpace(filter.Search))
        {
            var s = filter.Search.Trim().ToLower();
            query = query.Where(v =>
                v.Sku.ToLower().Contains(s) ||
                v.VariantName.ToLower().Contains(s) ||
                v.Product.Name.ToLower().Contains(s));
        }

        if (filter.MinRetailPrice.HasValue)
            query = query.Where(v => v.RetailPrice >= filter.MinRetailPrice.Value);

        if (filter.MaxRetailPrice.HasValue)
            query = query.Where(v => v.RetailPrice <= filter.MaxRetailPrice.Value);

        if (filter.MinQuantityAvailable.HasValue)
        {
            var min = filter.MinQuantityAvailable.Value;
            query = query.Where(v =>
                (v.Inventories.OrderBy(i => i.Id).Select(i => (int?)i.QuantityAvailable).FirstOrDefault() ?? 0) >= min);
        }

        if (filter.MaxQuantityAvailable.HasValue)
        {
            var max = filter.MaxQuantityAvailable.Value;
            query = query.Where(v =>
                (v.Inventories.OrderBy(i => i.Id).Select(i => (int?)i.QuantityAvailable).FirstOrDefault() ?? 0) <= max);
        }

        var total = await query.CountAsync(cancellationToken);

        var items = await query
            .OrderBy(v => v.Product.Name)
            .ThenBy(v => v.Sku)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(v => new ProductVariantFilteredListItemDto
            {
                Id = v.Id,
                ProductId = v.ProductId,
                ProductName = v.Product.Name,
                ProductStatus = v.Product.Status,
                CategoryId = v.Product.CategoryId,
                CategoryName = v.Product.Category.Name,
                Sku = v.Sku,
                VariantName = v.VariantName,
                RetailPrice = v.RetailPrice,
                CostPrice = v.CostPrice,
                Weight = v.Weight,
                ImageUrl = v.ImageUrl,
                QuantityOnHand = v.Inventories.OrderBy(i => i.Id).Select(i => (int?)i.QuantityOnHand).FirstOrDefault(),
                QuantityReserved = v.Inventories.OrderBy(i => i.Id).Select(i => (int?)i.QuantityReserved).FirstOrDefault(),
                QuantityAvailable = v.Inventories.OrderBy(i => i.Id).Select(i => (int?)i.QuantityAvailable).FirstOrDefault()
            })
            .ToListAsync(cancellationToken);

        return new PagedResultDto<ProductVariantFilteredListItemDto>
        {
            Items = items,
            TotalCount = total,
            Page = page,
            PageSize = pageSize
        };
    }

    public async Task<List<ProductVariantListItemDto>> GetListByProductAsync(
        int productId,
        CancellationToken cancellationToken = default)
    {
        await EnsureProductExistsAsync(productId, cancellationToken);

        var list = await variantRepo.Get()
            .AsNoTracking()
            .Where(v => v.ProductId == productId)
            .Include(v => v.Inventories)
            .OrderBy(v => v.Sku)
            .ToListAsync(cancellationToken);

        return list.Select(MapListItem).ToList();
    }

    public async Task<ProductVariantDetailDto?> GetBySkuAsync(string sku, CancellationToken cancellationToken = default)
    {
        var key = sku.Trim();
        if (string.IsNullOrEmpty(key))
            return null;

        var entity = await variantRepo.Get()
            .AsNoTracking()
            .Include(v => v.Product)
            .Include(v => v.Inventories)
            .FirstOrDefaultAsync(v => v.Sku.ToLower() == key.ToLower(), cancellationToken);

        return entity == null ? null : MapDetail(entity);
    }

    public async Task<ProductVariantDetailDto> GetByIdAsync(
        int productId,
        int variantId,
        CancellationToken cancellationToken = default)
    {
        var entity = await variantRepo.Get()
            .AsNoTracking()
            .Include(v => v.Product)
            .Include(v => v.Inventories)
            .FirstOrDefaultAsync(v => v.Id == variantId && v.ProductId == productId, cancellationToken)
            ?? throw new KeyNotFoundException("Không tìm thấy biến thể trong sản phẩm này");

        return MapDetail(entity);
    }

    public async Task<ProductVariantDetailDto> CreateAsync(
        int productId,
        ProductVariantCreateDto dto,
        CancellationToken cancellationToken = default)
    {
        await EnsureProductExistsAsync(productId, cancellationToken);

        var sku = dto.Sku.Trim();
        await EnsureSkuUniqueAsync(sku, null, cancellationToken);

        var entity = new ProductVariant
        {
            ProductId = productId,
            Sku = sku,
            VariantName = dto.VariantName.Trim(),
            RetailPrice = dto.RetailPrice,
            CostPrice = dto.CostPrice,
            Weight = dto.Weight,
            Dimensions = string.IsNullOrWhiteSpace(dto.Dimensions) ? null : dto.Dimensions.Trim(),
            ImageUrl = string.IsNullOrWhiteSpace(dto.ImageUrl) ? null : dto.ImageUrl.Trim()
        };

        await variantRepo.AddAsync(entity, cancellationToken);
        await variantRepo.SaveChangesAsync(cancellationToken);

        return await GetByIdAsync(productId, entity.Id, cancellationToken);
    }

    public async Task<ProductVariantDetailDto> UpdateAsync(
        int productId,
        int variantId,
        ProductVariantUpdateDto dto,
        CancellationToken cancellationToken = default)
    {
        var entity = await variantRepo.Get()
            .FirstOrDefaultAsync(v => v.Id == variantId && v.ProductId == productId, cancellationToken)
            ?? throw new KeyNotFoundException("Không tìm thấy biến thể trong sản phẩm này");

        var sku = dto.Sku.Trim();
        await EnsureSkuUniqueAsync(sku, variantId, cancellationToken);

        entity.Sku = sku;
        entity.VariantName = dto.VariantName.Trim();
        entity.RetailPrice = dto.RetailPrice;
        entity.CostPrice = dto.CostPrice;
        entity.Weight = dto.Weight;
        entity.Dimensions = string.IsNullOrWhiteSpace(dto.Dimensions) ? null : dto.Dimensions.Trim();
        entity.ImageUrl = string.IsNullOrWhiteSpace(dto.ImageUrl) ? null : dto.ImageUrl.Trim();

        variantRepo.Update(entity);
        await variantRepo.SaveChangesAsync(cancellationToken);

        return await GetByIdAsync(productId, variantId, cancellationToken);
    }

    public async Task DeleteAsync(int productId, int variantId, CancellationToken cancellationToken = default)
    {
        var entity = await variantRepo.Get()
            .FirstOrDefaultAsync(v => v.Id == variantId && v.ProductId == productId, cancellationToken)
            ?? throw new KeyNotFoundException("Không tìm thấy biến thể trong sản phẩm này");

        var inOrder = await orderItemRepo.Get()
            .AsNoTracking()
            .AnyAsync(oi => oi.VariantId == variantId, cancellationToken);

        var inQuote = await quoteItemRepo.Get()
            .AsNoTracking()
            .AnyAsync(qi => qi.VariantId == variantId, cancellationToken);

        if (inOrder || inQuote)
            throw new InvalidOperationException(
                "Không thể xóa biến thể đã có trong đơn hàng hoặc báo giá.");

        variantRepo.Delete(entity);
        await variantRepo.SaveChangesAsync(cancellationToken);
    }

    private async Task EnsureProductExistsAsync(int productId, CancellationToken cancellationToken)
    {
        var exists = await productRepo.Get().AnyAsync(p => p.Id == productId, cancellationToken);
        if (!exists)
            throw new KeyNotFoundException("Không tìm thấy sản phẩm");
    }

    private async Task EnsureSkuUniqueAsync(string sku, int? exceptVariantId, CancellationToken cancellationToken)
    {
        var q = variantRepo.Get().Where(v => v.Sku.ToLower() == sku.ToLower());
        if (exceptVariantId.HasValue)
            q = q.Where(v => v.Id != exceptVariantId.Value);

        if (await q.AnyAsync(cancellationToken))
            throw new InvalidOperationException("SKU đã tồn tại");
    }

    private static ProductVariantListItemDto MapListItem(ProductVariant v)
    {
        var row = v.Inventories.FirstOrDefault();
        return new ProductVariantListItemDto
        {
            Id = v.Id,
            ProductId = v.ProductId,
            Sku = v.Sku,
            VariantName = v.VariantName,
            RetailPrice = v.RetailPrice,
            CostPrice = v.CostPrice,
            Weight = v.Weight,
            ImageUrl = v.ImageUrl,
            QuantityOnHand = row?.QuantityOnHand,
            QuantityReserved = row?.QuantityReserved,
            QuantityAvailable = row?.QuantityAvailable
        };
    }

    private static ProductVariantDetailDto MapDetail(ProductVariant v)
    {
        var row = v.Inventories.FirstOrDefault();
        return new ProductVariantDetailDto
        {
            Id = v.Id,
            ProductId = v.ProductId,
            ProductName = v.Product.Name,
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
    }
}
