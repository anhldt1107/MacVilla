using BE_API.Domain;
using BE_API.Dto.Common;
using BE_API.Dto.InventoryTransaction;
using BE_API.Entities;
using BE_API.Repository;
using BE_API.Service.IService;
using Microsoft.EntityFrameworkCore;

namespace BE_API.Service;

public class AdminInventoryTransactionService(
    IRepository<InventoryTransaction> transactionRepo,
    IRepository<ProductVariant> variantRepo,
    IRepository<Inventory> inventoryRepo) : IAdminInventoryTransactionService
{
    public async Task<PagedResultDto<InventoryTransactionListItemDto>> GetTransactionsPagedAsync(
        int page,
        int pageSize,
        int? variantId,
        string? transactionType,
        DateTime? fromDate,
        DateTime? toDate,
        string? referenceType = null,
        string? referenceId = null,
        int? workerIdAssigned = null,
        CancellationToken cancellationToken = default)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 200);

        var query = transactionRepo.Get().AsNoTracking();

        if (variantId.HasValue)
            query = query.Where(t => t.VariantId == variantId.Value);

        if (!string.IsNullOrWhiteSpace(transactionType))
            query = query.Where(t => t.TransactionType == transactionType);

        if (fromDate.HasValue)
            query = query.Where(t => t.Timestamp >= fromDate.Value);

        if (toDate.HasValue)
            query = query.Where(t => t.Timestamp <= toDate.Value);

        if (!string.IsNullOrWhiteSpace(referenceType))
            query = query.Where(t => t.ReferenceType == referenceType);

        if (!string.IsNullOrWhiteSpace(referenceId))
            query = query.Where(t => t.ReferenceId == referenceId);

        if (workerIdAssigned.HasValue)
            query = query.Where(t => t.WorkerIdAssigned == workerIdAssigned.Value);

        var total = await query.CountAsync(cancellationToken);

        var items = await query
            .OrderByDescending(t => t.Timestamp)
            .ThenByDescending(t => t.Id)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(t => new InventoryTransactionListItemDto
            {
                Id = t.Id,
                VariantId = t.VariantId,
                VariantSku = t.Variant.Sku,
                VariantName = t.Variant.VariantName,
                ProductName = t.Variant.Product.Name,
                TransactionType = t.TransactionType,
                Quantity = t.Quantity,
                ReferenceType = t.ReferenceType,
                ReferenceId = t.ReferenceId,
                Timestamp = t.Timestamp
            })
            .ToListAsync(cancellationToken);

        return new PagedResultDto<InventoryTransactionListItemDto>
        {
            Items = items,
            TotalCount = total,
            Page = page,
            PageSize = pageSize
        };
    }

    public async Task<InventoryTransactionDetailDto> GetTransactionByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        var dto = await transactionRepo.Get()
            .AsNoTracking()
            .Where(t => t.Id == id)
            .Select(t => new InventoryTransactionDetailDto
            {
                Id = t.Id,
                VariantId = t.VariantId,
                VariantSku = t.Variant.Sku,
                VariantName = t.Variant.VariantName,
                ProductName = t.Variant.Product.Name,
                TransactionType = t.TransactionType,
                Quantity = t.Quantity,
                ReferenceType = t.ReferenceType,
                ReferenceId = t.ReferenceId,
                Notes = t.Notes,
                WorkerIdAssigned = t.WorkerIdAssigned,
                WorkerName = t.WorkerAssigned != null ? t.WorkerAssigned.FullName : null,
                ManagerIdApproved = t.ManagerIdApproved,
                ManagerName = t.ManagerApproved != null ? t.ManagerApproved.FullName : null,
                Timestamp = t.Timestamp
            })
            .FirstOrDefaultAsync(cancellationToken)
            ?? throw new KeyNotFoundException("Không tìm thấy giao dịch kho");

        return dto;
    }

    public async Task<InventoryTransactionDetailDto> CreateTransactionAsync(
        InventoryTransactionCreateDto dto,
        int createdByUserId,
        CancellationToken cancellationToken = default)
    {
        var transactionType = dto.TransactionType.Trim().ToUpperInvariant();
        if (!TransactionTypes.IsValid(transactionType))
            throw new InvalidOperationException($"Loại giao dịch không hợp lệ. Các giá trị hợp lệ: {string.Join(", ", TransactionTypes.All)}");

        var variant = await variantRepo.Get()
            .FirstOrDefaultAsync(v => v.Id == dto.VariantId, cancellationToken)
            ?? throw new KeyNotFoundException("Không tìm thấy biến thể sản phẩm");

        var inventory = await inventoryRepo.Get()
            .FirstOrDefaultAsync(i => i.VariantId == dto.VariantId, cancellationToken);

        ValidateAndApplyTransaction(inventory, transactionType, dto.Quantity);

        if (inventory != null)
        {
            inventoryRepo.Update(inventory);
        }
        else
        {
            inventory = new Inventory
            {
                VariantId = dto.VariantId,
                QuantityOnHand = 0,
                QuantityReserved = 0,
                QuantityAvailable = 0
            };
            ValidateAndApplyTransaction(inventory, transactionType, dto.Quantity);
            await inventoryRepo.AddAsync(inventory, cancellationToken);
        }

        var entity = new InventoryTransaction
        {
            VariantId = dto.VariantId,
            TransactionType = transactionType,
            Quantity = dto.Quantity,
            ReferenceType = dto.ReferenceType?.Trim(),
            ReferenceId = dto.ReferenceId?.Trim(),
            Notes = dto.Notes?.Trim(),
            WorkerIdAssigned = createdByUserId,
            Timestamp = DateTime.UtcNow
        };

        await transactionRepo.AddAsync(entity, cancellationToken);
        await transactionRepo.SaveChangesAsync(cancellationToken);

        return await GetTransactionByIdAsync(entity.Id, cancellationToken);
    }

    private static void ValidateAndApplyTransaction(Inventory? inventory, string transactionType, int quantity)
    {
        if (inventory == null)
        {
            if (transactionType == TransactionTypes.In)
            {
                if (quantity <= 0)
                    throw new InvalidOperationException("Số lượng nhập kho phải lớn hơn 0");
                return;
            }
            throw new InvalidOperationException("Không có tồn kho để thực hiện giao dịch này");
        }

        switch (transactionType)
        {
            case TransactionTypes.In:
                if (quantity <= 0)
                    throw new InvalidOperationException("Số lượng nhập kho phải lớn hơn 0");
                inventory.QuantityOnHand += quantity;
                inventory.QuantityAvailable = inventory.QuantityOnHand - inventory.QuantityReserved;
                break;

            case TransactionTypes.Out:
                if (quantity <= 0)
                    throw new InvalidOperationException("Số lượng xuất kho phải lớn hơn 0");
                if (inventory.QuantityAvailable < quantity)
                    throw new InvalidOperationException($"Không đủ số lượng khả dụng để xuất kho. Khả dụng: {inventory.QuantityAvailable}, Yêu cầu: {quantity}");
                inventory.QuantityOnHand -= quantity;
                inventory.QuantityAvailable = inventory.QuantityOnHand - inventory.QuantityReserved;
                break;

            case TransactionTypes.Adjust:
                inventory.QuantityOnHand += quantity;
                if (inventory.QuantityOnHand < 0)
                    throw new InvalidOperationException("Tồn kho sau điều chỉnh không được âm");
                inventory.QuantityAvailable = inventory.QuantityOnHand - inventory.QuantityReserved;
                if (inventory.QuantityAvailable < 0)
                    throw new InvalidOperationException("Số lượng khả dụng sau điều chỉnh không được âm");
                break;

            case TransactionTypes.Reserve:
                if (quantity <= 0)
                    throw new InvalidOperationException("Số lượng giữ hàng phải lớn hơn 0");
                if (inventory.QuantityAvailable < quantity)
                    throw new InvalidOperationException($"Không đủ số lượng khả dụng để giữ hàng. Khả dụng: {inventory.QuantityAvailable}, Yêu cầu: {quantity}");
                inventory.QuantityReserved += quantity;
                inventory.QuantityAvailable = inventory.QuantityOnHand - inventory.QuantityReserved;
                break;

            case TransactionTypes.Release:
                if (quantity <= 0)
                    throw new InvalidOperationException("Số lượng trả reserve phải lớn hơn 0");
                if (inventory.QuantityReserved < quantity)
                    throw new InvalidOperationException($"Không đủ số lượng đang giữ để trả. Đang giữ: {inventory.QuantityReserved}, Yêu cầu: {quantity}");
                inventory.QuantityReserved -= quantity;
                inventory.QuantityAvailable = inventory.QuantityOnHand - inventory.QuantityReserved;
                break;

            default:
                throw new InvalidOperationException($"Loại giao dịch không được hỗ trợ: {transactionType}");
        }
    }
}
