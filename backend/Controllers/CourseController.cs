using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class CourseController : ControllerBase
{
    private readonly CourseService _service;

    public CourseController(CourseService service)
    {
        _service = service;
    }

    [HttpGet]
    public async Task<IActionResult> Get() => Ok(await _service.GetAll());

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var course = await _service.GetById(id);
        if (course == null) return NotFound();
        return Ok(course);
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Create(CreateCourseDto dto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var (result, error) = await _service.Add(dto);
        if (error != null) return BadRequest(new { message = error });
        return Ok(result);
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Update(int id, CreateCourseDto dto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var (ok, error) = await _service.Update(id, dto);
        if (!ok) return BadRequest(new { message = error });
        return Ok(new { message = "Course updated." });
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(int id)
    {
        var ok = await _service.Delete(id);
        if (!ok) return NotFound();
        return Ok(new { message = "Course deleted." });
    }
}
