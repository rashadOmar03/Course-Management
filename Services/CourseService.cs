using Microsoft.EntityFrameworkCore;

public class CourseService
{
    private readonly AppDbContext _context;

    public CourseService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<List<CourseResponseDto>> GetAll()
    {
        return await _context.Courses
            .AsNoTracking()
            .Include(c => c.Instructor)
            .Select(c => new CourseResponseDto
            {
                Id = c.Id,
                Title = c.Title,
                InstructorName = c.Instructor.Name
            })
            .ToListAsync();
    }

    public async Task Add(CreateCourseDto dto)
    {
        var course = new Course
        {
            Title = dto.Title,
            InstructorId = dto.InstructorId
        };

        _context.Courses.Add(course);
        await _context.SaveChangesAsync();
    }
}