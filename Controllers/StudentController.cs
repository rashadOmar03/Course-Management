using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class StudentController : ControllerBase
{
    private readonly StudentService _service;

    public StudentController(StudentService service)
    {
        _service = service;
    }

    [HttpGet]
    public async Task<IActionResult> Get()
    {
        return Ok(await _service.GetAll());
    }

    [HttpPost]
    public async Task<IActionResult> Create(CreateStudentDto dto)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        await _service.Add(dto);
        return Ok("Student created");
    }
}