namespace BE_API.Authorization;

/// <summary>
/// Tên policy cho <see cref="Microsoft.AspNetCore.Authorization.AuthorizeAttribute.Policy"/>.
/// Ưu tiên dùng policy thay vì chuỗi role rải rác trong controller để sau này đổi sang permission-based dễ hơn.
/// </summary>
public static class Policies
{
    /// <summary>Chỉ Admin — ví dụ quản lý role, cấu hình nhạy cảm.</summary>
    public const string AdminOnly = nameof(AdminOnly);

    /// <summary>Nhân sự nội bộ đã đăng nhập (bất kỳ role).</summary>
    public const string StaffAuthenticated = nameof(StaffAuthenticated);

    /// <summary>Quản lý nghiệp vụ: Admin + Manager (duyệt báo giá/đổi trả, hoàn tiền, điều chỉnh công nợ, đối soát CK, báo cáo…).</summary>
    public const string ManagerOrAdmin = nameof(ManagerOrAdmin);

    /// <summary>Admin + Manager + StockManager — tra cứu danh sách nhân sự (read-only) khi cần vượt quá phạm vi ManagerOrAdmin.</summary>
    public const string ManagerOrAdminOrStockManager = nameof(ManagerOrAdminOrStockManager);

    /// <summary>Kho và tồn: Admin, Manager, StockManager, Worker.</summary>
    public const string WarehouseStaff = nameof(WarehouseStaff);

    /// <summary>Khách hàng B2C đã đăng nhập (JWT cửa hàng).</summary>
    public const string CustomerAuthenticated = nameof(CustomerAuthenticated);
}
