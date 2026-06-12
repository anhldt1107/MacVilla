namespace BE_API.Authorization;

/// <summary>
/// Tên vai trò trong DB (<see cref="Entities.Role.RoleName"/>) và trong claim JWT.
/// Giữ đồng bộ với dữ liệu seed / CRUD role; thêm role mới = thêm hằng số + policy tương ứng nếu cần.
/// </summary>
public static class AppRoles
{
    public const string Admin = "admin";
    public const string Manager = "Manager";
    public const string Sales = "Sales";
    public const string StockManager = "StockManager";
    public const string Worker = "Worker";
}
