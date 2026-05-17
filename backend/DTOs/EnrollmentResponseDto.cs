public class EnrollmentResponseDto
{
    public int StudentId { get; set; }
    public string StudentName { get; set; } = string.Empty;
    public string StudentEmail { get; set; } = string.Empty;

    public int CourseId { get; set; }
    public string CourseTitle { get; set; } = string.Empty;
    public string InstructorName { get; set; } = string.Empty;

    public bool IsApproved { get; set; }
    public string? Grade { get; set; }
}
