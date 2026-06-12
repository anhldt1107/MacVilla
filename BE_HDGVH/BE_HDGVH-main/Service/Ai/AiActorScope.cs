namespace BE_API.Service.Ai;

/// <summary>Cờ tool được phép theo nhóm caller. Một tool có thể thuộc nhiều scope (ví dụ Staff = Admin|Manager|Sales).</summary>
[Flags]
public enum AiActorScope
{
    None = 0,
    Admin = 1 << 0,
    Manager = 1 << 1,
    Sales = 1 << 2,
    B2B = 1 << 3,
    B2C = 1 << 4,

    Staff = Admin | Manager | Sales,
    AnyCustomer = B2B | B2C
}

public static class AiActorScopeExtensions
{
    public static bool Allows(this AiActorScope scope, AiActorScope role) => (scope & role) != 0;
}
