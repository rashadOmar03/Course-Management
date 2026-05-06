using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class InstructorController : ControllerBase
{
    private readonly InstructorService _service;

    public InstructorController(InstructorService service)
    {
        _service = service;
    }

    // Anyone authenticated can see the approved instructor catalog
    [HttpGet]
    public async Task<IActionResult> Get() => Ok(await _service.GetAll(approvedOnly: true));

    // Admin-only: see ALL (including pending)
    [HttpGet("all")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> GetAll() => Ok(await _service.GetAll(approvedOnly: false));

    [HttpGet("pending")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> GetPending() => Ok(await _service.GetPending());

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var instructor = await _service.GetById(id);
        if (instructor == null) return NotFound();
        return Ok(instructor);
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Create(CreateInstructorDto dto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var (result, error) = await _service.Add(dto);
        if (error != null) return BadRequest(new { message = error });
        return Ok(result);
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Update(int id, CreateInstructorDto dto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var ok = await _service.Update(id, dto);
        if (!ok) return NotFound();
        return Ok(new { message = "Instructor updated." });
    }

    [HttpPost("{id}/approve")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Approve(int id)
    {
        var ok = await _service.Approve(id);
        if (!ok) return NotFound();
        return Ok(new { message = "Instructor approved." });
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(int id)
    {
        var (ok, error) = await _service.Delete(id);
        if (!ok) return BadRequest(new { message = error });
        return Ok(new { message = "Instructor deleted." });
    }
}
