using Microsoft.EntityFrameworkCore;

public class EnrollmentService
{
    private readonly AppDbContext _context;

    public EnrollmentService(AppDbContext context)
    {
        _context = context;
    }

    private IQueryable<EnrollmentResponseDto> BaseQuery() =>
        _context.Enrollments
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
                IsApproved = e.IsApproved,
                Grade = e.Grade,
            });

    public Task<List<EnrollmentResponseDto>> GetAll() =>
        BaseQuery().ToListAsync();

    public Task<List<EnrollmentResponseDto>> GetPending() =>
        BaseQuery().Where(e => !e.IsApproved).ToListAsync();

    public Task<List<EnrollmentResponseDto>> GetByCourse(int courseId, bool approvedOnly = false) =>
        approvedOnly
            ? BaseQuery().Where(e => e.CourseId == courseId && e.IsApproved).ToListAsync()
            : BaseQuery().Where(e => e.CourseId == courseId).ToListAsync();

    public Task<List<EnrollmentResponseDto>> GetByStudent(int studentId) =>
        BaseQuery().Where(e => e.StudentId == studentId).ToListAsync();

    public async Task<List<EnrollmentResponseDto>> GetByInstructor(int instructorId, bool approvedOnly = true)
    {
        // Pull the instructor's course IDs first
        var courseIds = await _context.Courses
            .AsNoTracking()
            .Where(c => c.InstructorId == instructorId)
            .Select(c => c.Id)
            .ToListAsync();

        var query = BaseQuery().Where(e => courseIds.Contains(e.CourseId));
        if (approvedOnly) query = query.Where(e => e.IsApproved);
        return await query.ToListAsync();
    }

    public async Task<bool> InstructorTeachesCourse(int instructorId, int courseId)
    {
        return await _context.Courses
            .AsNoTracking()
            .AnyAsync(c => c.Id == courseId && c.InstructorId == instructorId);
    }

    public async Task<(bool Ok, string? Error)> Enroll(int studentId, int courseId, bool autoApprove)
    {
        var studentExists = await _context.Students.AnyAsync(s => s.Id == studentId);
        if (!studentExists) return (false, "Student not found.");

        var courseExists = await _context.Courses.AnyAsync(c => c.Id == courseId);
        if (!courseExists) return (false, "Course not found.");

        var already = await _context.Enrollments
            .AnyAsync(e => e.StudentId == studentId && e.CourseId == courseId);
        if (already) return (false, "Already enrolled or request pending.");

        _context.Enrollments.Add(new Enrollment
        {
            StudentId = studentId,
            CourseId = courseId,
            IsApproved = autoApprove,
        });
        await _context.SaveChangesAsync();
        return (true, null);
    }

    public async Task<(bool Ok, string? Error)> Approve(int studentId, int courseId)
    {
        var enrollment = await _context.Enrollments
            .FirstOrDefaultAsync(e => e.StudentId == studentId && e.CourseId == courseId);
        if (enrollment == null) return (false, "Enrollment request not found.");
        if (enrollment.IsApproved) return (false, "Already approved.");

        enrollment.IsApproved = true;
        await _context.SaveChangesAsync();
        return (true, null);
    }

    public async Task<(bool Ok, string? Error)> SetGrade(int studentId, int courseId, string? grade)
    {
        var enrollment = await _context.Enrollments
            .FirstOrDefaultAsync(e => e.StudentId == studentId && e.CourseId == courseId);
        if (enrollment == null) return (false, "Enrollment not found.");
        if (!enrollment.IsApproved) return (false, "Cannot grade a pending enrollment.");

        var trimmed = string.IsNullOrWhiteSpace(grade) ? null : grade.Trim();
        if (trimmed != null && trimmed.Length > 5) return (false, "Grade is too long.");

        enrollment.Grade = trimmed;
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
