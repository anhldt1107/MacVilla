using BE_API.Entities;

namespace BE_API.Domain;

/// <summary>
/// Cập nhật tồn kho thống nhất (OnHand + Available).
/// </summary>
public static class InventoryQuantityHelper
{
    public static void ApplyIn(Inventory inventory, int quantity)
    {
        if (quantity <= 0)
            throw new InvalidOperationException("Số lượng nhập kho phải lớn hơn 0");

        inventory.QuantityOnHand += quantity;
        inventory.QuantityAvailable = inventory.QuantityOnHand - inventory.QuantityReserved;
    }

    public static void ApplyOut(Inventory inventory, int quantity)
    {
        if (quantity <= 0)
            throw new InvalidOperationException("Số lượng xuất kho phải lớn hơn 0");

        if (inventory.QuantityAvailable < quantity)
            throw new InvalidOperationException(
                $"Không đủ số lượng khả dụng để xuất kho. Khả dụng: {inventory.QuantityAvailable}, Yêu cầu: {quantity}");

        inventory.QuantityOnHand -= quantity;
        inventory.QuantityAvailable = inventory.QuantityOnHand - inventory.QuantityReserved;
    }
}
