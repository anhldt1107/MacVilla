using BE_API.Dto.Inventory;
using BE_API.Entities;
using BE_API.Repository;
using BE_API.Service.IService;
using Microsoft.EntityFrameworkCore;

namespace BE_API.Service;

public class InventoryService(IRepository<ProductVariant> variantRepo, IRepository<Inventory> inventoryRepo)
    : IInventoryService
{
    public async Task<InventoryResponseDto> GetAsync(int productId, int variantId, CancellationToken cancellationToken = default)
    {
        await EnsureVariantInProductAsync(productId, variantId, cancellationToken);

        var entity = await inventoryRepo.Get()
            .AsNoTracking()
            .FirstOrDefaultAsync(i => i.VariantId == variantId, cancellationToken)
            ?? throw new KeyNotFoundException("Chưa có bản ghi tồn kho cho biến thể này");

        return Map(entity);
    }

    public async Task<InventoryResponseDto> UpsertAsync(
        int productId,
        int variantId,
        InventoryUpsertDto dto,
        CancellationToken cancellationToken = default)
    {
        await EnsureVariantInProductAsync(productId, variantId, cancellationToken);
        ValidateQuantities(dto);

        var available = dto.QuantityOnHand - dto.QuantityReserved;
        var location = string.IsNullOrWhiteSpace(dto.WarehouseLocation) ? null : dto.WarehouseLocation.Trim();

        var entity = await inventoryRepo.Get()
            .FirstOrDefaultAsync(i => i.VariantId == variantId, cancellationToken);

        if (entity is null)
        {
            entity = new Inventory
            {
                VariantId = variantId,
                WarehouseLocation = location,
                QuantityOnHand = dto.QuantityOnHand,
                QuantityReserved = dto.QuantityReserved,
                QuantityAvailable = available
            };
            await inventoryRepo.AddAsync(entity, cancellationToken);
        }
        else
        {
            entity.WarehouseLocation = location;
            entity.QuantityOnHand = dto.QuantityOnHand;
            entity.QuantityReserved = dto.QuantityReserved;
            entity.QuantityAvailable = available;
            inventoryRepo.Update(entity);
        }

        await inventoryRepo.SaveChangesAsync(cancellationToken);
        return Map(entity);
    }

    public async Task<InventoryResponseDto> CreateIfNotExistsAsync(
        int productId,
        int variantId,
        InventoryUpsertDto dto,
        CancellationToken cancellationToken = default)
    {
        await EnsureVariantInProductAsync(productId, variantId, cancellationToken);

        var exists = await inventoryRepo.Get().AnyAsync(i => i.VariantId == variantId, cancellationToken);
        if (exists)
            throw new InvalidOperationException("Biến thể đã có bản ghi tồn kho; dùng PUT để cập nhật.");

        return await UpsertAsync(productId, variantId, dto, cancellationToken);
    }

    public async Task<InventoryResponseDto> UpdateReorderPolicyAsync(
        int productId,
        int variantId,
        InventoryReorderPolicyDto dto,
        CancellationToken cancellationToken = default)
    {
        await EnsureVariantInProductAsync(productId, variantId, cancellationToken);
        ValidateReorderPolicy(dto);

        var entity = await inventoryRepo.Get()
            .FirstOrDefaultAsync(i => i.VariantId == variantId, cancellationToken)
            ?? throw new KeyNotFoundException("Chưa có bản ghi tồn kho cho biến thể này");

        entity.ReorderPoint = dto.ReorderPoint;
        entity.SafetyStock = dto.SafetyStock;
        inventoryRepo.Update(entity);
        await inventoryRepo.SaveChangesAsync(cancellationToken);
        return Map(entity);
    }

    private static void ValidateQuantities(InventoryUpsertDto dto)
    {
        if (dto.QuantityReserved > dto.QuantityOnHand)
            throw new ArgumentException("Số lượng giữ chỗ không được lớn hơn tồn thực tế.");
    }

    private async Task EnsureVariantInProductAsync(int productId, int variantId, CancellationToken cancellationToken)
    {
        var ok = await variantRepo.Get()
            .AnyAsync(v => v.Id == variantId && v.ProductId == productId, cancellationToken);
        if (!ok)
            throw new KeyNotFoundException("Không tìm thấy biến thể trong sản phẩm này");
    }

    private static void ValidateReorderPolicy(InventoryReorderPolicyDto dto)
    {
        if (dto.ReorderPoint is < 0)
            throw new ArgumentException("ReorderPoint không được âm.");
        if (dto.SafetyStock is < 0)
            throw new ArgumentException("SafetyStock không được âm.");
        if (dto.SafetyStock.HasValue && !dto.ReorderPoint.HasValue)
            throw new ArgumentException("Cần ReorderPoint khi cấu hình SafetyStock.");
        if (dto.ReorderPoint.HasValue && dto.SafetyStock.HasValue && dto.SafetyStock.Value > dto.ReorderPoint.Value)
            throw new ArgumentException("SafetyStock không được lớn hơn ReorderPoint.");
    }

    private static InventoryResponseDto Map(Inventory i) => new()
    {
        Id = i.Id,
        VariantId = i.VariantId,
        WarehouseLocation = i.WarehouseLocation,
        QuantityOnHand = i.QuantityOnHand,
        QuantityReserved = i.QuantityReserved,
        QuantityAvailable = i.QuantityAvailable,
        ReorderPoint = i.ReorderPoint,
        SafetyStock = i.SafetyStock
    };
}
