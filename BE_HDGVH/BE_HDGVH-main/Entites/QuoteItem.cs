namespace BE_API.Entities;

public class QuoteItem : IEntity
{
    public int Id { get; set; }
    public int QuoteId { get; set; }
    public int VariantId { get; set; }
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal SubTotal { get; set; }

    public Quote Quote { get; set; } = null!;
    public ProductVariant Variant { get; set; } = null!;
}
