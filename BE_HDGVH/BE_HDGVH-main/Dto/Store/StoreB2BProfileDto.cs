namespace BE_API.Dto.Store;

public class StoreB2BProfileDto
{
    public int Id { get; set; }
    public string CustomerType { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string Phone { get; set; } = string.Empty;
    public string CompanyName { get; set; } = string.Empty;
    public string? TaxCode { get; set; }
    public string? CompanyAddress { get; set; }
    public decimal DebtBalance { get; set; }
}
