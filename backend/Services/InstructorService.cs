using Microsoft.EntityFrameworkCore;

public class InstructorService
{
    private readonly AppDbContext _context;

    public InstructorService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<List<InstructorResponseDto>> GetAll(bool approvedOnly = false)
    {
        var query = _context.Instructors.AsNoTracking().Include(i => i.Profile).AsQueryable();
        if (approvedOnly) query = query.Where(i => i.IsApproved);

        return await query
            .Select(i => new InstructorResponseDto
            {
                Id = i.Id,
                Name = i.Name,
                Email = i.Email,
                IsApproved = i.IsApproved,
                Bio = i.Profile != null ? i.Profile.Bio : string.Empty,
                Username = _context.Users
                    .Where(u => u.InstructorId == i.Id)
                    .Select(u => u.Username)
                    .FirstOrDefault(),
            })
            .ToListAsync();
    }

    public async Task<List<InstructorResponseDto>> GetPending()
    {
        return await _context.Instructors
            .AsNoTracking()
            .Include(i => i.Profile)
            .Where(i => !i.IsApproved)
            .Select(i => new InstructorResponseDto
            {
                Id = i.Id,
                Name = i.Name,
                Email = i.Email,
                IsApproved = i.IsApproved,
                Bio = i.Profile != null ? i.Profile.Bio : string.Empty,
                Username = _context.Users
                    .Where(u => u.InstructorId == i.Id)
                    .Select(u => u.Username)
                    .FirstOrDefault(),
            })
            .ToListAsync();
    }

    public async Task<InstructorResponseDto?> GetById(int id)
    {
        return await _context.Instructors
            .AsNoTracking()
            .Include(i => i.Profile)
            .Where(i => i.Id == id)
            .Select(i => new InstructorResponseDto
            {
                Id = i.Id,
                Name = i.Name,
                Email = i.Email,
                IsApproved = i.IsApproved,
                Bio = i.Profile != null ? i.Profile.Bio : string.Empty,
                Username = _context.Users
                    .Where(u => u.InstructorId == i.Id)
                    .Select(u => u.Username)
                    .FirstOrDefault(),
            })
            .FirstOrDefaultAsync();
    }

    public async Task<(InstructorResponseDto? Result, string? Error)> Add(CreateInstructorDto dto)
    {
        var email = dto.Email.Trim();
        var username = dto.Username.Trim();

        if (await _context.Instructors.AnyAsync(i => i.Email == email))
            return (null, "Email already used by another instructor.");

        if (await _context.Users.AnyAsync(u => u.Username == username))
            return (null, "Username already taken.");

        var instructor = new Instructor
        {
            Name = dto.Name.Trim(),
            Email = email,
            IsApproved = true, // admin-created instructors are pre-approved
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

        return (new InstructorResponseDto
        {
            Id = instructor.Id,
            Name = instructor.Name,
            Email = instructor.Email,
            IsApproved = instructor.IsApproved,
            Bio = instructor.Profile?.Bio ?? string.Empty,
            Username = username,
        }, null);
    }

    public async Task<bool> Update(int id, UpdateInstructorDto dto)
    {
        var instructor = await _context.Instructors
            .Include(i => i.Profile)
            .FirstOrDefaultAsync(i => i.Id == id);
        if (instructor == null) return false;

        instructor.Name = dto.Name.Trim();
        instructor.Email = dto.Email.Trim();

        var bio = dto.Bio?.Trim() ?? string.Empty;
        if (instructor.Profile == null)
        {
            if (!string.IsNullOrEmpty(bio))
                instructor.Profile = new InstructorProfile { Bio = bio, InstructorId = instructor.Id };
        }
        else
        {
            instructor.Profile.Bio = bio;
        }

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> Approve(int id)
    {
        var instructor = await _context.Instructors.FindAsync(id);
        if (instructor == null) return false;

        instructor.IsApproved = true;
        await _context.SaveChangesAsync();
        return true;
    }

    // Create or update the login credentials for an instructor.
    // If no User exists yet for this instructor, one is created.
    // If a User already exists, its username and password are updated.
    public async Task<(bool Ok, string? Error)> SetCredentials(int id, SetInstructorCredentialsDto dto)
    {
        var instructor = await _context.Instructors.FindAsync(id);
        if (instructor == null) return (false, "Instructor not found.");

        var username = dto.Username.Trim();
        var existing = await _context.Users.FirstOrDefaultAsync(u => u.InstructorId == id);

        // Check username uniqueness (allow keeping current username for the same user).
        var usernameTaken = await _context.Users
            .AnyAsync(u => u.Username == username && (existing == null || u.Id != existing.Id));
        if (usernameTaken) return (false, "Username already taken.");

        if (existing == null)
        {
            _context.Users.Add(new User
            {
                Username = username,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
                Role = "Instructor",
                InstructorId = id,
            });
        }
        else
        {
            existing.Username = username;
            existing.PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password);
            existing.Role = "Instructor";
        }

        await _context.SaveChangesAsync();
        return (true, null);
    }

    public async Task<(bool Ok, string? Error)> Delete(int id)
    {
        var instructor = await _context.Instructors
            .Include(i => i.Courses)
            .FirstOrDefaultAsync(i => i.Id == id);
        if (instructor == null) return (false, "Instructor not found.");

        if (instructor.Courses.Any())
            return (false, "Cannot delete an instructor that is assigned to courses.");

        // Remove any linked login account so the username is freed.
        var linkedUsers = _context.Users.Where(u => u.InstructorId == id);
        _context.Users.RemoveRange(linkedUsers);

        _context.Instructors.Remove(instructor);
        await _context.SaveChangesAsync();
        return (true, null);
    }
}
