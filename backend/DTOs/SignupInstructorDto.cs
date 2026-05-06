using System.ComponentModel.DataAnnotations;

public class SignupInstructorDto
{
    [Required, MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    [Required, EmailAddress]
    public string Email { get; set; } = string.Empty;

    [Required, MaxLength(50)]
    public string Username { get; set; } = string.Empty;

    [Required, MinLength(4)]
    public string Password { get; set; } = string.Empty;

    public string Bio { get; set; } = string.Empty;
}
