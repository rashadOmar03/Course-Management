public class CourseResponseDto
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;

    public int InstructorId { get; set; }
    public string InstructorName { get; set; } = string.Empty;

    public int EnrollmentCount { get; set; }
}
