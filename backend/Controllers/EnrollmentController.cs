using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class EnrollmentController : ControllerBase
{
    private readonly EnrollmentService _service;

    public EnrollmentController(EnrollmentService service)
    {
        _service = service;
    }

    [HttpGet]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> GetAll() => Ok(await _service.GetAll());

    [HttpGet("by-course/{courseId}")]
    public async Task<IActionResult> GetByCourse(int courseId)
    {
        // Admin and the instructor of that course can see this
        if (User.IsInRole("Admin"))
            return Ok(await _service.GetByCourse(courseId));

        if (User.IsInRole("Instructor"))
        {
            var instructorId = GetClaimInt("instructorId");
            if (instructorId == null) return Forbid();
            // Confirm course belongs to this instructor
            var enrollments = await _service.GetByCourse(courseId);
            // GetByCourse already includes instructor via Course; we filter out anything not belonging
            // Cheap approach: if any record has CourseId then check via GetByInstructor
            var mine = await _service.GetByInstructor(instructorId.Value);
            if (!mine.Any(e => e.CourseId == courseId) && enrollments.Count > 0)
                return Forbid();
            return Ok(enrollments);
        }

        return Forbid();
    }

    [HttpGet("by-student/{studentId}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> GetByStudent(int studentId)
        => Ok(await _service.GetByStudent(studentId));

    [HttpGet("me")]
    [Authorize(Roles = "Student")]
    public async Task<IActionResult> Mine()
    {
        var studentId = GetClaimInt("studentId");
        if (studentId == null) return Forbid();
        return Ok(await _service.GetByStudent(studentId.Value));
    }

    [HttpGet("teaching")]
    [Authorize(Roles = "Instructor")]
    public async Task<IActionResult> Teaching()
    {
        var instructorId = GetClaimInt("instructorId");
        if (instructorId == null) return Forbid();
        return Ok(await _service.GetByInstructor(instructorId.Value));
    }

    // Admin-only: enroll any student in any course
    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Enroll([FromBody] EnrollDto dto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var (ok, error) = await _service.Enroll(dto.StudentId, dto.CourseId);
        if (!ok) return BadRequest(new { message = error });
        return Ok(new { message = "Enrolled." });
    }

    // Admin-only: unenroll any student
    [HttpDelete("{studentId}/{courseId}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Unenroll(int studentId, int courseId)
    {
        var ok = await _service.Unenroll(studentId, courseId);
        if (!ok) return NotFound();
        return Ok(new { message = "Unenrolled." });
    }

    // Student self-enrolls in a course
    [HttpPost("me/{courseId}")]
    [Authorize(Roles = "Student")]
    public async Task<IActionResult> SelfEnroll(int courseId)
    {
        var studentId = GetClaimInt("studentId");
        if (studentId == null) return Forbid();

        var (ok, error) = await _service.Enroll(studentId.Value, courseId);
        if (!ok) return BadRequest(new { message = error });
        return Ok(new { message = "Enrolled." });
    }

    // Student self-unenrolls
    [HttpDelete("me/{courseId}")]
    [Authorize(Roles = "Student")]
    public async Task<IActionResult> SelfUnenroll(int courseId)
    {
        var studentId = GetClaimInt("studentId");
        if (studentId == null) return Forbid();

        var ok = await _service.Unenroll(studentId.Value, courseId);
        if (!ok) return NotFound();
        return Ok(new { message = "Unenrolled." });
    }

    private int? GetClaimInt(string claimType)
    {
        var raw = User.FindFirst(claimType)?.Value;
        return int.TryParse(raw, out var v) ? v : null;
    }
}
