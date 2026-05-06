using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using Microsoft.OpenApi.Models;

var builder = WebApplication.CreateBuilder(args);

// Swagger
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo { Title = "CourseManagement", Version = "v1" });

    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Enter: Bearer YOUR_TOKEN"
    });

    options.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            new string[] {}
        }
    });
});

// Database
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// Services
builder.Services.AddScoped<StudentService>();
builder.Services.AddScoped<CourseService>();
builder.Services.AddScoped<InstructorService>();
builder.Services.AddScoped<EnrollmentService>();
builder.Services.AddScoped<AuthService>();
builder.Services.AddScoped<JwtService>();

// CORS - allow the React dev server (Vite default) to call the API
const string FrontendCors = "FrontendCors";
builder.Services.AddCors(options =>
{
    options.AddPolicy(FrontendCors, policy =>
    {
        policy.WithOrigins(
                "http://localhost:5173",
                "http://localhost:5174",
                "http://127.0.0.1:5173"
            )
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

// Authentication
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = false,
            ValidateAudience = false,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(JwtService.SecretKey))
        };
    });

builder.Services.AddAuthorization();
builder.Services.AddControllers();

var app = builder.Build();

// Middlewares
app.UseCors(FrontendCors);

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

// Seed default admin + repair any legacy data
using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();

    // 1) Re-hash any plain-text passwords (legacy users from before BCrypt)
    var legacyUsers = context.Users
        .Where(u => u.PasswordHash != null && !u.PasswordHash.StartsWith("$2"))
        .ToList();
    foreach (var user in legacyUsers)
    {
        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(user.PasswordHash);
    }
    if (legacyUsers.Count > 0) context.SaveChanges();

    // 2) Patch up legacy instructors that lack Email / IsApproved
    var legacyInstructors = context.Instructors
        .Where(i => i.Email == "")
        .ToList();
    foreach (var instructor in legacyInstructors)
    {
        var slug = new string(instructor.Name
            .ToLowerInvariant()
            .Where(char.IsLetterOrDigit)
            .ToArray());
        if (string.IsNullOrEmpty(slug)) slug = $"instructor{instructor.Id}";
        instructor.Email = $"{slug}@example.com";
        instructor.IsApproved = true;
    }
    if (legacyInstructors.Count > 0) context.SaveChanges();

    // 3) Seed default admin if there isn't one
    if (!context.Users.Any(u => u.Role == "Admin"))
    {
        context.Users.Add(new User
        {
            Username = "omar",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("1234"),
            Role = "Admin"
        });
        context.SaveChanges();
    }

    // 4) Seed default instructor if none exist
    if (!context.Instructors.Any())
    {
        context.Instructors.Add(new Instructor
        {
            Name = "Dr. Ahmed",
            Email = "ahmed@example.com",
            IsApproved = true
        });
        context.SaveChanges();
    }
}

// Swagger
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.Run();
