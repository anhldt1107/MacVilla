using System.ComponentModel.DataAnnotations;

namespace BE_API.Dto.ProductAttribute;

public class ProductAttributeCreateDto
{
    [Required(ErrorMessage = "Tên thuộc tính là bắt buộc.")]
    [MaxLength(500)]
    public string Name { get; set; } = string.Empty;
}
