namespace BE_API.Dto.Category;

public class CategoryTreeNodeDto
{
    public int Id { get; set; }
    public int? ParentId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string? ImageUrl { get; set; }
    public List<CategoryTreeNodeDto> Children { get; set; } = [];
}
