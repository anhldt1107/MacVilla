using BE_API.Database;
using BE_API.Domain;
using BE_API.Entities;
using Microsoft.EntityFrameworkCore;

namespace BE_API.Service;

/// <summary>
/// Ghi OUT tồn kho khi phiếu fulfillment chuyển Shipped (idempotent theo ReferenceType=Fulfillment).
/// </summary>
public class FulfillmentInventoryOutService(BeContext db)
{
    public static string ReferenceIdFor(int fulfillmentId) => fulfillmentId.ToString();

    public async Task<bool> HasOutPostedAsync(int fulfillmentId, CancellationToken cancellationToken = default)
    {
        var refId = ReferenceIdFor(fulfillmentId);
        return await db.InventoryTransactions.AsNoTracking().AnyAsync(
            t => t.ReferenceType == OrderFulfillmentWorkflow.InventoryReferenceType
                 && t.ReferenceId == refId
                 && t.TransactionType == TransactionTypes.Out,
            cancellationToken);
    }

    /// <summary>
    /// Trừ tồn theo từng dòng đơn. Bỏ qua nếu đã ghi OUT cho phiếu này.
    /// </summary>
    public async Task PostOutForFulfillmentAsync(
        FulfillmentTicket ticket,
        CustomerOrder order,
        int? workerIdAssigned,
        CancellationToken cancellationToken = default)
    {
        if (await HasOutPostedAsync(ticket.Id, cancellationToken))
            return;

        var lines = await db.OrderItems
            .AsNoTracking()
            .Where(i => i.OrderId == order.Id)
            .Select(i => new { i.VariantId, i.Quantity, i.SkuSnapshot })
            .ToListAsync(cancellationToken);

        if (lines.Count == 0)
            throw new InvalidOperationException("Đơn hàng không có dòng sản phẩm để xuất kho.");

        foreach (var line in lines)
        {
            if (line.Quantity <= 0) continue;

            var inventory = await db.Inventories
                .FirstOrDefaultAsync(i => i.VariantId == line.VariantId, cancellationToken);

            if (inventory == null || inventory.QuantityAvailable < line.Quantity)
            {
                var sku = line.SkuSnapshot ?? $"variant#{line.VariantId}";
                var available = inventory?.QuantityAvailable ?? 0;
                throw new InvalidOperationException(
                    $"Không đủ tồn khả dụng cho SKU {sku}. Cần {line.Quantity}, khả dụng {available}.");
            }

            inventory.QuantityOnHand -= line.Quantity;
            inventory.QuantityAvailable = inventory.QuantityOnHand - inventory.QuantityReserved;
            db.Inventories.Update(inventory);

            await db.InventoryTransactions.AddAsync(new InventoryTransaction
            {
                VariantId = line.VariantId,
                TransactionType = TransactionTypes.Out,
                Quantity = line.Quantity,
                ReferenceType = OrderFulfillmentWorkflow.InventoryReferenceType,
                ReferenceId = ReferenceIdFor(ticket.Id),
                Notes = $"Xuất kho phiếu #{ticket.Id} — đơn {order.OrderCode}",
                WorkerIdAssigned = workerIdAssigned,
                Timestamp = DateTime.UtcNow
            }, cancellationToken);
        }
    }
}
