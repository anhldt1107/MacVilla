namespace BE_API.Dto.Store;

public class StoreVoucherValidateResponseDto
{
    public bool Applicable { get; set; }
    public int? VoucherId { get; set; }
    public string Code { get; set; } = string.Empty;
    public string? DiscountType { get; set; }
    public decimal MinOrderValue { get; set; }
    public decimal? DiscountAmount { get; set; }
    public decimal? SubTotalAfterDiscount { get; set; }
    public string? Message { get; set; }
}
