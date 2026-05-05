public class Instructor
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;

    public InstructorProfile Profile { get; set; }

    public List<Course> Courses { get; set; }
}