namespace BE_API.Dto.Store;

public class StoreCustomerLoginResponseDto
{
    public string AccessToken { get; set; } = string.Empty;
    public DateTimeOffset ExpiresAtUtc { get; set; }
    public StoreCustomerProfileDto Customer { get; set; } = null!;
}
