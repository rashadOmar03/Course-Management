using System.ComponentModel.DataAnnotations;

public class EnrollDto
{
    [Required]
    public int StudentId { get; set; }

    [Required]
    public int CourseId { get; set; }
}
