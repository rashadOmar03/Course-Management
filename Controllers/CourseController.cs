using Microsoft.AspNetCore.Mvc;

[ApiController]
[Route("api/[controller]")]
public class CourseController : ControllerBase
{
    private readonly CourseService _service;

    public CourseController(CourseService service)
    {
        _service = service;
    }

    [HttpGet]
    public async Task<IActionResult> Get()
    {
        return Ok(await _service.GetAll());
    }

    [HttpPost]
    public async Task<IActionResult> Create(CreateCourseDto dto)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        await _service.Add(dto);
        return Ok("Course created");
    }
}