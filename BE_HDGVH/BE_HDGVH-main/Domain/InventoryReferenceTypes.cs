namespace BE_API.Domain;

/// <summary>Giá trị <see cref="Entities.InventoryTransaction.ReferenceType"/> cho các luồng tự động.</summary>
public static class InventoryReferenceTypes
{
    /// <summary>Giữ tồn theo báo giá; <see cref="Entities.InventoryTransaction.ReferenceId"/> = Id báo giá (chuỗi).</summary>
    public const string QuoteReservation = "QuoteReservation";
}
