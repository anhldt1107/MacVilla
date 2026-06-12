using System.ComponentModel.DataAnnotations;

namespace BE_API.Dto.Category;

public class CategoryCreateDto
{
    public int? ParentId { get; set; }

    [Required(ErrorMessage = "Tên danh mục là bắt buộc.")]
    [MaxLength(500)]
    public string Name { get; set; } = string.Empty;

    /// <summary>Để trống sẽ tự sinh từ <see cref="Name"/>.</summary>
    [MaxLength(450)]
    public string? Slug { get; set; }

    /// <summary>Link ảnh đại diện (tuỳ chọn).</summary>
    [MaxLength(2048)]
    public string? ImageUrl { get; set; }
}
