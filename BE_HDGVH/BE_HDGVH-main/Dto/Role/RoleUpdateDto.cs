namespace BE_API.Dto.Role
{
    public class RoleUpdateDto
    {
        public string RoleName { get; set; } = null!;
        public string? Description { get; set; }
        public string? Permissions { get; set; }
    }
}
