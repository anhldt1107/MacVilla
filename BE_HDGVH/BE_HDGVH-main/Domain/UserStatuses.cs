namespace BE_API.Domain;

public static class UserStatuses
{
    public const string Active = "Active";
    public const string Inactive = "Inactive";

    public static readonly string[] All = [Active, Inactive];

    public static bool IsValid(string status)
        => All.Contains(status, StringComparer.OrdinalIgnoreCase);
}
