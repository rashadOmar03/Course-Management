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
                InstructorName = c.Instructor.Name
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
                InstructorName = c.Instructor.Name
            })
            .FirstOrDefaultAsync();
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

    public async Task<bool> Update(int id, CreateCourseDto dto)
    {
        var course = await _context.Courses.FindAsync(id);
        if (course == null) return false;

        course.Title = dto.Title;
        course.InstructorId = dto.InstructorId;

        await _context.SaveChangesAsync();
        return true;
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
