namespace BE_API.Entities;

public class ProductVariant : IEntity
{
    public int Id { get; set; }
    public int ProductId { get; set; }
    public string Sku { get; set; } = null!;
    public string VariantName { get; set; } = null!;
    public decimal RetailPrice { get; set; }
    public decimal CostPrice { get; set; }
    public decimal? Weight { get; set; }
    public string? Dimensions { get; set; }
    public string? ImageUrl { get; set; }

    public Product Product { get; set; } = null!;
    public ICollection<QuoteItem> QuoteItems { get; set; } = new List<QuoteItem>();
    public ICollection<OrderItem> OrderItems { get; set; } = new List<OrderItem>();
    public ICollection<Inventory> Inventories { get; set; } = new List<Inventory>();
    public ICollection<InventoryTransaction> InventoryTransactions { get; set; } = new List<InventoryTransaction>();
    public ICollection<WarrantyClaim> WarrantyClaims { get; set; } = new List<WarrantyClaim>();
    public ICollection<ReturnItem> ReturnItemsReturned { get; set; } = new List<ReturnItem>();
    public ICollection<ReturnItem> ReturnItemsExchanged { get; set; } = new List<ReturnItem>();
    public ICollection<ShoppingCartItem> ShoppingCartItems { get; set; } = new List<ShoppingCartItem>();
}
