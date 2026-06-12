using System.ComponentModel.DataAnnotations;

namespace BE_API.Dto.Product;

public class ProductCreateDto
{
    [Required]
    public int CategoryId { get; set; }

    [Required(ErrorMessage = "Tên sản phẩm là bắt buộc.")]
    [MaxLength(500)]
    public string Name { get; set; } = string.Empty;

    /// <summary>Để trống sẽ tự sinh từ <see cref="Name"/>.</summary>
    [MaxLength(450)]
    public string? Slug { get; set; }

    public string? Description { get; set; }

    /// <summary>Ảnh đại diện (URL đầy đủ), tuỳ chọn.</summary>
    [MaxLength(2048)]
    public string? ImageUrl { get; set; }

    [Range(0, double.MaxValue, ErrorMessage = "Giá cơ sở không được âm.")]
    public decimal? BasePrice { get; set; }

    [Range(0, 1200)]
    public int WarrantyPeriodMonths { get; set; }

    /// <summary>Mặc định Active nếu để trống.</summary>
    [MaxLength(50)]
    public string? Status { get; set; }
}
