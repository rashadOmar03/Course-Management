public class Enrollment
{
    public int StudentId { get; set; }
    public Student? Student { get; set; }

    public int CourseId { get; set; }
    public Course? Course { get; set; }

    // false = pending admin approval, true = approved (active)
    public bool IsApproved { get; set; }

    // null until the instructor records a grade (e.g. "A", "B+", "F")
    public string? Grade { get; set; }
}
