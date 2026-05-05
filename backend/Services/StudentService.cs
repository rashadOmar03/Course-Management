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

    public async Task Add(CreateStudentDto dto)
    {
        var student = new Student
        {
            Name = dto.Name,
            Email = dto.Email
        };

        _context.Students.Add(student);
        await _context.SaveChangesAsync();
    }

    public async Task<bool> Update(int id, CreateStudentDto dto)
    {
        var student = await _context.Students.FindAsync(id);
        if (student == null) return false;

        student.Name = dto.Name;
        student.Email = dto.Email;

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> Delete(int id)
    {
        var student = await _context.Students.FindAsync(id);
        if (student == null) return false;

        _context.Students.Remove(student);
        await _context.SaveChangesAsync();
        return true;
    }
}
