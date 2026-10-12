using System.ComponentModel.DataAnnotations;

namespace CampusEats.Api.Contracts;

public sealed record RegisterRequest(
    [Required, StringLength(100, MinimumLength = 2)] string Name,
    [Required, EmailAddress, StringLength(254)] string Email,
    [Required, StringLength(128, MinimumLength = 8)] string Password);

public sealed record LoginRequest(
    [Required, EmailAddress, StringLength(254)] string Email,
    [Required] string Password);

public sealed record UserResponse(int Id, string Name, string Email);

public sealed record AuthResponse(string Token, UserResponse User);
