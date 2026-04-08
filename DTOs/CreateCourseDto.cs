using System.ComponentModel.DataAnnotations;

public class CreateCourseDto
{
    [Required]
    public string Title { get; set; } = string.Empty;

    public int InstructorId { get; set; }
}