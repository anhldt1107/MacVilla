using System.ComponentModel.DataAnnotations;

namespace BE_API.Dto.ProductAttributeValue;

public class ProductAttributeValueCreateDto
{
    [Required(ErrorMessage = "Giá trị là bắt buộc.")]
    [MaxLength(500)]
    public string Value { get; set; } = string.Empty;
}
