namespace BE_API.Dto.Store;

public class StoreB2BLoginResponseDto
{
    public string AccessToken { get; set; } = string.Empty;
    public DateTimeOffset ExpiresAtUtc { get; set; }
    public StoreB2BProfileDto Customer { get; set; } = null!;
}
