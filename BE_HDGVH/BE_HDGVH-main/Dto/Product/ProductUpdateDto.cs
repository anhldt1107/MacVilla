using System.ComponentModel.DataAnnotations;

namespace BE_API.Dto.Product;

public class ProductUpdateDto
{
    [Required]
    public int CategoryId { get; set; }

    [Required(ErrorMessage = "Tên sản phẩm là bắt buộc.")]
    [MaxLength(500)]
    public string Name { get; set; } = string.Empty;

    [Required(ErrorMessage = "Slug là bắt buộc.")]
    [MaxLength(450)]
    public string Slug { get; set; } = string.Empty;

    public string? Description { get; set; }

    /// <summary>Không gửi field hoặc null = giữ nguyên; <c>""</c> = xóa ảnh đại diện.</summary>
    [MaxLength(2048)]
    public string? ImageUrl { get; set; }

    [Range(0, double.MaxValue, ErrorMessage = "Giá cơ sở không được âm.")]
    public decimal? BasePrice { get; set; }

    [Range(0, 1200)]
    public int WarrantyPeriodMonths { get; set; }

    [Required(ErrorMessage = "Trạng thái là bắt buộc.")]
    [MaxLength(50)]
    public string Status { get; set; } = string.Empty;
}
