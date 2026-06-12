namespace BE_API.Dto.Store;

public class StorePayOsCreatePaymentResponseDto
{
    public string OrderCode { get; set; } = "";
    public int PayOsOrderCode { get; set; }
    public long Amount { get; set; }
    public string CheckoutUrl { get; set; } = "";
    public string? PaymentLinkId { get; set; }
    public DateTime? LinkExpiresAtUtc { get; set; }
}
