namespace BE_API.Dto.Admin.Dashboard;

public class StatusBreakdownDto
{
    public List<CountBucketDto> Buckets { get; set; } = [];
    public int Total { get; set; }
}

public class SlaConfirmedToShippedDto
{
    public decimal? AvgHours { get; set; }
    public decimal? P50Hours { get; set; }
    public decimal? P90Hours { get; set; }
    public int SampleSize { get; set; }
    public List<CountBucketDto> Histogram { get; set; } = [];
}

public class LateOrderItemDto
{
    public int OrderId { get; set; }
    public string OrderCode { get; set; } = string.Empty;
    public string CustomerName { get; set; } = string.Empty;
    public string OrderStatus { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public decimal ElapsedHours { get; set; }
    public string? SalesName { get; set; }
}

public class LateOrdersDto
{
    public int SlaHours { get; set; }
    public List<LateOrderItemDto> Items { get; set; } = [];
}
