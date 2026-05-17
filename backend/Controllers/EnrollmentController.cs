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

    // Pending requests waiting for admin approval
    [HttpGet("pending")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Pending() => Ok(await _service.GetPending());

    [HttpGet("by-course/{courseId}")]
    public async Task<IActionResult> GetByCourse(int courseId)
    {
        if (User.IsInRole("Admin"))
            return Ok(await _service.GetByCourse(courseId));

        if (User.IsInRole("Instructor"))
        {
            var instructorId = GetClaimInt("instructorId");
            if (instructorId == null) return Forbid();
            if (!await _service.InstructorTeachesCourse(instructorId.Value, courseId))
                return Forbid();
            // Instructor only ever sees the approved roster of their course
            return Ok(await _service.GetByCourse(courseId, approvedOnly: true));
        }

        return Forbid();
    }

    [HttpGet("by-student/{studentId}")]
    [Authorize(Roles = "Admin,Instructor")]
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
        return Ok(await _service.GetByInstructor(instructorId.Value, approvedOnly: true));
    }

    // Admin-only: enroll any student in any course (auto-approved)
    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Enroll([FromBody] EnrollDto dto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var (ok, error) = await _service.Enroll(dto.StudentId, dto.CourseId, autoApprove: true);
        if (!ok) return BadRequest(new { message = error });
        return Ok(new { message = "Enrolled." });
    }

    // Admin-only: approve a pending enrollment request
    [HttpPost("{studentId}/{courseId}/approve")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Approve(int studentId, int courseId)
    {
        var (ok, error) = await _service.Approve(studentId, courseId);
        if (!ok) return BadRequest(new { message = error });
        return Ok(new { message = "Approved." });
    }

    // Admin-only: unenroll any student (also used to reject pending requests)
    [HttpDelete("{studentId}/{courseId}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Unenroll(int studentId, int courseId)
    {
        var ok = await _service.Unenroll(studentId, courseId);
        if (!ok) return NotFound();
        return Ok(new { message = "Unenrolled." });
    }

    // Student requests enrollment in a course (creates a pending request)
    [HttpPost("me/{courseId}")]
    [Authorize(Roles = "Student")]
    public async Task<IActionResult> SelfEnroll(int courseId)
    {
        var studentId = GetClaimInt("studentId");
        if (studentId == null) return Forbid();

        var (ok, error) = await _service.Enroll(studentId.Value, courseId, autoApprove: false);
        if (!ok) return BadRequest(new { message = error });
        return Ok(new { message = "Enrollment requested." });
    }

    // Student cancels their own enrollment / pending request
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

    // Instructor sets a grade on an enrollment in a course they teach
    [HttpPut("{studentId}/{courseId}/grade")]
    [Authorize(Roles = "Instructor,Admin")]
    public async Task<IActionResult> SetGrade(int studentId, int courseId, [FromBody] SetGradeDto dto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        if (User.IsInRole("Instructor"))
        {
            var instructorId = GetClaimInt("instructorId");
            if (instructorId == null) return Forbid();
            if (!await _service.InstructorTeachesCourse(instructorId.Value, courseId))
                return Forbid();
        }

        var (ok, error) = await _service.SetGrade(studentId, courseId, dto.Grade);
        if (!ok) return BadRequest(new { message = error });
        return Ok(new { message = "Grade saved." });
    }

    // Instructor adds a student to one of their own courses (auto-approved)
    [HttpPost("teaching/{courseId}/{studentId}")]
    [Authorize(Roles = "Instructor")]
    public async Task<IActionResult> InstructorEnroll(int courseId, int studentId)
    {
        var instructorId = GetClaimInt("instructorId");
        if (instructorId == null) return Forbid();
        if (!await _service.InstructorTeachesCourse(instructorId.Value, courseId))
            return Forbid();

        var (ok, error) = await _service.Enroll(studentId, courseId, autoApprove: true);
        if (!ok) return BadRequest(new { message = error });
        return Ok(new { message = "Student added to course." });
    }

    // Instructor removes a student from a course they teach
    [HttpDelete("teaching/{studentId}/{courseId}")]
    [Authorize(Roles = "Instructor")]
    public async Task<IActionResult> InstructorRemove(int studentId, int courseId)
    {
        var instructorId = GetClaimInt("instructorId");
        if (instructorId == null) return Forbid();
        if (!await _service.InstructorTeachesCourse(instructorId.Value, courseId))
            return Forbid();

        var ok = await _service.Unenroll(studentId, courseId);
        if (!ok) return NotFound();
        return Ok(new { message = "Student removed from course." });
    }

    private int? GetClaimInt(string claimType)
    {
        var raw = User.FindFirst(claimType)?.Value;
        return int.TryParse(raw, out var v) ? v : null;
    }
}
