namespace BE_API.Dto.ProductAttributeValue;

public class ProductAttributeValueResponseDto
{
    public int Id { get; set; }
    public int AttributeId { get; set; }
    public string Value { get; set; } = string.Empty;
}
