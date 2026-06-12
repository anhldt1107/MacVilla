using System.ComponentModel.DataAnnotations;

namespace BE_API.Dto.InventoryTransaction;

public class InventoryTransactionCreateDto
{
    [Required(ErrorMessage = "Mã biến thể sản phẩm là bắt buộc.")]
    public int VariantId { get; set; }

    /// <summary>Loại giao dịch: IN (nhập), OUT (xuất), ADJUST (điều chỉnh), RESERVE (giữ hàng), RELEASE (trả reserve).</summary>
    [Required(ErrorMessage = "Loại giao dịch là bắt buộc.")]
    [MaxLength(50)]
    public string TransactionType { get; set; } = string.Empty;

    /// <summary>Số lượng (dương cho IN/RESERVE, âm cho OUT/RELEASE, có thể âm hoặc dương cho ADJUST).</summary>
    [Required(ErrorMessage = "Số lượng là bắt buộc.")]
    public int Quantity { get; set; }

    /// <summary>Loại chứng từ tham chiếu (ví dụ: Order, PurchaseOrder, Manual).</summary>
    [MaxLength(100)]
    public string? ReferenceType { get; set; }

    /// <summary>Mã chứng từ tham chiếu.</summary>
    [MaxLength(100)]
    public string? ReferenceId { get; set; }

    /// <summary>Ghi chú về giao dịch.</summary>
    [MaxLength(1000)]
    public string? Notes { get; set; }
}
