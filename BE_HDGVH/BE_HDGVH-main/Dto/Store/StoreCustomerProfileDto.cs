namespace BE_API.Dto.Store;

public class StoreCustomerProfileDto
{
    public int Id { get; set; }
    public string CustomerType { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string Phone { get; set; } = string.Empty;
}
