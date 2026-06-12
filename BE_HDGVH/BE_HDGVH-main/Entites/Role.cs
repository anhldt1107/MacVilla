namespace BE_API.Entities;

public class Role : IEntity
{
    public int Id { get; set; }
    public string RoleName { get; set; } = null!;
    public string? Description { get; set; }
    public string? Permissions { get; set; }

    public ICollection<AppUser> Users { get; set; } = new List<AppUser>();
}
