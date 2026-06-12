using BE_API.Dto.ProductAttributeValue;
using BE_API.Entities;
using BE_API.Repository;
using BE_API.Service.IService;
using Microsoft.EntityFrameworkCore;

namespace BE_API.Service;

public class ProductAttributeValueService(
    IRepository<Product> productRepo,
    IRepository<ProductAttribute> attributeRepo,
    IRepository<ProductAttributeValue> valueRepo) : IProductAttributeValueService
{
    public async Task<List<ProductAttributeValueResponseDto>> GetListAsync(
        int productId,
        int attributeId,
        CancellationToken cancellationToken = default)
    {
        await EnsureAttributeInProductAsync(productId, attributeId, cancellationToken);

        return await valueRepo.Get()
            .AsNoTracking()
            .Where(v => v.AttributeId == attributeId)
            .OrderBy(v => v.Value)
            .Select(v => new ProductAttributeValueResponseDto
            {
                Id = v.Id,
                AttributeId = v.AttributeId,
                Value = v.Value
            })
            .ToListAsync(cancellationToken);
    }

    public async Task<ProductAttributeValueResponseDto> CreateAsync(
        int productId,
        int attributeId,
        ProductAttributeValueCreateDto dto,
        CancellationToken cancellationToken = default)
    {
        await EnsureAttributeInProductAsync(productId, attributeId, cancellationToken);

        var text = dto.Value.Trim();
        await EnsureValueUniqueInAttributeAsync(attributeId, text, null, cancellationToken);

        var entity = new ProductAttributeValue
        {
            AttributeId = attributeId,
            Value = text
        };

        await valueRepo.AddAsync(entity, cancellationToken);
        await valueRepo.SaveChangesAsync(cancellationToken);

        return new ProductAttributeValueResponseDto
        {
            Id = entity.Id,
            AttributeId = entity.AttributeId,
            Value = entity.Value
        };
    }

    public async Task<ProductAttributeValueResponseDto> UpdateAsync(
        int productId,
        int attributeId,
        int valueId,
        ProductAttributeValueUpdateDto dto,
        CancellationToken cancellationToken = default)
    {
        await EnsureAttributeInProductAsync(productId, attributeId, cancellationToken);

        var entity = await valueRepo.Get()
            .FirstOrDefaultAsync(v => v.Id == valueId && v.AttributeId == attributeId, cancellationToken)
            ?? throw new KeyNotFoundException("Không tìm thấy giá trị trong thuộc tính này");

        var text = dto.Value.Trim();
        await EnsureValueUniqueInAttributeAsync(attributeId, text, valueId, cancellationToken);

        entity.Value = text;
        valueRepo.Update(entity);
        await valueRepo.SaveChangesAsync(cancellationToken);

        return new ProductAttributeValueResponseDto
        {
            Id = entity.Id,
            AttributeId = entity.AttributeId,
            Value = entity.Value
        };
    }

    public async Task DeleteAsync(int productId, int attributeId, int valueId, CancellationToken cancellationToken = default)
    {
        await EnsureAttributeInProductAsync(productId, attributeId, cancellationToken);

        var entity = await valueRepo.Get()
            .FirstOrDefaultAsync(v => v.Id == valueId && v.AttributeId == attributeId, cancellationToken)
            ?? throw new KeyNotFoundException("Không tìm thấy giá trị trong thuộc tính này");

        valueRepo.Delete(entity);
        await valueRepo.SaveChangesAsync(cancellationToken);
    }

    private async Task EnsureAttributeInProductAsync(int productId, int attributeId, CancellationToken cancellationToken)
    {
        var productExists = await productRepo.Get().AnyAsync(p => p.Id == productId, cancellationToken);
        if (!productExists)
            throw new KeyNotFoundException("Không tìm thấy sản phẩm");

        var ok = await attributeRepo.Get()
            .AnyAsync(a => a.Id == attributeId && a.ProductId == productId, cancellationToken);
        if (!ok)
            throw new KeyNotFoundException("Không tìm thấy thuộc tính trong sản phẩm này");
    }

    private async Task EnsureValueUniqueInAttributeAsync(
        int attributeId,
        string valueText,
        int? exceptValueId,
        CancellationToken cancellationToken)
    {
        var q = valueRepo.Get()
            .Where(v => v.AttributeId == attributeId && v.Value.ToLower() == valueText.ToLower());

        if (exceptValueId.HasValue)
            q = q.Where(v => v.Id != exceptValueId.Value);

        if (await q.AnyAsync(cancellationToken))
            throw new InvalidOperationException("Giá trị này đã tồn tại trong thuộc tính");
    }
}
