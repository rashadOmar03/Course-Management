using Microsoft.EntityFrameworkCore;

public class AuthService
{
    private readonly AppDbContext _context;
    private readonly JwtService _jwt;

    public AuthService(AppDbContext context, JwtService jwt)
    {
        _context = context;
        _jwt = jwt;
    }

    public async Task<AuthResponseDto?> Login(string username, string password)
    {
        var user = await _context.Users
            .Include(u => u.Instructor)
            .FirstOrDefaultAsync(u => u.Username == username);

        if (user == null) return null;
        if (!BCrypt.Net.BCrypt.Verify(password, user.PasswordHash)) return null;

        return BuildResponse(user);
    }

    public async Task<(AuthResponseDto? Result, string? Error)> SignupStudent(SignupStudentDto dto)
    {
        var username = dto.Username.Trim();
        var email = dto.Email.Trim();

        if (await _context.Users.AnyAsync(u => u.Username == username))
            return (null, "Username already taken.");

        if (await _context.Students.AnyAsync(s => s.Email == email))
            return (null, "Email already registered.");

        var student = new Student { Name = dto.Name.Trim(), Email = email };
        _context.Students.Add(student);
        await _context.SaveChangesAsync();

        var user = new User
        {
            Username = username,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
            Role = "Student",
            StudentId = student.Id,
        };
        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        return (BuildResponse(user), null);
    }

    public async Task<(AuthResponseDto? Result, string? Error)> SignupInstructor(SignupInstructorDto dto)
    {
        var username = dto.Username.Trim();
        var email = dto.Email.Trim();

        if (await _context.Users.AnyAsync(u => u.Username == username))
            return (null, "Username already taken.");

        if (await _context.Instructors.AnyAsync(i => i.Email == email))
            return (null, "Email already registered.");

        var instructor = new Instructor
        {
            Name = dto.Name.Trim(),
            Email = email,
            IsApproved = false,
            Profile = string.IsNullOrWhiteSpace(dto.Bio)
                ? null
                : new InstructorProfile { Bio = dto.Bio.Trim() }
        };
        _context.Instructors.Add(instructor);
        await _context.SaveChangesAsync();

        var user = new User
        {
            Username = username,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
            Role = "Instructor",
            InstructorId = instructor.Id,
        };
        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        // re-load with instructor for IsApproved flag
        user.Instructor = instructor;
        return (BuildResponse(user), null);
    }

    public async Task<(AdminResponseDto? Result, string? Error)> CreateAdmin(CreateAdminDto dto)
    {
        var username = dto.Username.Trim();

        if (await _context.Users.AnyAsync(u => u.Username == username))
            return (null, "Username already taken.");

        var user = new User
        {
            Username = username,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
            Role = "Admin"
        };
        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        return (new AdminResponseDto { Id = user.Id, Username = user.Username }, null);
    }

    public async Task<List<AdminResponseDto>> GetAdmins()
    {
        return await _context.Users
            .AsNoTracking()
            .Where(u => u.Role == "Admin")
            .Select(u => new AdminResponseDto { Id = u.Id, Username = u.Username })
            .ToListAsync();
    }

    public async Task<bool> DeleteAdmin(int id)
    {
        var admin = await _context.Users.FirstOrDefaultAsync(u => u.Id == id && u.Role == "Admin");
        if (admin == null) return false;

        // Don't allow deleting the last admin
        var adminCount = await _context.Users.CountAsync(u => u.Role == "Admin");
        if (adminCount <= 1) return false;

        _context.Users.Remove(admin);
        await _context.SaveChangesAsync();
        return true;
    }

    public AuthResponseDto BuildResponse(User user) => new()
    {
        Token = _jwt.GenerateToken(user),
        UserId = user.Id,
        Username = user.Username,
        Role = user.Role,
        StudentId = user.StudentId,
        InstructorId = user.InstructorId,
        IsApprovedInstructor = user.Instructor?.IsApproved ?? false,
    };
}
