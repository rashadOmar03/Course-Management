using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin")]
public class StudentController : ControllerBase
{
    private readonly StudentService _service;

    public StudentController(StudentService service)
    {
        _service = service;
    }

    [HttpGet]
    public async Task<IActionResult> Get() => Ok(await _service.GetAll());

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var student = await _service.GetById(id);
        if (student == null) return NotFound();
        return Ok(student);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, CreateStudentDto dto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var (ok, error) = await _service.Update(id, dto);
        if (!ok) return BadRequest(new { message = error });
        return Ok(new { message = "Student updated." });
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var ok = await _service.Delete(id);
        if (!ok) return NotFound();
        return Ok(new { message = "Student deleted." });
    }
}
