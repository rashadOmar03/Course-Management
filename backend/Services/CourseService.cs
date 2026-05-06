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
                InstructorId = c.InstructorId,
                InstructorName = c.Instructor!.Name,
                EnrollmentCount = c.Enrollments.Count,
            })
            .ToListAsync();
    }

    public async Task<CourseResponseDto?> GetById(int id)
    {
        return await _context.Courses
            .AsNoTracking()
            .Include(c => c.Instructor)
            .Where(c => c.Id == id)
            .Select(c => new CourseResponseDto
            {
                Id = c.Id,
                Title = c.Title,
                InstructorId = c.InstructorId,
                InstructorName = c.Instructor!.Name,
                EnrollmentCount = c.Enrollments.Count,
            })
            .FirstOrDefaultAsync();
    }

    public async Task<(CourseResponseDto? Result, string? Error)> Add(CreateCourseDto dto)
    {
        var instructor = await _context.Instructors.FindAsync(dto.InstructorId);
        if (instructor == null) return (null, "Instructor not found.");
        if (!instructor.IsApproved) return (null, "Instructor is not approved.");

        var course = new Course
        {
            Title = dto.Title.Trim(),
            InstructorId = dto.InstructorId
        };
        _context.Courses.Add(course);
        await _context.SaveChangesAsync();

        return (new CourseResponseDto
        {
            Id = course.Id,
            Title = course.Title,
            InstructorId = course.InstructorId,
            InstructorName = instructor.Name,
            EnrollmentCount = 0,
        }, null);
    }

    public async Task<(bool Ok, string? Error)> Update(int id, CreateCourseDto dto)
    {
        var course = await _context.Courses.FindAsync(id);
        if (course == null) return (false, "Course not found.");

        var instructor = await _context.Instructors.FindAsync(dto.InstructorId);
        if (instructor == null) return (false, "Instructor not found.");
        if (!instructor.IsApproved) return (false, "Instructor is not approved.");

        course.Title = dto.Title.Trim();
        course.InstructorId = dto.InstructorId;
        await _context.SaveChangesAsync();
        return (true, null);
    }

    public async Task<bool> Delete(int id)
    {
        var course = await _context.Courses.FindAsync(id);
        if (course == null) return false;

        _context.Courses.Remove(course);
        await _context.SaveChangesAsync();
        return true;
    }
}
