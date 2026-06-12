namespace BE_API.Dto.Admin.Dashboard;

public class RevenueOverviewDto
{
    public DateTime? FromDate { get; set; }
    public DateTime? ToDate { get; set; }
    public decimal NetRevenue { get; set; }
    public decimal TotalIn { get; set; }
    public decimal TotalOut { get; set; }
    public int OrderCount { get; set; }
    public int CancelledOrderCount { get; set; }
    public decimal TotalOrderValue { get; set; }
    public decimal AverageOrderValue { get; set; }
    public decimal RefundRate { get; set; }
    public int NewCustomerCount { get; set; }
}

public class RevenueTimeseriesDto
{
    public string Granularity { get; set; } = DashboardGranularities.Day;
    public List<TimeseriesPointDto> Points { get; set; } = [];
}

public class RevenueByPaymentMethodDto
{
    public List<AmountBucketDto> Buckets { get; set; } = [];
    public decimal Total { get; set; }
}

public class RevenueByChannelPointDto
{
    public string Bucket { get; set; } = string.Empty;
    public decimal B2c { get; set; }
    public decimal B2b { get; set; }
}

public class RevenueByChannelDto
{
    public string Granularity { get; set; } = DashboardGranularities.Day;
    public List<RevenueByChannelPointDto> Points { get; set; } = [];
    public RevenueByChannelTotalsDto Totals { get; set; } = new();
}

public class RevenueByChannelTotalsDto
{
    public decimal B2c { get; set; }
    public decimal B2b { get; set; }
}
