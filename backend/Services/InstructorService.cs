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
            })
            .FirstOrDefaultAsync();
    }

    public async Task<(InstructorResponseDto? Result, string? Error)> Add(CreateInstructorDto dto)
    {
        var email = dto.Email.Trim();
        if (await _context.Instructors.AnyAsync(i => i.Email == email))
            return (null, "Email already used by another instructor.");

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

        return (new InstructorResponseDto
        {
            Id = instructor.Id,
            Name = instructor.Name,
            Email = instructor.Email,
            IsApproved = instructor.IsApproved,
            Bio = instructor.Profile?.Bio ?? string.Empty,
        }, null);
    }

    public async Task<bool> Update(int id, CreateInstructorDto dto)
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

    public async Task<(bool Ok, string? Error)> Delete(int id)
    {
        var instructor = await _context.Instructors
            .Include(i => i.Courses)
            .FirstOrDefaultAsync(i => i.Id == id);
        if (instructor == null) return (false, "Instructor not found.");

        if (instructor.Courses.Any())
            return (false, "Cannot delete an instructor that is assigned to courses.");

        _context.Instructors.Remove(instructor);
        await _context.SaveChangesAsync();
        return (true, null);
    }
}
