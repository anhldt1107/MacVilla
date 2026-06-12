namespace BE_API.Domain;

public static class CampaignStatuses
{
    public const string Active = "Active";
    public const string Inactive = "Inactive";
    public const string Expired = "Expired";

    public static readonly string[] All = [Active, Inactive, Expired];

    public static bool IsValid(string? status)
        => !string.IsNullOrWhiteSpace(status) && All.Contains(status, StringComparer.OrdinalIgnoreCase);
}
