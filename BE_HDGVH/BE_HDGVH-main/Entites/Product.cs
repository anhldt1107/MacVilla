namespace BE_API.Entities;

public class Product : IEntity
{
    public int Id { get; set; }
    public int CategoryId { get; set; }
    public string Name { get; set; } = null!;
    public string Slug { get; set; } = null!;
    public string? Description { get; set; }
    /// <summary>Ảnh đại diện sản phẩm (catalog / list). Tuỳ chọn; có thể bổ sung ảnh từng biến thể riêng.</summary>
    public string? ImageUrl { get; set; }
    public decimal? BasePrice { get; set; }
    public int WarrantyPeriodMonths { get; set; }
    public string Status { get; set; } = "Active";

    public Category Category { get; set; } = null!;
    public ICollection<ProductAttribute> Attributes { get; set; } = new List<ProductAttribute>();
    public ICollection<ProductVariant> Variants { get; set; } = new List<ProductVariant>();
}
