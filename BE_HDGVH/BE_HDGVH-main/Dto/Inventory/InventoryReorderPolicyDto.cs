namespace BE_API.Dto.Inventory;

/// <summary>Cập nhật chính sách đặt hàng lại theo SKU (PUT riêng để tránh PUT tồn ghi đè nhầm khi field bị bỏ qua trong JSON).</summary>
public class InventoryReorderPolicyDto
{
    /// <summary>Ngưỡng tồn khả dụng để coi là cần bổ sung; null = xóa cấu hình (dùng ngưỡng mặc định từ API báo cáo/kho).</summary>
    public int? ReorderPoint { get; set; }

    /// <summary>Tồn an toàn tối thiểu mong muốn (≤ ReorderPoint khi cả hai có giá trị).</summary>
    public int? SafetyStock { get; set; }
}
