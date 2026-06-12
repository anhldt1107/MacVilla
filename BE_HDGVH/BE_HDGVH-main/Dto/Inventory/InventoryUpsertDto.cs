using System.ComponentModel.DataAnnotations;

namespace BE_API.Dto.Inventory;

public class InventoryUpsertDto
{
    [MaxLength(500)]
    public string? WarehouseLocation { get; set; }

    [Range(0, int.MaxValue, ErrorMessage = "Tồn thực tế không được âm.")]
    public int QuantityOnHand { get; set; }

    [Range(0, int.MaxValue, ErrorMessage = "Tồn giữ chỗ không được âm.")]
    public int QuantityReserved { get; set; }
}
