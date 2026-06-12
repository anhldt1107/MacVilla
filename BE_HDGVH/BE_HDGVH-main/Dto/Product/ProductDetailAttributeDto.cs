namespace BE_API.Dto.Product;

public class ProductDetailAttributeDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public List<ProductDetailAttributeValueDto> Values { get; set; } = [];
}
