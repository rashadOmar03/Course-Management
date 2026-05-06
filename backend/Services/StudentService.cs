using Microsoft.EntityFrameworkCore;

public class StudentService
{
    private readonly AppDbContext _context;

    public StudentService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<List<StudentResponseDto>> GetAll()
    {
        return await _context.Students
            .AsNoTracking()
            .OrderBy(s => s.Id)
            .Select(s => new StudentResponseDto
            {
                Id = s.Id,
                Name = s.Name,
                Email = s.Email
            })
            .ToListAsync();
    }

    public async Task<StudentResponseDto?> GetById(int id)
    {
        return await _context.Students
            .AsNoTracking()
            .Where(s => s.Id == id)
            .Select(s => new StudentResponseDto
            {
                Id = s.Id,
                Name = s.Name,
                Email = s.Email
            })
            .FirstOrDefaultAsync();
    }

    public async Task<(bool Ok, string? Error)> Update(int id, CreateStudentDto dto)
    {
        var student = await _context.Students.FindAsync(id);
        if (student == null) return (false, "Student not found.");

        var newEmail = dto.Email?.Trim() ?? string.Empty;
        if (!string.Equals(student.Email, newEmail, StringComparison.OrdinalIgnoreCase))
        {
            var emailTaken = await _context.Students
                .AnyAsync(s => s.Id != id && s.Email == newEmail);
            if (emailTaken) return (false, "Email already used by another student.");
        }

        student.Name = dto.Name.Trim();
        student.Email = newEmail;
        await _context.SaveChangesAsync();
        return (true, null);
    }

    public async Task<bool> Delete(int id)
    {
        var student = await _context.Students.FindAsync(id);
        if (student == null) return false;

        // detach linked user accounts
        var users = _context.Users.Where(u => u.StudentId == id);
        foreach (var user in users) user.StudentId = null;

        _context.Students.Remove(student);
        await _context.SaveChangesAsync();
        return true;
    }
}
