using System.ComponentModel.DataAnnotations;

namespace BE_API.Dto.Category;

public class CategoryUpdateDto
{
    public int? ParentId { get; set; }

    [Required(ErrorMessage = "Tên danh mục là bắt buộc.")]
    [MaxLength(500)]
    public string Name { get; set; } = string.Empty;

    [Required(ErrorMessage = "Slug là bắt buộc.")]
    [MaxLength(450)]
    public string Slug { get; set; } = string.Empty;

    /// <summary>Link ảnh. Không gửi field hoặc gửi null = giữ nguyên; gửi <c>""</c> để xóa ảnh.</summary>
    [MaxLength(2048)]
    public string? ImageUrl { get; set; }
}
