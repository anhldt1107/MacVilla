namespace BE_API.Entities;

public class ProductAttributeValue : IEntity
{
    public int Id { get; set; }
    public int AttributeId { get; set; }
    public string Value { get; set; } = null!;

    public ProductAttribute Attribute { get; set; } = null!;
}
