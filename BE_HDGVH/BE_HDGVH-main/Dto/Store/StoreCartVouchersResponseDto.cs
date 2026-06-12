namespace BE_API.Dto.Store;

/// <summary>Kết quả gợi ý mã giảm giá trên trang giỏ (B2C).</summary>
public class StoreCartVouchersResponseDto
{
    /// <summary>Tạm tính hàng trong giỏ (chỉ SP Active; không kiểm tra tồn kho).</summary>
    public decimal MerchandiseSubtotal { get; set; }

    public List<StoreCartVoucherListItemDto> Items { get; set; } = [];
}

public class StoreCartVoucherListItemDto
{
    public int VoucherId { get; set; }
    public string Code { get; set; } = string.Empty;
    public string? DiscountType { get; set; }
    public decimal DiscountValue { get; set; }
    public decimal MinOrderValue { get; set; }
    public decimal? MaxDiscountAmount { get; set; }
    public string? CampaignName { get; set; }

    /// <summary>Mã còn hiệu lực (thời gian, trạng thái, lượt dùng).</summary>
    public bool Eligible { get; set; }

    /// <summary>Áp dụng được cho giỏ hiện tại: <see cref="Eligible"/> và đạt <see cref="MinOrderValue"/>.</summary>
    public bool ApplicableToCart { get; set; }

    /// <summary>Số tiền giảm nếu <see cref="ApplicableToCart"/>; ngược lại null.</summary>
    public decimal? DiscountAmount { get; set; }

    public string? Message { get; set; }
}
