using System.ComponentModel.DataAnnotations;

public class CreateStudentDto
{
    [Required]
    [MaxLength(100)]
    public string Name { get; set; }

    [EmailAddress]
    public string Email { get; set; }
}