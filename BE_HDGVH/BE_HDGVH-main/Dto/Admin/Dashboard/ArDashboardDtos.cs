namespace BE_API.Dto.Admin.Dashboard;

public class ArSummaryDto
{
    public decimal TotalUnpaidAmount { get; set; }
    public int TotalUnpaidCount { get; set; }
    public decimal OverdueAmount { get; set; }
    public int OverdueCount { get; set; }
    public decimal DueSoonAmount { get; set; }
    public int DueSoonCount { get; set; }
    public int DueSoonWindowDays { get; set; } = 7;
}

public class ArAgingBucketDto
{
    public string Label { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public int InvoiceCount { get; set; }
    public decimal Share { get; set; }
}

public class ArAgingDto
{
    public List<ArAgingBucketDto> Buckets { get; set; } = [];
    public decimal Total { get; set; }
}

public class ArTopDebtorDto
{
    public int CustomerId { get; set; }
    public string CustomerName { get; set; } = string.Empty;
    public string CustomerType { get; set; } = string.Empty;
    public decimal RemainingTotal { get; set; }
    public decimal OverdueAmount { get; set; }
    public int InvoiceCount { get; set; }
    public decimal DebtBalance { get; set; }
}

public class ArTopDebtorsDto
{
    public List<ArTopDebtorDto> Items { get; set; } = [];
}

public class ArTimeseriesPointDto
{
    public string Bucket { get; set; } = string.Empty;
    public decimal RemainingTotal { get; set; }
    public decimal OverdueAmount { get; set; }
}

public class ArTimeseriesDto
{
    public string Granularity { get; set; } = DashboardGranularities.Day;
    public List<ArTimeseriesPointDto> Points { get; set; } = [];
}
