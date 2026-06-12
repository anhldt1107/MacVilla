namespace BE_API.Dto.ProductAttribute;

public class ProductAttributeDetailDto
{
    public int Id { get; set; }
    public int ProductId { get; set; }
    public string Name { get; set; } = string.Empty;
    public List<ProductAttributeValueItemDto> Values { get; set; } = [];
}
