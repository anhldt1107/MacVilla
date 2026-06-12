using System.ComponentModel.DataAnnotations;

namespace BE_API.Dto.Store;

/// <summary>Body chung preview / tạo đơn. Preview: <see cref="PaymentMethod"/> có thể bỏ.</summary>
public class StoreOrderCheckoutDto
{
    public int? ShippingAddressId { get; set; }

    [MaxLength(450)]
    public string? VoucherCode { get; set; }

    [MaxLength(100)]
    public string? PaymentMethod { get; set; }
}
