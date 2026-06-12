namespace BE_API.Dto.Store;

public class StoreCartDto
{
    public int CartId { get; set; }
    public DateTime UpdatedAt { get; set; }
    public List<StoreCartLineDto> Lines { get; set; } = [];
    public decimal MerchandiseSubtotal { get; set; }
}
