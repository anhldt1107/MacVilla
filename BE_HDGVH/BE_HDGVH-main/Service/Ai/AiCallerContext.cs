namespace BE_API.Service.Ai;

public class AiCallerContext
{
    /// <summary>Vai trò caller (xác định scope tools, system prompt, owner type của thread).</summary>
    public AiActorScope Role { get; init; }

    /// <summary>Tên role thân thiện để lưu DB và lookup system prompt: Admin/Manager/Sales/B2B/B2C.</summary>
    public string RoleName { get; init; } = string.Empty;

    /// <summary>"Staff" | "Customer".</summary>
    public string OwnerType { get; init; } = string.Empty;

    /// <summary>Id của AppUser (Staff) hoặc Customer (B2B/B2C).</summary>
    public int OwnerId { get; init; }

    /// <summary>Tên hiển thị (đưa vào system prompt nếu cần).</summary>
    public string? DisplayName { get; init; }

    public static AiCallerContext ForStaff(int userId, string roleName, string? displayName = null)
    {
        var role = roleName switch
        {
            "admin" or "Admin" => AiActorScope.Admin,
            "Manager" => AiActorScope.Manager,
            "Sales"   => AiActorScope.Sales,
            _ => AiActorScope.None
        };
        return new AiCallerContext
        {
            Role = role,
            RoleName = role == AiActorScope.Admin ? "Admin" : roleName,
            OwnerType = "Staff",
            OwnerId = userId,
            DisplayName = displayName
        };
    }

    public static AiCallerContext ForCustomer(int customerId, bool isB2B, string? displayName = null) =>
        new()
        {
            Role = isB2B ? AiActorScope.B2B : AiActorScope.B2C,
            RoleName = isB2B ? "B2B" : "B2C",
            OwnerType = "Customer",
            OwnerId = customerId,
            DisplayName = displayName
        };
}
