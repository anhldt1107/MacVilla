namespace BE_API.Dto.Store;

/// <summary>Nhóm giá trị thuộc tính dùng xây bộ lọc storefront.</summary>
public class StoreProductAttributeFilterGroupDto
{
    public string AttributeName { get; set; } = string.Empty;
    public List<StoreProductAttributeFilterValueDto> Values { get; set; } = new();
}

public class StoreProductAttributeFilterValueDto
{
    public int Id { get; set; }
    public string Value { get; set; } = string.Empty;
}
