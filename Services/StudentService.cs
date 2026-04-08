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
            .AsNoTracking() // REQUIRED
            .Select(s => new StudentResponseDto
            {
                Id = s.Id,
                Name = s.Name
            })
            .ToListAsync();
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
}