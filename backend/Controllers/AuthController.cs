using Microsoft.AspNetCore.Mvc;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly JwtService _jwt;

    public AuthController(AppDbContext context, JwtService jwt)
    {
        _context = context;
        _jwt = jwt;
    }

    [HttpPost("login")]
    public IActionResult Login([FromBody] LoginDto dto)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var user = _context.Users
            .FirstOrDefault(u => u.Username == dto.Username && u.Password == dto.Password);

        if (user == null)
            return Unauthorized(new { message = "Invalid credentials" });

        var token = _jwt.GenerateToken(user);

        return Ok(new { token, username = user.Username, role = user.Role });
    }
}
