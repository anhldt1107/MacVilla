using System.ComponentModel.DataAnnotations;

namespace BE_API.Dto.Store;

public class StoreCartSetQuantityDto
{
    /// <summary>Đặt 0 để xóa dòng khỏi giỏ.</summary>
    [Range(0, 1_000_000)]
    public int Quantity { get; set; }
}
