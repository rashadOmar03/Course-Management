using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

[ApiController]
[Route("api/[controller]")]
public class InstructorController : ControllerBase
{
    private readonly AppDbContext _context;

    public InstructorController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> Get()
    {
        var instructors = await _context.Instructors
            .AsNoTracking()
            .Select(i => new { i.Id, i.Name })
            .ToListAsync();

        return Ok(instructors);
    }
}
