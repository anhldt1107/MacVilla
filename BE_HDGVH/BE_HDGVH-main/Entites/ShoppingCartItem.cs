namespace BE_API.Entities;

public class ShoppingCartItem : IEntity
{
    public int Id { get; set; }
    public int ShoppingCartId { get; set; }
    public int VariantId { get; set; }
    public int Quantity { get; set; }

    public ShoppingCart ShoppingCart { get; set; } = null!;
    public ProductVariant Variant { get; set; } = null!;
}
