namespace BE_API.Entities;

public class ReturnItem : IEntity
{
    public int Id { get; set; }
    public int TicketId { get; set; }
    public int OrderItemId { get; set; }
    public int VariantIdReturned { get; set; }
    public int? VariantIdExchanged { get; set; }
    public int Quantity { get; set; }
    public string? InventoryAction { get; set; }

    public ReturnExchangeTicket Ticket { get; set; } = null!;
    public OrderItem OrderItem { get; set; } = null!;
    public ProductVariant VariantReturned { get; set; } = null!;
    public ProductVariant? VariantExchanged { get; set; }
}
