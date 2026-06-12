namespace BE_API.Dto.Store;

public class StorePayOsCreatePaymentDto
{
    /// <summary>Mã đơn hiển thị (OrderCode), ví dụ ORD-xxx.</summary>
    public string OrderCode { get; set; } = "";

    /// <summary>Tuỳ chọn: ghi đè returnUrl từ appsettings.</summary>
    public string? ReturnUrl { get; set; }

    /// <summary>Tuỳ chọn: ghi đè cancelUrl từ appsettings.</summary>
    public string? CancelUrl { get; set; }
}
