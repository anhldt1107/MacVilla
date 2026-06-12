namespace BE_API.Entities;

/// <summary>Giỏ hàng server — một giỏ / khách (<see cref="CustomerId"/> unique). Chỉ dùng cho khách đã đăng nhập.</summary>
public class ShoppingCart : IEntity
{
    public int Id { get; set; }
    public int CustomerId { get; set; }
    public DateTime UpdatedAt { get; set; }

    public Customer Customer { get; set; } = null!;
    public ICollection<ShoppingCartItem> Items { get; set; } = new List<ShoppingCartItem>();
}
