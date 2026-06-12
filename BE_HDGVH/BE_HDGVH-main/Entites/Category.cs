namespace BE_API.Entities;

public class Category : IEntity
{
    public int Id { get; set; }
    public int? ParentId { get; set; }
    public string Name { get; set; } = null!;
    public string Slug { get; set; } = null!;
    /// <summary>URL ảnh đại diện danh mục (Cloudinary hoặc CDN).</summary>
    public string? ImageUrl { get; set; }

    public Category? Parent { get; set; }
    public ICollection<Category> Children { get; set; } = new List<Category>();
    public ICollection<Product> Products { get; set; } = new List<Product>();
}
