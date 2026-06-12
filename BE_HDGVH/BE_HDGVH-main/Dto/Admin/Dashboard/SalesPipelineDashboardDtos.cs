namespace BE_API.Dto.Admin.Dashboard;

public class FunnelStepDto
{
    public string Status { get; set; } = string.Empty;
    public int Count { get; set; }
    public decimal TotalValue { get; set; }
}

public class FunnelDto
{
    public List<FunnelStepDto> Steps { get; set; } = [];
}

public class SalesConversionDto
{
    public decimal AcceptRate { get; set; }
    public decimal ConversionRate { get; set; }
    public decimal? AvgTimeRequestedToApprovedDays { get; set; }
    public decimal? AvgTimeApprovedToAcceptedDays { get; set; }
    public int ApprovedQuoteCount { get; set; }
    public int AcceptedQuoteCount { get; set; }
    public int ConvertedQuoteCount { get; set; }
}

public class TimeInStageDto
{
    public string From { get; set; } = string.Empty;
    public string To { get; set; } = string.Empty;
    public decimal? AvgDays { get; set; }
    public int SampleSize { get; set; }
}

public class TimeInStageListDto
{
    public List<TimeInStageDto> Stages { get; set; } = [];
}

public class ExpiringQuoteDto
{
    public int QuoteId { get; set; }
    public string QuoteCode { get; set; } = string.Empty;
    public string CustomerName { get; set; } = string.Empty;
    public int? SalesId { get; set; }
    public string? SalesName { get; set; }
    public decimal? FinalAmount { get; set; }
    public DateTime? ValidUntil { get; set; }
    public decimal? DaysUntilExpire { get; set; }
}

public class ExpiringQuotesDto
{
    public List<ExpiringQuoteDto> Items { get; set; } = [];
}
