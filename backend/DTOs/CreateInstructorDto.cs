using System.ComponentModel.DataAnnotations;

public class CreateInstructorDto
{
    [Required, MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    [Required, EmailAddress]
    public string Email { get; set; } = string.Empty;

    public string Bio { get; set; } = string.Empty;
}
