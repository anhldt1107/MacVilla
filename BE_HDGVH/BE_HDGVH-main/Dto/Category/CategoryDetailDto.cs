namespace BE_API.Dto.Category;

public class CategoryDetailDto
{
    public int Id { get; set; }
    public int? ParentId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string? ImageUrl { get; set; }
    public int ChildrenCount { get; set; }
    public int ProductsCount { get; set; }
}
