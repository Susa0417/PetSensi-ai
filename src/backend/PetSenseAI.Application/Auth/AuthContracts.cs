using MediatR;

namespace PetSenseAI.Application.Auth;

public sealed record RegisterCommand(
    string FirstName,
    string LastName,
    string Email,
    string Password) : IRequest<AuthResponse>;

public sealed record LoginCommand(string Email, string Password) : IRequest<AuthResponse>;

public sealed record RefreshTokenCommand(string RefreshToken) : IRequest<AuthResponse>;

public sealed record LogoutCommand(string RefreshToken) : IRequest;

public sealed record AuthResponse(
    Guid UserId,
    string FirstName,
    string LastName,
    string Email,
    string[] Roles,
    string AccessToken,
    string RefreshToken,
    DateTime ExpiresAt);

public interface IJwtTokenService
{
    string CreateAccessToken(Guid userId, string email, IEnumerable<string> roles, DateTime expiresAt);
    string CreateRefreshToken();
    string HashRefreshToken(string refreshToken);
}
