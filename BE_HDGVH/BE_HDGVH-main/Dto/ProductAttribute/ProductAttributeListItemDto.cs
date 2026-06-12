namespace BE_API.Dto.ProductAttribute;

public class ProductAttributeListItemDto
{
    public int Id { get; set; }
    public int ProductId { get; set; }
    public string Name { get; set; } = string.Empty;
    public int ValuesCount { get; set; }
}
