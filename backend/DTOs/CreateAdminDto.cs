using System.ComponentModel.DataAnnotations;

public class CreateAdminDto
{
    [Required, MaxLength(50)]
    public string Username { get; set; } = string.Empty;

    [Required, MinLength(4)]
    public string Password { get; set; } = string.Empty;
}
