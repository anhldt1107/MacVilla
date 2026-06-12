using System.ComponentModel.DataAnnotations;

namespace BE_API.Dto.Store;

public class StoreCartAddItemDto
{
    [Required]
    public int VariantId { get; set; }

    [Range(1, 1_000_000)]
    public int Quantity { get; set; } = 1;
}
