using BE_API.Dto.Inventory;

namespace BE_API.Service.IService;

public interface IInventoryService
{
    Task<InventoryResponseDto> GetAsync(int productId, int variantId, CancellationToken cancellationToken = default);

    /// <summary>PUT: tạo hoặc cập nhật một dòng tồn cho variant.</summary>
    Task<InventoryResponseDto> UpsertAsync(
        int productId,
        int variantId,
        InventoryUpsertDto dto,
        CancellationToken cancellationToken = default);

    /// <summary>POST: chỉ tạo khi chưa có bản ghi; nếu đã có → conflict.</summary>
    Task<InventoryResponseDto> CreateIfNotExistsAsync(
        int productId,
        int variantId,
        InventoryUpsertDto dto,
        CancellationToken cancellationToken = default);

    /// <summary>Cập nhật ReorderPoint / SafetyStock (PUT riêng; null = xóa cấu hình).</summary>
    Task<InventoryResponseDto> UpdateReorderPolicyAsync(
        int productId,
        int variantId,
        InventoryReorderPolicyDto dto,
        CancellationToken cancellationToken = default);
}
