public class InstructorResponseDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public bool IsApproved { get; set; }
    public string Bio { get; set; } = string.Empty;

    // Login username of the linked User, if one exists. Null means the
    // instructor has no login account yet.
    public string? Username { get; set; }
}
