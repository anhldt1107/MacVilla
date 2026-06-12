namespace BE_API.Dto.Store;

public class StoreOrderTimelineDto
{
    public string OrderCode { get; set; } = string.Empty;
    public string CurrentOrderStatus { get; set; } = string.Empty;
    public string CurrentPaymentStatus { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public List<StoreOrderTimelineEventDto> Events { get; set; } = [];
}

public class StoreOrderTimelineEventDto
{
    /// <summary>Loại sự kiện: Order / Fulfillment / Payment / Invoice / Return.</summary>
    public string EventType { get; set; } = string.Empty;

    public string Status { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public DateTime Timestamp { get; set; }
    public int? ReferenceId { get; set; }
    public string? Notes { get; set; }
}

public class StoreOrderCancelDto
{
    /// <summary>Lý do khách huỷ đơn (tuỳ chọn nhưng khuyên FE bắt buộc).</summary>
    public string? CancelReason { get; set; }
}

public class StoreOrderReorderResponseDto
{
    /// <summary>Những dòng đã thêm vào giỏ.</summary>
    public List<StoreOrderReorderItemDto> AddedItems { get; set; } = [];

    /// <summary>Những dòng không thêm được (hết hàng / SKU ngừng bán / đổi SKU).</summary>
    public List<StoreOrderReorderSkippedDto> SkippedItems { get; set; } = [];

    public string Message { get; set; } = string.Empty;
}

public class StoreOrderReorderItemDto
{
    public int VariantId { get; set; }
    public string Sku { get; set; } = string.Empty;
    public int Quantity { get; set; }
}

public class StoreOrderReorderSkippedDto
{
    public int VariantId { get; set; }
    public string? Sku { get; set; }
    public int RequestedQuantity { get; set; }
    public string Reason { get; set; } = string.Empty;
}
