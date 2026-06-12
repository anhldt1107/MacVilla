namespace BE_API.Domain;

public static class CustomerTypes
{
    public const string B2C = "B2C";
    public const string B2B = "B2B";

    public static readonly string[] All = [B2C, B2B];

    public static bool IsValid(string type)
        => All.Contains(type, StringComparer.OrdinalIgnoreCase);
}
