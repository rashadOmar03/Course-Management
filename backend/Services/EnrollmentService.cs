using Microsoft.EntityFrameworkCore;

public class EnrollmentService
{
    private readonly AppDbContext _context;

    public EnrollmentService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<List<EnrollmentResponseDto>> GetAll()
    {
        return await _context.Enrollments
            .AsNoTracking()
            .Include(e => e.Student)
            .Include(e => e.Course)!.ThenInclude(c => c!.Instructor)
            .Select(e => new EnrollmentResponseDto
            {
                StudentId = e.StudentId,
                StudentName = e.Student!.Name,
                StudentEmail = e.Student.Email,
                CourseId = e.CourseId,
                CourseTitle = e.Course!.Title,
                InstructorName = e.Course.Instructor!.Name,
            })
            .ToListAsync();
    }

    public async Task<List<EnrollmentResponseDto>> GetByCourse(int courseId)
    {
        return await _context.Enrollments
            .AsNoTracking()
            .Include(e => e.Student)
            .Include(e => e.Course)!.ThenInclude(c => c!.Instructor)
            .Where(e => e.CourseId == courseId)
            .Select(e => new EnrollmentResponseDto
            {
                StudentId = e.StudentId,
                StudentName = e.Student!.Name,
                StudentEmail = e.Student.Email,
                CourseId = e.CourseId,
                CourseTitle = e.Course!.Title,
                InstructorName = e.Course.Instructor!.Name,
            })
            .ToListAsync();
    }

    public async Task<List<EnrollmentResponseDto>> GetByStudent(int studentId)
    {
        return await _context.Enrollments
            .AsNoTracking()
            .Include(e => e.Student)
            .Include(e => e.Course)!.ThenInclude(c => c!.Instructor)
            .Where(e => e.StudentId == studentId)
            .Select(e => new EnrollmentResponseDto
            {
                StudentId = e.StudentId,
                StudentName = e.Student!.Name,
                StudentEmail = e.Student.Email,
                CourseId = e.CourseId,
                CourseTitle = e.Course!.Title,
                InstructorName = e.Course.Instructor!.Name,
            })
            .ToListAsync();
    }

    public async Task<List<EnrollmentResponseDto>> GetByInstructor(int instructorId)
    {
        return await _context.Enrollments
            .AsNoTracking()
            .Include(e => e.Student)
            .Include(e => e.Course)!.ThenInclude(c => c!.Instructor)
            .Where(e => e.Course!.InstructorId == instructorId)
            .Select(e => new EnrollmentResponseDto
            {
                StudentId = e.StudentId,
                StudentName = e.Student!.Name,
                StudentEmail = e.Student.Email,
                CourseId = e.CourseId,
                CourseTitle = e.Course!.Title,
                InstructorName = e.Course.Instructor!.Name,
            })
            .ToListAsync();
    }

    public async Task<(bool Ok, string? Error)> Enroll(int studentId, int courseId)
    {
        var studentExists = await _context.Students.AnyAsync(s => s.Id == studentId);
        if (!studentExists) return (false, "Student not found.");

        var courseExists = await _context.Courses.AnyAsync(c => c.Id == courseId);
        if (!courseExists) return (false, "Course not found.");

        var already = await _context.Enrollments
            .AnyAsync(e => e.StudentId == studentId && e.CourseId == courseId);
        if (already) return (false, "Already enrolled.");

        _context.Enrollments.Add(new Enrollment { StudentId = studentId, CourseId = courseId });
        await _context.SaveChangesAsync();
        return (true, null);
    }

    public async Task<bool> Unenroll(int studentId, int courseId)
    {
        var enrollment = await _context.Enrollments
            .FirstOrDefaultAsync(e => e.StudentId == studentId && e.CourseId == courseId);
        if (enrollment == null) return false;

        _context.Enrollments.Remove(enrollment);
        await _context.SaveChangesAsync();
        return true;
    }
}
