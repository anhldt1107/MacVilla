namespace BE_API.Entities;

public class ProductAttribute : IEntity
{
    public int Id { get; set; }
    public int ProductId { get; set; }
    public string Name { get; set; } = null!;

    public Product Product { get; set; } = null!;
    public ICollection<ProductAttributeValue> Values { get; set; } = new List<ProductAttributeValue>();
}
