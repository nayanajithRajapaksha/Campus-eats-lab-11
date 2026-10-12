using System.Security.Claims;
using CampusEats.Api.Contracts;
using CampusEats.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Npgsql;
using CampusUser = CampusEats.Api.User;

namespace CampusEats.Api.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly CampusEatsDbContext _context;
    private readonly IPasswordHasher<CampusUser> _passwordHasher;
    private readonly JwtTokenService _tokenService;

    public AuthController(
        CampusEatsDbContext context,
        IPasswordHasher<CampusUser> passwordHasher,
        JwtTokenService tokenService)
    {
        _context = context;
        _passwordHasher = passwordHasher;
        _tokenService = tokenService;
    }

    [AllowAnonymous]
    [HttpPost("register")]
    public async Task<ActionResult<AuthResponse>> Register(
        RegisterRequest request,
        CancellationToken cancellationToken)
    {
        var email = request.Email.Trim();
        var normalizedEmail = NormalizeEmail(email);

        if (request.Name.Trim().Length < 2)
        {
            ModelState.AddModelError(nameof(request.Name), "Name must contain at least 2 non-space characters.");
            return ValidationProblem(ModelState);
        }

        _tokenService.EnsureConfigured();

        if (await _context.Users.AnyAsync(user => user.NormalizedEmail == normalizedEmail, cancellationToken))
        {
            return Conflict(new ProblemDetails
            {
                Title = "Account already exists",
                Detail = "An account with that email address already exists.",
                Status = StatusCodes.Status409Conflict
            });
        }

        var user = new CampusUser
        {
            Name = request.Name.Trim(),
            Email = email,
            NormalizedEmail = normalizedEmail,
            CreatedAtUtc = DateTime.UtcNow
        };

        user.PasswordHash = _passwordHasher.HashPassword(user, request.Password);
        _context.Users.Add(user);

        try
        {
            await _context.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateException exception)
            when (exception.InnerException is PostgresException
            {
                SqlState: PostgresErrorCodes.UniqueViolation
            })
        {
            return Conflict(new ProblemDetails
            {
                Title = "Account already exists",
                Detail = "An account with that email address already exists.",
                Status = StatusCodes.Status409Conflict
            });
        }

        var response = CreateAuthResponse(user);
        return StatusCode(StatusCodes.Status201Created, response);
    }

    [AllowAnonymous]
    [HttpPost("login")]
    public async Task<ActionResult<AuthResponse>> Login(
        LoginRequest request,
        CancellationToken cancellationToken)
    {
        _tokenService.EnsureConfigured();
        var normalizedEmail = NormalizeEmail(request.Email);
        var user = await _context.Users
            .SingleOrDefaultAsync(candidate => candidate.NormalizedEmail == normalizedEmail, cancellationToken);

        if (user is null)
        {
            return Unauthorized(new ProblemDetails
            {
                Title = "Unable to sign in",
                Detail = "The email or password is incorrect.",
                Status = StatusCodes.Status401Unauthorized
            });
        }

        var verification = _passwordHasher.VerifyHashedPassword(user, user.PasswordHash, request.Password);
        if (verification == PasswordVerificationResult.Failed)
        {
            return Unauthorized(new ProblemDetails
            {
                Title = "Unable to sign in",
                Detail = "The email or password is incorrect.",
                Status = StatusCodes.Status401Unauthorized
            });
        }

        if (verification == PasswordVerificationResult.SuccessRehashNeeded)
        {
            user.PasswordHash = _passwordHasher.HashPassword(user, request.Password);
            await _context.SaveChangesAsync(cancellationToken);
        }

        return Ok(CreateAuthResponse(user));
    }

    [Authorize]
    [HttpGet("me")]
    public async Task<ActionResult<UserResponse>> Me(CancellationToken cancellationToken)
    {
        if (!TryGetUserId(out var userId))
        {
            return Unauthorized();
        }

        var user = await _context.Users
            .AsNoTracking()
            .Where(candidate => candidate.Id == userId)
            .Select(candidate => new UserResponse(candidate.Id, candidate.Name, candidate.Email))
            .SingleOrDefaultAsync(cancellationToken);

        return user is null ? Unauthorized() : Ok(user);
    }

    private AuthResponse CreateAuthResponse(CampusUser user) =>
        new(_tokenService.CreateToken(user), new UserResponse(user.Id, user.Name, user.Email));

    private bool TryGetUserId(out int userId) =>
        int.TryParse(
            User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub"),
            out userId);

    private static string NormalizeEmail(string email) => email.Trim().ToUpperInvariant();
}
