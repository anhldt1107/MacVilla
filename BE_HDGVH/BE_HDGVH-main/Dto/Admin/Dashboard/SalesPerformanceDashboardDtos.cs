namespace BE_API.Dto.Admin.Dashboard;

public class TopSalesItemDto
{
    public int SalesId { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string? Phone { get; set; }
    public int OrderCount { get; set; }
    public decimal TotalRevenue { get; set; }
}

public class TopSalesDto
{
    public List<TopSalesItemDto> Items { get; set; } = [];
}

public class PerSalesDetailDto
{
    public int SalesId { get; set; }
    public string FullName { get; set; } = string.Empty;
    public int QuoteCount { get; set; }
    public int ApprovedCount { get; set; }
    public int AcceptedCount { get; set; }
    public int ConvertedCount { get; set; }
    public decimal ConversionRate { get; set; }
    public int OrderCount { get; set; }
    public decimal RevenueContribution { get; set; }
}

public class QuoteConversionBySalesItemDto
{
    public int SalesId { get; set; }
    public string FullName { get; set; } = string.Empty;
    public int ApprovedCount { get; set; }
    public int ConvertedCount { get; set; }
    public decimal ConversionRate { get; set; }
}

public class QuoteConversionBySalesDto
{
    public List<QuoteConversionBySalesItemDto> Items { get; set; } = [];
}
