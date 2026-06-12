namespace BE_API.Dto.Store;

public class StoreOrderPreviewResponseDto
{
    public List<StoreOrderPreviewLineDto> Lines { get; set; } = [];
    public decimal MerchandiseSubtotal { get; set; }
    public decimal DiscountAmount { get; set; }
    public decimal PayableTotal { get; set; }
    public int? VoucherId { get; set; }
    public string? VoucherCode { get; set; }
}

public class StoreOrderPreviewLineDto
{
    public int VariantId { get; set; }
    public string Sku { get; set; } = string.Empty;
    public string ProductName { get; set; } = string.Empty;
    public string VariantName { get; set; } = string.Empty;
    public string? ImageUrl { get; set; }
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal LineSubtotal { get; set; }
}
