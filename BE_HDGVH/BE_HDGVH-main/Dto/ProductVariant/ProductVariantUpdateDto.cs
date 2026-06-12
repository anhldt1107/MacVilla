using System.ComponentModel.DataAnnotations;

namespace BE_API.Dto.ProductVariant;

public class ProductVariantUpdateDto
{
    [Required(ErrorMessage = "SKU là bắt buộc.")]
    [MaxLength(450)]
    public string Sku { get; set; } = string.Empty;

    [Required(ErrorMessage = "Tên biến thể là bắt buộc.")]
    [MaxLength(500)]
    public string VariantName { get; set; } = string.Empty;

    [Range(0, double.MaxValue)]
    public decimal RetailPrice { get; set; }

    [Range(0, double.MaxValue)]
    public decimal CostPrice { get; set; }

    [Range(0, double.MaxValue)]
    public decimal? Weight { get; set; }

    [MaxLength(500)]
    public string? Dimensions { get; set; }

    [MaxLength(2000)]
    public string? ImageUrl { get; set; }
}
