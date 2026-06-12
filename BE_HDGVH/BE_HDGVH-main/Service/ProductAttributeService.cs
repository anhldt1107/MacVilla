using System.Text.Json;
using BE_API.Database;
using BE_API.Dto.ProductAttribute;
using BE_API.Entities;
using BE_API.Repository;
using BE_API.Service.IService;
using Microsoft.EntityFrameworkCore;

namespace BE_API.Service;

public class ProductAttributeService(
    BeContext db,
    IRepository<Product> productRepo,
    IRepository<ProductAttribute> attributeRepo,
    IRepository<ProductAttributeValue> valueRepo) : IProductAttributeService
{
    private const int MaxNameLen = 500;
    private const int MaxValueLen = 500;
    public async Task<List<ProductAttributeListItemDto>> GetListAsync(int productId, CancellationToken cancellationToken = default)
    {
        await EnsureProductExistsAsync(productId, cancellationToken);

        return await attributeRepo.Get()
            .AsNoTracking()
            .Where(a => a.ProductId == productId)
            .OrderBy(a => a.Name)
            .Select(a => new ProductAttributeListItemDto
            {
                Id = a.Id,
                ProductId = a.ProductId,
                Name = a.Name,
                ValuesCount = a.Values.Count
            })
            .ToListAsync(cancellationToken);
    }

    public async Task<ProductAttributeDetailDto> GetByIdAsync(int productId, int attributeId, CancellationToken cancellationToken = default)
    {
        await EnsureProductExistsAsync(productId, cancellationToken);

        var dto = await attributeRepo.Get()
            .AsNoTracking()
            .Where(a => a.Id == attributeId && a.ProductId == productId)
            .Select(a => new ProductAttributeDetailDto
            {
                Id = a.Id,
                ProductId = a.ProductId,
                Name = a.Name,
                Values = a.Values
                    .OrderBy(v => v.Value)
                    .Select(v => new ProductAttributeValueItemDto { Id = v.Id, Value = v.Value })
                    .ToList()
            })
            .FirstOrDefaultAsync(cancellationToken)
            ?? throw new KeyNotFoundException("Không tìm thấy thuộc tính trong sản phẩm này");

        return dto;
    }

    public async Task<ProductAttributeDetailDto> CreateAsync(
        int productId,
        ProductAttributeCreateDto dto,
        CancellationToken cancellationToken = default)
    {
        await EnsureProductExistsAsync(productId, cancellationToken);

        var name = dto.Name.Trim();
        await EnsureNameUniqueInProductAsync(productId, name, null, cancellationToken);

        var entity = new ProductAttribute
        {
            ProductId = productId,
            Name = name
        };

        await attributeRepo.AddAsync(entity, cancellationToken);
        await attributeRepo.SaveChangesAsync(cancellationToken);

        return await GetByIdAsync(productId, entity.Id, cancellationToken);
    }

    public async Task<ProductAttributeDetailDto> UpdateAsync(
        int productId,
        int attributeId,
        ProductAttributeUpdateDto dto,
        CancellationToken cancellationToken = default)
    {
        var entity = await attributeRepo.Get()
            .FirstOrDefaultAsync(a => a.Id == attributeId && a.ProductId == productId, cancellationToken)
            ?? throw new KeyNotFoundException("Không tìm thấy thuộc tính trong sản phẩm này");

        var name = dto.Name.Trim();
        await EnsureNameUniqueInProductAsync(productId, name, attributeId, cancellationToken);

        entity.Name = name;
        attributeRepo.Update(entity);
        await attributeRepo.SaveChangesAsync(cancellationToken);

        return await GetByIdAsync(productId, attributeId, cancellationToken);
    }

    public async Task DeleteAsync(int productId, int attributeId, CancellationToken cancellationToken = default)
    {
        var entity = await attributeRepo.Get()
            .FirstOrDefaultAsync(a => a.Id == attributeId && a.ProductId == productId, cancellationToken)
            ?? throw new KeyNotFoundException("Không tìm thấy thuộc tính trong sản phẩm này");

        attributeRepo.Delete(entity);
        await attributeRepo.SaveChangesAsync(cancellationToken);
    }

    public async Task<List<ProductAttributeDetailDto>> BulkUpsertAsync(
        int productId,
        IReadOnlyDictionary<string, JsonElement> attributesByName,
        CancellationToken cancellationToken = default)
    {
        await EnsureProductExistsAsync(productId, cancellationToken);

        if (attributesByName.Count == 0)
            return await LoadAllDetailsAsync(productId, cancellationToken);

        await using var tx = await db.Database.BeginTransactionAsync(cancellationToken);
        try
        {
            var syncQueue = new List<(ProductAttribute Attr, List<string> Values)>();

            foreach (var (rawName, valueEl) in attributesByName)
            {
                var name = rawName.Trim();
                if (name.Length == 0)
                    continue;
                if (name.Length > MaxNameLen)
                    throw new ArgumentException($"Tên thuộc tính vượt quá {MaxNameLen} ký tự: {rawName}");

                var targetValues = ParseValueElements(valueEl);
                foreach (var v in targetValues)
                {
                    if (v.Length > MaxValueLen)
                        throw new ArgumentException($"Giá trị vượt quá {MaxValueLen} ký tự trong thuộc tính \"{name}\".");
                }

                var attr = await attributeRepo.Get()
                    .FirstOrDefaultAsync(
                        a => a.ProductId == productId && a.Name.ToLower() == name.ToLower(),
                        cancellationToken);

                if (attr is null)
                {
                    attr = new ProductAttribute { ProductId = productId, Name = name };
                    await attributeRepo.AddAsync(attr, cancellationToken);
                }
                else
                    attr.Name = name;

                syncQueue.Add((attr, targetValues));
            }

            await attributeRepo.SaveChangesAsync(cancellationToken);

            foreach (var (attr, targetValues) in syncQueue)
            {
                var existingVals = await valueRepo.Get()
                    .Where(v => v.AttributeId == attr.Id)
                    .ToListAsync(cancellationToken);
                if (existingVals.Count > 0)
                    valueRepo.DeleteRange(existingVals);

                foreach (var t in targetValues)
                {
                    await valueRepo.AddAsync(
                        new ProductAttributeValue { AttributeId = attr.Id, Value = t },
                        cancellationToken);
                }
            }

            await valueRepo.SaveChangesAsync(cancellationToken);

            await tx.CommitAsync(cancellationToken);
        }
        catch
        {
            await tx.RollbackAsync(cancellationToken);
            throw;
        }

        return await LoadAllDetailsAsync(productId, cancellationToken);
    }

    private async Task<List<ProductAttributeDetailDto>> LoadAllDetailsAsync(
        int productId,
        CancellationToken cancellationToken)
    {
        return await attributeRepo.Get()
            .AsNoTracking()
            .Where(a => a.ProductId == productId)
            .OrderBy(a => a.Name)
            .Select(a => new ProductAttributeDetailDto
            {
                Id = a.Id,
                ProductId = a.ProductId,
                Name = a.Name,
                Values = a.Values
                    .OrderBy(v => v.Value)
                    .Select(v => new ProductAttributeValueItemDto { Id = v.Id, Value = v.Value })
                    .ToList()
            })
            .ToListAsync(cancellationToken);
    }

    private static List<string> ParseValueElements(JsonElement el)
    {
        var list = new List<string>();
        switch (el.ValueKind)
        {
            case JsonValueKind.String:
            {
                var s = el.GetString()?.Trim();
                if (!string.IsNullOrEmpty(s))
                    list.Add(s);
                break;
            }
            case JsonValueKind.Array:
            {
                foreach (var item in el.EnumerateArray())
                {
                    if (item.ValueKind != JsonValueKind.String)
                        throw new ArgumentException("Mảng giá trị chỉ được chứa chuỗi.");
                    var s = item.GetString()?.Trim();
                    if (!string.IsNullOrEmpty(s))
                        list.Add(s);
                }

                break;
            }
            case JsonValueKind.Number:
            {
                var s = el.GetRawText().Trim();
                if (s.Length > 0)
                    list.Add(s);
                break;
            }
            case JsonValueKind.Null:
            case JsonValueKind.Undefined:
                break;
            default:
                throw new ArgumentException("Giá trị thuộc tính phải là chuỗi, số, mảng chuỗi hoặc rỗng.");
        }

        return DeduplicatePreserveOrder(list);
    }

    private static List<string> DeduplicatePreserveOrder(List<string> values)
    {
        var seen = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        var result = new List<string>();
        foreach (var v in values)
        {
            if (seen.Add(v))
                result.Add(v);
        }

        return result;
    }

    private async Task EnsureProductExistsAsync(int productId, CancellationToken cancellationToken)
    {
        var exists = await productRepo.Get().AnyAsync(p => p.Id == productId, cancellationToken);
        if (!exists)
            throw new KeyNotFoundException("Không tìm thấy sản phẩm");
    }

    private async Task EnsureNameUniqueInProductAsync(
        int productId,
        string name,
        int? exceptAttributeId,
        CancellationToken cancellationToken)
    {
        var q = attributeRepo.Get()
            .Where(a => a.ProductId == productId && a.Name.ToLower() == name.ToLower());

        if (exceptAttributeId.HasValue)
            q = q.Where(a => a.Id != exceptAttributeId.Value);

        if (await q.AnyAsync(cancellationToken))
            throw new InvalidOperationException("Tên thuộc tính đã tồn tại trong sản phẩm này");
    }
}
