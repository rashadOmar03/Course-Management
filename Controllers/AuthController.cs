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
    public IActionResult Login(string username, string password)
    {
        var user = _context.Users
            .FirstOrDefault(u => u.Username == username && u.Password == password);

        if (user == null)
            return Unauthorized("Invalid credentials");

        var token = _jwt.GenerateToken(user);

        return Ok(token);
    }
}