namespace BE_API.Dto.Store;

public class StoreOrderDetailDto
{
    public string OrderCode { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public string OrderStatus { get; set; } = string.Empty;
    public string PaymentStatus { get; set; } = string.Empty;
    public string? PaymentMethod { get; set; }
    public string? VoucherCode { get; set; }
    public StoreOrderShippingAddressDto? ShippingAddress { get; set; }
    public List<StoreOrderDetailLineDto> Lines { get; set; } = [];
    public decimal MerchandiseSubtotal { get; set; }
    public decimal DiscountAmount { get; set; }
    public decimal PayableTotal { get; set; }
}

public class StoreOrderShippingAddressDto
{
    public int Id { get; set; }
    public string ReceiverName { get; set; } = string.Empty;
    public string ReceiverPhone { get; set; } = string.Empty;
    public string AddressLine { get; set; } = string.Empty;
}

public class StoreOrderDetailLineDto
{
    public int Id { get; set; }

    public int VariantId { get; set; }

    /// <summary>Tên sản phẩm (snapshot từ catalog khi tải đơn).</summary>
    public string? ProductName { get; set; }

    /// <summary>Tên biến thể (cấu hình SKU).</summary>
    public string? VariantName { get; set; }

    /// <summary>Ảnh biến thể (nếu có).</summary>
    public string? VariantImageUrl { get; set; }

    /// <summary>Ảnh đại diện sản phẩm.</summary>
    public string? ProductImageUrl { get; set; }

    public string? SkuSnapshot { get; set; }
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal SubTotal { get; set; }

    public int? ReturnableQuantity { get; set; }
    public int? WarrantyClaimableQuantity { get; set; }
}
