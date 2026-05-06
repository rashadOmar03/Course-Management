using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using Microsoft.EntityFrameworkCore;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly AuthService _auth;
    private readonly AppDbContext _context;

    public AuthController(AuthService auth, AppDbContext context)
    {
        _auth = auth;
        _context = context;
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginDto dto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var result = await _auth.Login(dto.Username.Trim(), dto.Password);
        if (result == null) return Unauthorized(new { message = "Invalid credentials." });

        return Ok(result);
    }

    [HttpPost("signup/student")]
    public async Task<IActionResult> SignupStudent([FromBody] SignupStudentDto dto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var (result, error) = await _auth.SignupStudent(dto);
        if (error != null) return BadRequest(new { message = error });

        return Ok(result);
    }

    [HttpPost("signup/instructor")]
    public async Task<IActionResult> SignupInstructor([FromBody] SignupInstructorDto dto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var (result, error) = await _auth.SignupInstructor(dto);
        if (error != null) return BadRequest(new { message = error });

        return Ok(result);
    }

    [HttpGet("me")]
    [Authorize]
    public async Task<IActionResult> Me()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!int.TryParse(userIdClaim, out var userId)) return Unauthorized();

        var user = await _context.Users
            .Include(u => u.Instructor)
            .Include(u => u.Student)
            .FirstOrDefaultAsync(u => u.Id == userId);

        if (user == null) return Unauthorized();

        return Ok(new
        {
            userId = user.Id,
            username = user.Username,
            role = user.Role,
            studentId = user.StudentId,
            instructorId = user.InstructorId,
            isApprovedInstructor = user.Instructor?.IsApproved ?? false,
            studentName = user.Student?.Name,
            studentEmail = user.Student?.Email,
            instructorName = user.Instructor?.Name,
            instructorEmail = user.Instructor?.Email,
        });
    }

    // Admin management (admin-only)

    [HttpGet("admins")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> GetAdmins() => Ok(await _auth.GetAdmins());

    [HttpPost("admins")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> CreateAdmin([FromBody] CreateAdminDto dto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var (result, error) = await _auth.CreateAdmin(dto);
        if (error != null) return BadRequest(new { message = error });

        return Ok(result);
    }

    [HttpDelete("admins/{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> DeleteAdmin(int id)
    {
        var currentIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (int.TryParse(currentIdClaim, out var currentId) && currentId == id)
            return BadRequest(new { message = "You cannot delete your own admin account." });

        var ok = await _auth.DeleteAdmin(id);
        if (!ok) return BadRequest(new { message = "Cannot delete: not found, not an admin, or this is the last admin." });

        return Ok(new { message = "Admin deleted." });
    }
}
