using System.ComponentModel.DataAnnotations;

public class SetGradeDto
{
    [MaxLength(5)]
    public string? Grade { get; set; }
}
